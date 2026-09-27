const PHONE_USER_AGENT =
  /Android.+Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i

/**
 * Keep the phone-only storefront independent from tablet and desktop output.
 * Tablets intentionally receive the desktop/tablet experience.
 */
export function isPhoneUserAgent(userAgent?: string | null) {
  return PHONE_USER_AGENT.test(userAgent || "")
}
