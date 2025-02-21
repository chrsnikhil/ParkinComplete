import { Metadata } from 'next'
import ParkingPageClient from './client'

export const metadata: Metadata = {
  title: 'Parking Space',
  description: 'Book your parking space',
}

type PageProps = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ParkingPage({ params, searchParams }: PageProps) {
  // Ensure params is handled as async even if we're not doing data fetching
  const resolvedParams = await Promise.resolve(params);
  
  return (
    <ParkingPageClient 
      params={resolvedParams}
      searchParams={searchParams}
    />
  )
} 