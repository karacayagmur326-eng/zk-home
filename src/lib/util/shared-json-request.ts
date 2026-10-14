const requests = new Map<string, { expires: number; promise: Promise<any> }>()

/** Share simultaneous reads. Only explicitly public data may be retained after completion. */
export function sharedJsonRequest(url: string, publicTtlMs = 0): Promise<any> {
  const existing = requests.get(url)
  if (existing && existing.expires > Date.now()) return existing.promise
  const entry = { expires: Infinity, promise: Promise.resolve() as Promise<any> }
  entry.promise = fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Request failed: ${response.status}`)
      return response.json()
    })
    .then(data => {
      if (publicTtlMs > 0) entry.expires = Date.now() + publicTtlMs
      else if (requests.get(url) === entry) requests.delete(url)
      return data
    })
    .catch(error => {
      if (requests.get(url) === entry) requests.delete(url)
      throw error
    })
  requests.set(url, entry)
  return entry.promise
}
