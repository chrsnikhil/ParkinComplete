"use client"

import { use } from 'react'
import ParkingSpaceBooking from '@/components/parkingspacebooking'
import ParkingSpaceBookingForPayment from '@/components/parkingspacebookingforpayment'

export default function ParkingPage({ 
  params,
  searchParams
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
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
      locationId={params.id}
      locationName={locationName}
      totalSpaces={totalSpaces}
      isSensorEnabled={false}
    />
  )
} 