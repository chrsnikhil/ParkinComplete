import ParkingPageClient from './client'

export default async function ParkingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return <ParkingPageClient params={params} searchParams={searchParams} />
} 