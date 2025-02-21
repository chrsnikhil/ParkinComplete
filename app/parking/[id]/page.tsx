"use client"

import ParkingSpaceBooking from '@/components/parkingspacebooking'
import ParkingSpaceBookingForPayment from '@/components/parkingspacebookingforpayment'

interface PageProps {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ParkingPage({ params, searchParams }: PageProps) {
  const locationName = searchParams.name as string
  const totalSpaces = parseInt(searchParams.totalSpaces as string)
  const isSensorEnabled = searchParams.isSensorEnabled === 'true'
  const wsUrl = searchParams.wsUrl as string
  const isOccupied = searchParams.isOccupied === 'true'

  // Use ParkingSpaceBooking for Pothys (id: 2) and ParkingSpaceBookingForPayment for others
  if (params.id === "2") {
    return (
      <ParkingSpaceBooking
        locationName={locationName}
        isSensorEnabled={isSensorEnabled}
        wsUrl={wsUrl}
        initialOccupied={isOccupied}
      />
    )
  }

  return (
    <ParkingSpaceBookingForPayment
      locationName={locationName}
      totalSpaces={totalSpaces}
    />
  )
} 