import "server-only"

import { createHash, createHmac, randomUUID } from "crypto"
import * as fs from "fs"
import * as path from "path"

type PutInput = {
  filename: string
  bytes: Buffer
  contentType: string
}

export type StoredMedia = {
  url: string
  storageKey: string
  databaseBytes?: Buffer
}

const sha256 = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex")

const hmac = (key: Buffer | string, value: string) =>
  createHmac("sha256", key).update(value).digest()

const SUPABASE_MEDIA_BUCKET = "store-media"

function supabaseStorageConfig() {
  const endpoint = (
    process.env.NEXT_PUBLIC_ZK_SUPABASE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.replace(/\/+$/, "")
  const secretKey =
    process.env.ZK_SUPABASE_SUPABASE_SECRET_KEY || process.env.ZK_SUPABASE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.SUPABASE_MEDIA_BUCKET || SUPABASE_MEDIA_BUCKET

  return endpoint && secretKey && bucket
    ? { endpoint, secretKey, bucket }
    : null
}

function encodeStoragePath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/")
}

async function supabaseStorageRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  pathname: string,
  body?: BodyInit,
  contentType?: string,
) {
  const config = supabaseStorageConfig()
  if (!config) throw new Error("Supabase Storage yapılandırılmamış.")

  const response = await fetch(`${config.endpoint}/storage/v1${pathname}`, {
    method,
    headers: {
      apikey: config.secretKey,
      Authorization: `Bearer ${config.secretKey}`,
      ...(contentType ? { "Content-Type": contentType } : {}),
    },
    body,
    cache: "no-store",
  })

  return response
}

let bucketReady: Promise<void> | null = null

async function ensureSupabaseBucket() {
  const config = supabaseStorageConfig()
  if (!config) throw new Error("Supabase Storage yapılandırılmamış.")
  if (bucketReady) return bucketReady

  bucketReady = (async () => {
    const lookup = await supabaseStorageRequest(
      "GET",
      `/bucket/${encodeURIComponent(config.bucket)}`,
    )
    if (lookup.ok) return
    if (lookup.status !== 400 && lookup.status !== 404) {
      throw new Error(`Supabase Storage kova kontrolü HTTP ${lookup.status}`)
    }

    const create = await supabaseStorageRequest(
      "POST",
      "/bucket",
      JSON.stringify({
        id: config.bucket,
        name: config.bucket,
        public: true,
        file_size_limit: 8 * 1024 * 1024,
        allowed_mime_types: [
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/avif",
        ],
      }),
      "application/json",
    )
    if (!create.ok && create.status !== 409) {
      throw new Error(`Supabase Storage kova oluşturma HTTP ${create.status}`)
    }
  })().catch((error) => {
    bucketReady = null
    throw error
  })

  return bucketReady
}

async function putSupabaseObject(key: string, input: PutInput) {
  const config = supabaseStorageConfig()
  if (!config) throw new Error("Supabase Storage yapılandırılmamış.")
  await ensureSupabaseBucket()

  const response = await supabaseStorageRequest(
    "POST",
    `/object/${encodeURIComponent(config.bucket)}/${encodeStoragePath(key)}`,
    new Uint8Array(input.bytes),
    input.contentType,
  )
  if (!response.ok) {
    throw new Error(`Supabase Storage yükleme HTTP ${response.status}`)
  }

  return `${config.endpoint}/storage/v1/object/public/${encodeURIComponent(
    config.bucket,
  )}/${encodeStoragePath(key)}`
}

async function deleteSupabaseObject(key: string) {
  const config = supabaseStorageConfig()
  if (!config) throw new Error("Supabase Storage yapılandırılmamış.")
  const response = await supabaseStorageRequest(
    "DELETE",
    `/object/${encodeURIComponent(config.bucket)}/${encodeStoragePath(key)}`,
  )
  if (!response.ok && response.status !== 404) {
    throw new Error(`Supabase Storage silme HTTP ${response.status}`)
  }
}

function s3Config() {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/+$/, "")
  const bucket = process.env.S3_BUCKET
  const region = process.env.S3_REGION || "auto"
  const accessKey = process.env.S3_ACCESS_KEY_ID
  const secretKey = process.env.S3_SECRET_ACCESS_KEY
  const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(/\/+$/, "")
  return endpoint && bucket && accessKey && secretKey && publicBase
    ? { endpoint, bucket, region, accessKey, secretKey, publicBase }
    : null
}

async function signedS3Request(method: "PUT" | "DELETE", key: string, input?: PutInput) {
  const config = s3Config()
  if (!config) throw new Error("Nesne depolama yapılandırılmamış.")
  const endpointUrl = new URL(config.endpoint)
  const encodedKey = key.split("/").map(encodeURIComponent).join("/")
  const canonicalUri = `/${encodeURIComponent(config.bucket)}/${encodedKey}`
  const url = `${config.endpoint}${canonicalUri}`
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const date = amzDate.slice(0, 8)
  const payloadHash = sha256(input?.bytes || "")
  const headers: Record<string, string> = {
    host: endpointUrl.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  }
  if (input?.contentType) headers["content-type"] = input.contentType
  const signedHeaders = Object.keys(headers).sort().join(";")
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((name) => `${name}:${headers[name].trim()}\n`)
    .join("")
  const canonicalRequest = [
    method,
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")
  const scope = `${date}/${config.region}/s3/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n")
  const dateKey = hmac(`AWS4${config.secretKey}`, date)
  const regionKey = hmac(dateKey, config.region)
  const serviceKey = hmac(regionKey, "s3")
  const signingKey = hmac(serviceKey, "aws4_request")
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex")
  const response = await fetch(url, {
    method,
    headers: {
      ...headers,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${scope},` +
        `SignedHeaders=${signedHeaders},Signature=${signature}`,
    },
    body:
      method === "PUT" && input?.bytes
        ? new Uint8Array(input.bytes)
        : undefined,
  })
  if (!response.ok) throw new Error(`Nesne depolama HTTP ${response.status}`)
  return `${config.publicBase}/${encodedKey}`
}

export function persistentStorageConfigured() {
  return Boolean(supabaseStorageConfig() || s3Config())
}

export async function createDirectMediaUpload() {
  const config = supabaseStorageConfig()
  if (!config) return null
  await ensureSupabaseBucket()
  const key = `pending/${randomUUID()}`
  const response = await supabaseStorageRequest("POST", `/object/upload/sign/${encodeURIComponent(config.bucket)}/${key}`, JSON.stringify({ upsert: false }), "application/json")
  if (!response.ok) throw new Error(`Yükleme izni alınamadı (HTTP ${response.status}).`)
  const data = await response.json()
  return { key, uploadUrl: `${config.endpoint}/storage/v1${data.url}` }
}

export async function readDirectMediaUpload(key: string) {
  if (!/^pending\/[0-9a-f-]{36}$/.test(key)) throw new Error("Geçersiz yükleme anahtarı.")
  const config = supabaseStorageConfig()
  if (!config) throw new Error("Supabase Storage yapılandırılmamış.")
  const response = await supabaseStorageRequest("GET", `/object/${encodeURIComponent(config.bucket)}/${key}`)
  if (!response.ok) throw new Error("Yüklenen görsel okunamadı.")
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 8 * 1024 * 1024) throw new Error("Dosya başına 8 MB izin verilir.")
  return bytes
}

export async function storeMedia(input: PutInput): Promise<StoredMedia> {
  if (supabaseStorageConfig()) {
    const key = `uploads/${Date.now()}-${randomUUID()}-${input.filename}`
    return {
      url: await putSupabaseObject(key, input),
      storageKey: key,
    }
  }
  const config = s3Config()
  if (config) {
    const key = `uploads/${Date.now()}-${input.filename}`
    return {
      url: await signedS3Request("PUT", key, input),
      storageKey: key,
    }
  }
  if (process.env.VERCEL) {
    const extension = path.extname(input.filename)
    const base = path.basename(input.filename, extension)
    const filename = `${base}-${randomUUID()}${extension}`
    return {
      url: `/uploads/${encodeURIComponent(filename)}`,
      storageKey: filename,
      databaseBytes: input.bytes,
    }
  }
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  try {
    await fs.promises.mkdir(uploadDir, { recursive: true })
    const extension = path.extname(input.filename)
    const base = path.basename(input.filename, extension)
    let filename = input.filename
    let counter = 1
    while (fs.existsSync(path.join(uploadDir, filename))) {
      filename = `${base}-${counter++}${extension}`
    }
    await fs.promises.writeFile(path.join(uploadDir, filename), input.bytes)
    return { url: `/uploads/${filename}`, storageKey: filename }
  } catch {
    throw new Error(
      "Kalıcı medya deposu yapılandırılmamış. Görseli base64 olarak veritabanına kaydetmek engellendi."
    )
  }
}

export async function deleteMedia(storageKey: string) {
  if (supabaseStorageConfig()) {
    await deleteSupabaseObject(storageKey)
    return
  }
  if (s3Config()) {
    await signedS3Request("DELETE", storageKey)
    return
  }
  const uploads = path.resolve(process.cwd(), "public", "uploads")
  const target = path.resolve(uploads, storageKey)
  if (target.startsWith(`${uploads}${path.sep}`)) {
    await fs.promises.unlink(target).catch(() => undefined)
  }
}

export async function renameMedia(
  storageKey: string,
  requestedFilename: string,
  contentType: string,
) {
  const supabase = supabaseStorageConfig()
  if (supabase) {
    const oldKey = storageKey.startsWith("uploads/")
      ? storageKey
      : `uploads/${storageKey}`
    const newKey = `uploads/${Date.now()}-${randomUUID()}-${requestedFilename}`
    const oldUrl = `${supabase.endpoint}/storage/v1/object/public/${encodeURIComponent(
      supabase.bucket,
    )}/${encodeStoragePath(oldKey)}`
    const response = await fetch(oldUrl, { cache: "no-store" })
    if (!response.ok) {
      throw new Error("Taşınacak görsel Supabase Storage içinde bulunamadı.")
    }
    const bytes = Buffer.from(await response.arrayBuffer())
    const input = { filename: requestedFilename, bytes, contentType }
    const url = await putSupabaseObject(newKey, input)
    try {
      await deleteSupabaseObject(oldKey)
    } catch (error) {
      await deleteSupabaseObject(newKey).catch(() => undefined)
      throw error
    }
    return { url, storageKey: newKey }
  }

  const config = s3Config()
  if (config) {
    const oldKey = storageKey.startsWith("uploads/")
      ? storageKey
      : `uploads/${storageKey}`
    const newKey = `uploads/${requestedFilename}`
    const oldUrl = `${config.publicBase}/${oldKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`
    const response = await fetch(oldUrl, { cache: "no-store" })
    if (!response.ok) {
      throw new Error("Taşınacak görsel nesne depolamada bulunamadı.")
    }
    const bytes = Buffer.from(await response.arrayBuffer())
    const input = { filename: requestedFilename, bytes, contentType }
    const url = await signedS3Request("PUT", newKey, input)
    try {
      await signedS3Request("DELETE", oldKey)
    } catch (error) {
      await signedS3Request("DELETE", newKey).catch(() => undefined)
      throw error
    }
    return { url, storageKey: newKey }
  }

  const uploads = path.resolve(process.cwd(), "public", "uploads")
  const source = path.resolve(uploads, storageKey)
  const target = path.resolve(uploads, requestedFilename)
  if (
    !source.startsWith(`${uploads}${path.sep}`) ||
    !target.startsWith(`${uploads}${path.sep}`)
  ) {
    throw new Error("Geçersiz medya dosya yolu.")
  }
  await fs.promises.access(source)
  if (source !== target) {
    await fs.promises.access(target).then(
      () => {
        throw new Error("Bu dosya adı medya kütüphanesinde zaten kullanılıyor.")
      },
      () => undefined,
    )
  }
  await fs.promises.rename(source, target)
  return { url: `/uploads/${requestedFilename}`, storageKey: requestedFilename }
}
