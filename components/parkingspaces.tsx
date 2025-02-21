"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"
import { X } from "lucide-react"
import ParkingSpaceBooking from "./parkingspacebooking"
import ParkingSpaceBookingForPayment from "./parkingspacebookingforpayment"

type ParkingLocation = {
  id: string
  name: string
  address: string
  availableSpaces: number
  totalSpaces: number
  isSensorEnabled?: boolean
}

// WebSocket Configuration
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://192.168.136.162:81';

const parkingLocations: ParkingLocation[] = [
  { id: "1", name: "Express Avenue", address: "Thousand Lights", availableSpaces: 30, totalSpaces: 30 },
  { id: "2", name: "Pothys", address: "TNagar", availableSpaces: 1, totalSpaces: 1, isSensorEnabled: true },
  { id: "3", name: "Chennai Airport Parking", address: "Tirusulam", availableSpaces: 30, totalSpaces: 30 },
]

const GlowingBorderCard = ({ children, isConnected = true, isSensorCard = false, isOccupied = false }: { 
  children: React.ReactNode, 
  isConnected?: boolean, 
  isSensorCard?: boolean,
  isOccupied?: boolean 
}) => {
  return (
    <div className="relative group">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${
        isSensorCard 
          ? isConnected 
            ? isOccupied
              ? 'from-red-500/30 to-red-500'
              : 'from-green-500/30 to-green-500'
            : 'from-gray-500/30 to-gray-500'
          : 'from-blue-500/30 to-blue-500'
      } rounded-lg opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200`}></div>
      <div className={`relative rounded-lg p-0.5 ${
        isSensorCard
          ? isConnected
            ? isOccupied
              ? 'bg-red-950'
              : 'bg-green-950'
            : 'bg-black'
          : 'bg-black'
      }`}>{children}</div>
    </div>
  )
}

export default function ParkingLocations() {
  const [isConnected, setIsConnected] = useState(false)
  const [isOccupied, setIsOccupied] = useState(false)
  const [locations, setLocations] = useState(parkingLocations)
  const [showPayment, setShowPayment] = useState<string | null>(null)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // Update Pothys availability whenever sensor state changes
  useEffect(() => {
    setLocations(prev => prev.map(location => 
      location.id === "2" 
        ? { ...location, availableSpaces: isOccupied ? 0 : 1 }
        : location
    ));
  }, [isOccupied]);

  // WebSocket effect with reconnection logic
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('WebSocket Connected');
          setIsConnected(true);
          setReconnectAttempts(0);
        };

        ws.onmessage = (event) => {
          try {
            const [spaceId, status] = event.data.split(':');
            if (spaceId === '1') {
              setIsOccupied(status === 'true');
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws?.close();
        };

        ws.onclose = () => {
          console.log('WebSocket Disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect with exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeout = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, backoffTime);
        };
      } catch (error) {
        console.error('Connection error:', error);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [reconnectAttempts]);

  // Payment verification effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showPayment && !paymentVerified) {
      timer = setTimeout(() => {
        setPaymentVerified(true);
        
        // Update available spaces after successful payment
        if (showPayment !== "2") { // Don't update Pothys
          setLocations(prev => prev.map(location => 
            location.id === showPayment
              ? { ...location, availableSpaces: Math.max(0, location.availableSpaces - 1) }
              : location
          ));
        }
      }, 30000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showPayment, paymentVerified]);

  const handleClosePayment = () => {
    setShowPayment(null)
    setPaymentVerified(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-white">Available Parking Locations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <motion.div
            key={location.id}
            whileHover={{ scale: location.isSensorEnabled ? 1 : 1.03 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <GlowingBorderCard 
              isConnected={location.isSensorEnabled ? isConnected : true}
              isSensorCard={location.isSensorEnabled}
              isOccupied={location.isSensorEnabled ? isOccupied : false}
            >
              <Card className={`text-white border-none h-full ${
                location.isSensorEnabled
                  ? isConnected
                    ? isOccupied
                      ? 'bg-red-950'
                      : 'bg-green-950'
                    : 'bg-black'
                  : 'bg-black'
              }`}>
                <CardHeader>
                  <CardTitle>{location.name}</CardTitle>
                  <CardDescription className="text-white/60">{location.address}</CardDescription>
                  {location.isSensorEnabled && (
                    <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-sm text-white">{isConnected ? 'Sensor Live' : 'Sensor Offline'}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="flex items-center justify-between">
                    <span>Available Spaces:</span>
                    <span className="font-bold text-white">
                      {location.availableSpaces}/{location.totalSpaces}
                    </span>
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => setShowPayment(location.id)}
                      disabled={location.isSensorEnabled && isOccupied}
                      className={`
                        mt-4 w-full inline-block text-center px-4 py-2 rounded
                        ${location.isSensorEnabled && isOccupied
                          ? 'bg-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5'
                        }
                        transition-all duration-300 text-white
                      `}
                    >
                      {location.isSensorEnabled && isOccupied ? 'Space Occupied' : 'Book Now'}
                    </button>
                  </motion.div>
                </CardContent>
              </Card>
            </GlowingBorderCard>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-xl z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#030303] rounded-2xl w-full max-w-4xl relative"
            >
              <button 
                onClick={handleClosePayment}
                className="absolute top-4 right-4 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white rounded-full p-2 transition-all duration-200 hover:scale-110 z-50"
              >
                <X size={24} />
              </button>

              <div className="p-5">
                {locations.find(l => l.id === showPayment)?.isSensorEnabled ? (
                  <ParkingSpaceBooking
                    locationName={locations.find(l => l.id === showPayment)?.name || ""}
                    isSensorEnabled={true}
                    wsUrl={WS_URL}
                    initialOccupied={isOccupied}
                  />
                ) : (
                  <ParkingSpaceBookingForPayment
                    locationName={locations.find(l => l.id === showPayment)?.name || ""}
                    totalSpaces={locations.find(l => l.id === showPayment)?.totalSpaces || 30}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

