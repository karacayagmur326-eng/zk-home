import ListingPage, { generateMetadata as metadata } from "./listing-page"
type Props = { params: Promise<{ slug: string; category: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
export const revalidate = 300
export async function generateStaticParams() { return [] }
export async function generateMetadata(props: Props) { return metadata({ ...props, searchParams: Promise.resolve({}) }) }
export default function Page(props: Props) { return <ListingPage {...props} searchParams={Promise.resolve({})} /> }
