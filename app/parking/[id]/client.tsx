"use client"

import ParkingSpaceBookingForPayment from '@/components/parkingspacebookingforpayment'
import SensorSpace from '@/components/SensorSpace'

type ClientProps = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ParkingPageClient({ params, searchParams }: ClientProps) {
  const locationName = searchParams.name as string
  const rawTotalSpaces = searchParams.totalSpaces
  const totalSpaces = typeof rawTotalSpaces === 'string' 
    ? Math.max(1, Math.min(100, parseInt(rawTotalSpaces) || 30))
    : 30
  const wsUrl = searchParams.wsUrl as string
  const isOccupied = searchParams.isOccupied === 'true'

  // Use SensorSpace for Pothys (id: 2) and ParkingSpaceBookingForPayment for others
  if (params.id === "2") {
    return (
      <div className="min-h-screen bg-[#030303] py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-8">{locationName}</h2>
          <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
            <div className="relative z-10">
              <SensorSpace wsUrl={wsUrl} initialOccupied={isOccupied} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // For other locations, show the grid layout with payment functionality
  return (
    <div className="min-h-screen bg-[#030303] py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-white mb-8">{locationName}</h2>
        <ParkingSpaceBookingForPayment
          locationName={locationName}
          totalSpaces={totalSpaces}
        />
      </div>
    </div>
  )
} 