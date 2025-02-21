import HeroGeometric from "@/components/hero"
import ParkingLocations from "@/components/parkingspaces"
import LiveMap from "@/components/livemap"
export default function Home() {
  return (
    <main className="min-h-screen bg-[#030303]">
      <HeroGeometric />
      <ParkingLocations />
      <LiveMap />
    </main>
  )
}

