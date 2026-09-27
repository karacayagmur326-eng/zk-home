import "server-only"
import { cookies as nextCookies } from "next/headers"

export const getCacheTag = async (tag: string) => {
  const cacheId = (await nextCookies()).get("_zkhome_cache_id")?.value
  return cacheId ? `${tag}-${cacheId}` : tag
}

export const getCacheOptions = async (tag: string) => ({
  tags: [await getCacheTag(tag)],
})

export const getCartId = async () =>
  (await nextCookies()).get("_zkhome_cart_id")?.value

export const setCartId = async (cartId: string) => {
  const isHttps = process.env.NODE_ENV === "production"
  ;(await nextCookies()).set("_zkhome_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
  })
}

export const removeCartId = async () => {
  ;(await nextCookies()).set("_zkhome_cart_id", "", {
    maxAge: -1,
    path: "/",
  })
}
