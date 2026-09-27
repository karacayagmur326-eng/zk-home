import "server-only"

import type { PoolClient } from "pg"
import { withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "./schema"
import { ensureMediaTrashSchema } from "./media-trash"

type MediaRow = {
  id: string
  url: string
  filename: string | null
  storage_key: string | null
}

type DeleteProductsOptions = {
  permanent?: boolean
  deleteMedia?: boolean
}

const PRODUCT_MEDIA_TABLES = new Set([
  "store_media",
  "store_product",
  "store_product_image",
  "store_variant",
])

// Only storefront content/configuration tables count as an external media use.
// Commerce image/order tables mirror product records and would otherwise make
// every product image look shared, preventing it from ever reaching the trash.
const EXTERNAL_MEDIA_REFERENCE_TABLES = new Set([
  "category_settings",
  "content_pages",
  "content_pages_deleted",
  "featured_section",
  "featured_tabs",
  "layout_configuration",
  "menu",
  "menu_item",
  "navigation_menu",
  "product_category",
  "product_collection",
  "product_reviews",
  "slider",
  "store_campaign",
  "store_category",
  "store_collection",
  "store_setting",
  "store_settings",
  "theme_settings",
  "view_configuration",
])

const validIdentifier = (value: string) => /^[a-z_][a-z0-9_]*$/i.test(value)

function decoded(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function filenameFromReference(value: string) {
  if (!value || value.startsWith("data:")) return ""
  try {
    const pathname = value.startsWith("http://") || value.startsWith("https://")
      ? new URL(value).pathname
      : value.split(/[?#]/, 1)[0]
    return decoded(pathname).split("/").filter(Boolean).pop() || ""
  } catch {
    return ""
  }
}

function managedFilenameFromReference(value: string) {
  if (!value || value.startsWith("data:")) return ""
  const normalized = decoded(value).replace(/\\/g, "/")
  const isManagedPath =
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("/media/") ||
    normalized.startsWith("/static/") ||
    !normalized.includes("/")
  return isManagedPath ? filenameFromReference(normalized) : ""
}

function mediaKeys(media: MediaRow) {
  return new Set(
    [
      media.url,
      decoded(media.url),
      media.filename || "",
      media.storage_key || "",
      filenameFromReference(media.url),
      filenameFromReference(media.storage_key || ""),
    ].filter(Boolean),
  )
}

function referencesMedia(reference: string, media: MediaRow) {
  const referenceKeys = new Set([
    reference,
    decoded(reference),
    filenameFromReference(reference),
  ])
  return [...mediaKeys(media)].some((key) => referenceKeys.has(key))
}

async function referencedOutsideProductTables(
  client: PoolClient,
  mediaRows: MediaRow[],
) {
  const candidates = mediaRows
    .map((media) => ({
      media_id: media.id,
      refs: [...mediaKeys(media)].filter((value) => value.length >= 4),
    }))
    .filter((candidate) => candidate.refs.length > 0)
  const referencedMediaIds = new Set<string>()
  if (!candidates.length) return referencedMediaIds

  const columns = await client.query<{ table_name: string; column_name: string }>(
    `SELECT table_name,column_name
     FROM information_schema.columns
     WHERE table_schema='public'
       AND table_name = ANY($1::text[])
       AND data_type IN ('text','character varying','json','jsonb')
       AND column_name ~* '(url|image|thumbnail|media|logo|icon|banner|photo|content|config|setting|metadata|value|data|json|gallery|file|avatar|picture|cover)'`,
    [[...EXTERNAL_MEDIA_REFERENCE_TABLES]],
  )

  const searchableColumns = columns.rows.filter(
    (column) =>
      !PRODUCT_MEDIA_TABLES.has(column.table_name) &&
      EXTERNAL_MEDIA_REFERENCE_TABLES.has(column.table_name) &&
      validIdentifier(column.table_name) &&
      validIdentifier(column.column_name),
  )

  // Every chunk checks all media in one database round-trip. The former
  // implementation executed one query per media and per column, which made a
  // ten-product bulk delete issue thousands of sequential queries.
  const chunkSize = 24
  for (let index = 0; index < searchableColumns.length; index += chunkSize) {
    const chunk = searchableColumns.slice(index, index + chunkSize)
    const unions = chunk.map(
      ({ table_name, column_name }) => `
        SELECT candidate.media_id
        FROM jsonb_to_recordset($1::jsonb) AS candidate(media_id text, refs jsonb)
        WHERE EXISTS (
          SELECT 1
          FROM "${table_name}" AS source
          WHERE EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(candidate.refs) AS reference(value)
            WHERE strpos(source."${column_name}"::text, reference.value) > 0
          )
        )`,
    )
    if (!unions.length) continue

    const result = await client.query<{ media_id: string }>(
      `SELECT DISTINCT media_id FROM (${unions.join(" UNION ALL ")}) AS used_media`,
      [JSON.stringify(candidates)],
    )
    result.rows.forEach((row) => referencedMediaIds.add(row.media_id))
  }

  return referencedMediaIds
}

export async function deleteProductsWithMedia(
  productIds: string[],
  options: DeleteProductsOptions = {},
) {
  await ensureCommerceSchema()
  if (options.deleteMedia) await ensureMediaTrashSchema()
  const ids = [...new Set(productIds.map(String).filter(Boolean))]
  if (!ids.length) {
    return { deletedProducts: 0, deletedMedia: 0, skippedSharedMedia: 0 }
  }

  const transactionResult = await withTransaction(async (client) => {
    await client.query("SET LOCAL lock_timeout = '5s'")
    await client.query("SET LOCAL statement_timeout = '20s'")
    let mediaRows: MediaRow[] = []

    if (options.deleteMedia) {
      const refsResult = await client.query<{ url: string }>(
        `SELECT thumbnail AS url FROM store_product
         WHERE id = ANY($1::text[]) AND thumbnail IS NOT NULL
         UNION
         SELECT url FROM store_product_image
         WHERE product_id = ANY($1::text[]) AND url IS NOT NULL
         UNION
         SELECT thumbnail AS url FROM store_variant
         WHERE product_id = ANY($1::text[]) AND thumbnail IS NOT NULL`,
        [ids],
      )
      const references = refsResult.rows.map((row) => row.url).filter(Boolean)
      const filenames = [...new Set(references.map(managedFilenameFromReference).filter(Boolean))]

      if (references.length || filenames.length) {
        const result = await client.query<MediaRow>(
          `SELECT id,url,filename,storage_key
           FROM store_media
           WHERE url = ANY($1::text[])
              OR filename = ANY($2::text[])
              OR storage_key = ANY($2::text[])
              OR regexp_replace(COALESCE(storage_key,''), '^uploads/', '') = ANY($2::text[])`,
          [references, filenames],
        )
        mediaRows = result.rows
      }

    }

    const deletedResult = options.permanent
      ? await client.query<{ id: string }>(
          `DELETE FROM store_product WHERE id = ANY($1::text[]) RETURNING id`,
          [ids],
        )
      : await client.query<{ id: string }>(
          `UPDATE store_product
           SET status='deleted',deleted_at=NOW(),updated_at=NOW()
           WHERE id = ANY($1::text[])
           RETURNING id`,
          [ids],
        )

    if (!options.deleteMedia || !mediaRows.length) {
      return {
        deletedProducts: deletedResult.rows.length,
        deletedMediaRows: [] as MediaRow[],
        skippedSharedMedia: 0,
      }
    }

    const otherProductRefs = await client.query<{ url: string }>(
      `SELECT thumbnail AS url FROM store_product
       WHERE NOT (id = ANY($1::text[])) AND thumbnail IS NOT NULL
       UNION
       SELECT url FROM store_product_image
       WHERE NOT (product_id = ANY($1::text[])) AND url IS NOT NULL
       UNION
       SELECT thumbnail AS url FROM store_variant
       WHERE NOT (product_id = ANY($1::text[])) AND thumbnail IS NOT NULL`,
      [ids],
    )
    const externalProductReferences = otherProductRefs.rows.map((row) => row.url)
    const sharedByProductIds = new Set(
      mediaRows
        .filter((media) =>
          externalProductReferences.some((reference) => referencesMedia(reference, media)),
        )
        .map((media) => media.id),
    )
    const externalCandidates = mediaRows.filter((media) => !sharedByProductIds.has(media.id))
    const sharedOutsideProductIds = await referencedOutsideProductTables(
      client,
      externalCandidates,
    )
    const removable = mediaRows.filter(
      (media) =>
        !sharedByProductIds.has(media.id) && !sharedOutsideProductIds.has(media.id),
    )
    const skippedSharedMedia = mediaRows.length - removable.length

    if (removable.length) {
      await client.query(
        `UPDATE store_media
         SET deleted_at=NOW(),updated_at=NOW()
         WHERE id = ANY($1::text[])`,
        [removable.map((media) => media.id)],
      )
    }

    return {
      deletedProducts: deletedResult.rows.length,
      deletedMediaRows: removable,
      skippedSharedMedia,
    }
  })

  return {
    deletedProducts: transactionResult.deletedProducts,
    deletedMedia: transactionResult.deletedMediaRows.length,
    skippedSharedMedia: transactionResult.skippedSharedMedia,
    failedMediaDeletes: 0,
  }
}

export async function restoreProductMedia(productIds: string[]) {
  await ensureCommerceSchema()
  await ensureMediaTrashSchema()
  const ids = [...new Set(productIds.map(String).filter(Boolean))]
  if (!ids.length) return 0

  return withTransaction(async (client) => {
    const refsResult = await client.query<{ url: string }>(
      `SELECT thumbnail AS url FROM store_product
       WHERE id = ANY($1::text[]) AND thumbnail IS NOT NULL
       UNION
       SELECT url FROM store_product_image
       WHERE product_id = ANY($1::text[]) AND url IS NOT NULL
       UNION
       SELECT thumbnail AS url FROM store_variant
       WHERE product_id = ANY($1::text[]) AND thumbnail IS NOT NULL`,
      [ids],
    )
    const references = refsResult.rows.map((row) => row.url).filter(Boolean)
    const filenames = [...new Set(references.map(managedFilenameFromReference).filter(Boolean))]
    if (!references.length && !filenames.length) return 0

    const restored = await client.query<{ id: string }>(
      `UPDATE store_media
       SET deleted_at=NULL,updated_at=NOW()
       WHERE deleted_at IS NOT NULL
         AND (
           url = ANY($1::text[])
           OR filename = ANY($2::text[])
           OR storage_key = ANY($2::text[])
           OR regexp_replace(COALESCE(storage_key,''), '^uploads/', '') = ANY($2::text[])
         )
       RETURNING id`,
      [references, filenames],
    )
    return restored.rows.length
  })
}
