import { Metadata } from 'next'
import ParkingPageClient from './client'

export const metadata: Metadata = {
  title: 'Parking Space',
  description: 'Book your parking space',
}

export default function ParkingPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return <ParkingPageClient params={params} searchParams={searchParams} />
} 