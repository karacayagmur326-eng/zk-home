type ReviewResponse = { reviews?: any[]; questions?: any[] }
const requests = new Map<string, { expires: number; promise: Promise<ReviewResponse | null> }>()

export function invalidateProductReviews(productId: string) {
  requests.delete(productId)
}

/** Share the public reviews request between the product summary and review panel. */
export function getProductReviews(productId: string) {
  const existing = requests.get(productId)
  if (existing && existing.expires > Date.now()) return existing.promise
  if (requests.size >= 50) requests.delete(requests.keys().next().value!)
  const entry: { expires: number; promise: Promise<ReviewResponse | null> } = {
    expires: Date.now() + 60_000,
    promise: fetch(`/api/products/${encodeURIComponent(productId)}/reviews`)
      .then(async response => {
        if (!response.ok) throw new Error("Reviews request failed")
        return response.json() as Promise<ReviewResponse>
      })
      .catch(() => {
        if (requests.get(productId) === entry) requests.delete(productId)
        return null
      }),
  }
  requests.set(productId, entry)
  return entry.promise
}
