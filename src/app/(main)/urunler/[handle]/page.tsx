import ProductPage, { generateMetadata as metadata } from "./product-page"

type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ v_id?: string }> }
export const revalidate = 300
export async function generateStaticParams() { return [] }
export async function generateMetadata(props: Props) { return metadata(props) }
export default function Page(props: Props) { return <ProductPage {...props} /> }
