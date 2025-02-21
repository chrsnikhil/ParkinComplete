"use client"

import { use } from "react"
import ParkingSpaceBooking from "@/components/parkingspacebooking"

export default function ParkingSpaceBookingPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { 
    name: string
    totalSpaces: string
    isSensorEnabled: string
    wsUrl?: string
    isOccupied?: string
  }
}) {
  return (
    <div className="min-h-screen bg-[#030303]">
      <ParkingSpaceBooking
        locationId={params.id}
        locationName={searchParams.name}
        totalSpaces={parseInt(searchParams.totalSpaces)}
        isSensorEnabled={searchParams.isSensorEnabled === 'true'}
        wsUrl={searchParams.wsUrl}
        initialOccupied={searchParams.isOccupied === 'true'}
      />
    </div>
  )
} 