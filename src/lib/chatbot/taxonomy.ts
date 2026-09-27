import "server-only"

import { query } from "@lib/admin/db"
import {
  buildCatalogQueryHint,
  CatalogQueryHint,
  CatalogTaxonomyCategory,
  CatalogTaxonomyTag,
} from "./taxonomy-core"

let taxonomySnapshot: {
  categories: CatalogTaxonomyCategory[]
  tags: CatalogTaxonomyTag[]
  expiresAt: number
} | null = null

async function getCatalogTaxonomy() {
  if (taxonomySnapshot && taxonomySnapshot.expiresAt > Date.now()) return taxonomySnapshot
  const [categories, tags] = await Promise.all([
    query<CatalogTaxonomyCategory>(
      `SELECT id,name,handle,description,parent_id,metadata
       FROM store_category WHERE active=TRUE ORDER BY parent_id NULLS FIRST,rank,name`
    ).catch(() => []),
    query<CatalogTaxonomyTag>(
      `SELECT t.id,t.value,t.metadata
       FROM store_tag t
       WHERE EXISTS (SELECT 1 FROM store_product_tag pt WHERE pt.tag_id=t.id)
       ORDER BY t.value`
    ).catch(() => []),
  ])
  taxonomySnapshot = { categories, tags, expiresAt: Date.now() + 120_000 }
  return taxonomySnapshot
}

export async function resolveCatalogTaxonomy(message: string): Promise<CatalogQueryHint | null> {
  const taxonomy = await getCatalogTaxonomy()
  return buildCatalogQueryHint(message, taxonomy.categories, taxonomy.tags)
}
