/** Accept only genuine GTIN lengths with a valid GS1 check digit. */
export function validGtin(value: unknown): string | undefined {
  const code = String(value || "").trim()
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return undefined
  let sum = 0
  for (
    let index = code.length - 2, weight = 3;
    index >= 0;
    index--, weight = weight === 3 ? 1 : 3
  )
    sum += Number(code[index]) * weight
  return (10 - (sum % 10)) % 10 === Number(code.at(-1)) ? code : undefined
}
