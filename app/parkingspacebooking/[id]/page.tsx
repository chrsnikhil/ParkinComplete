import ParkingSpaceBooking from "@/components/parkingspacebooking"

export default function ParkingSpaceBookingPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { name: string; totalSpaces: string }
}) {
  return (
    <div className="min-h-screen bg-[#030303]">
      <ParkingSpaceBooking
        locationId={params.id}
        locationName={searchParams.name}
        totalSpaces={parseInt(searchParams.totalSpaces)}
      />
    </div>
  )
} 