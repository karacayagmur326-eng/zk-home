import "server-only"

import sanitizeHtml from "sanitize-html"

const richTextOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
    "div", "span", "a", "img", "figure", "figcaption", "table",
    "thead", "tbody", "tfoot", "tr", "th", "td", "details", "summary",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel", "class"],
    img: ["src", "alt", "title", "width", "height", "loading", "class"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: "a",
      attribs: {
        ...attribs,
        ...(attribs.target === "_blank"
          ? { rel: "noopener noreferrer" }
          : {}),
      },
    }),
  },
}

export function sanitizePublicHtml(value: unknown): string {
  return sanitizeHtml(typeof value === "string" ? value : "", richTextOptions)
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}
