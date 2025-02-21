"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"
import { AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import Image from "next/image"

type ParkingLocation = {
  id: string
  name: string
  address: string
  availableSpaces: number
  totalSpaces: number
  isSensorEnabled?: boolean
}

// Replace this with your ESP32's IP address that you got from Serial Monitor
// Example: const ESP32_IP = '192.168.1.100';
const ESP32_IP = '192.168.136.162';
const WEBSOCKET_URL = `ws://${ESP32_IP}:81`;

const parkingLocations: ParkingLocation[] = [
  { id: "1", name: "Express Avenue", address: "Thousand Lights", availableSpaces: 30, totalSpaces: 30 },
  { id: "2", name: "Pothys", address: "TNagar", availableSpaces: 1, totalSpaces: 1, isSensorEnabled: true },
  { id: "3", name: "Chennai Airport Parking", address: "Tirusulam", availableSpaces: 30, totalSpaces: 30 },
]

const GlowingBorderCard = ({ children, isConnected = true, isSensorCard = false }: { children: React.ReactNode, isConnected?: boolean, isSensorCard?: boolean }) => {
  return (
    <div className="relative group">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${
        isSensorCard 
          ? isConnected 
            ? 'from-green-500/30 to-green-500' 
            : 'from-red-500/30 to-red-500'
          : 'from-blue-500/30 to-blue-500'
      } rounded-lg opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200`}></div>
      <div className="relative bg-black rounded-lg p-0.5">{children}</div>
    </div>
  )
}

export default function ParkingLocations() {
  const [wsConnected, setWsConnected] = useState(false)
  const [isOccupied, setIsOccupied] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
  const [locations, setLocations] = useState(parkingLocations)
  const [showPayment, setShowPayment] = useState<string | null>(null)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verificationTimer, setVerificationTimer] = useState(60)
  const [transactionDetails, setTransactionDetails] = useState<{
    id: string;
    timestamp: string;
    amount: string;
  } | null>(null);

  // Update Pothys availability whenever sensor state changes
  useEffect(() => {
    setLocations(prev => prev.map(location => 
      location.id === "2" 
        ? { ...location, availableSpaces: isOccupied ? 0 : 1 }
        : location
    ));
  }, [isOccupied]);

  // WebSocket effect for Pothys
  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);
    
    ws.onopen = () => {
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const [spaceId, status] = event.data.split(':');
        if (spaceId === '1') {
          const spaceOccupied = status === 'true';
          setIsOccupied(spaceOccupied);
          setLastUpdateTime(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
    
    ws.onclose = () => {
      setWsConnected(false);
      setLastUpdateTime(null);
    };
    
    return () => {
      ws.close();
    };
  }, []);

  // Payment verification effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showPayment && !paymentVerified) {
      timer = setTimeout(() => {
        const timestamp = new Date().toLocaleString();
        setTransactionDetails({
          id: `PK${Date.now().toString().slice(-8)}`,
          timestamp,
          amount: '₹30.00'
        });
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
    setVerificationTimer(60)
    setTransactionDetails(null)
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
            {location.isSensorEnabled ? (
              <GlowingBorderCard isConnected={wsConnected} isSensorCard={true}>
                <Card className="bg-black text-white border-none h-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{location.name}</CardTitle>
                      <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full">
                        <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} shadow-lg shadow-current`} />
                        <span className="text-sm text-white font-medium">{wsConnected ? 'Sensor Live' : 'Sensor Offline'}</span>
                      </div>
                    </div>
                    <CardDescription className="text-white/60">
                      {location.address}
                      {location.id === "2" && lastUpdateTime && (
                        <div className="mt-1 text-xs">Last update: {lastUpdateTime}</div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="flex items-center justify-between">
                      <span>Available Spaces:</span>
                      <span className={`font-bold ${location.id === "2" && isOccupied ? 'text-red-500' : 'text-green-500'}`}>
                        {location.id === "2" ? (isOccupied ? "0" : "1") : location.availableSpaces}/{location.totalSpaces}
                      </span>
                    </p>
                    <Link
                      href={{
                        pathname: `/parking/${location.id}`,
                        query: { 
                          name: location.name, 
                          totalSpaces: location.totalSpaces,
                          isSensorEnabled: location.isSensorEnabled,
                          isOccupied: location.id === "2" ? isOccupied : undefined,
                          wsUrl: location.id === "2" ? WEBSOCKET_URL : undefined
                        }
                      }}
                      className={`mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors ${
                        location.id === "2" && isOccupied
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:scale-105 transform'
                      }`}
                      onClick={e => {
                        if (location.id === "2" && isOccupied) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {location.id === "2" && isOccupied ? "Space Occupied" : "Book Now"}
                    </Link>
                  </CardContent>
                </Card>
              </GlowingBorderCard>
            ) : (
              <GlowingBorderCard isSensorCard={false}>
                <Card className="bg-black text-white border-none h-full">
                  <CardHeader>
                    <CardTitle>{location.name}</CardTitle>
                    <CardDescription className="text-white/60">{location.address}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Available Spaces: {location.availableSpaces}/{location.totalSpaces}
                    </p>
                    <Link
                      href={{
                        pathname: `/parking/${location.id}`,
                        query: { 
                          name: location.name, 
                          totalSpaces: location.totalSpaces,
                          isSensorEnabled: location.isSensorEnabled
                        }
                      }}
                      className="mt-4 w-full inline-block text-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors hover:scale-105 transform"
                    >
                      Book Now
                    </Link>
                  </CardContent>
                </Card>
              </GlowingBorderCard>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showPayment && showPayment !== "2" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md relative"
            >
              <button 
                onClick={handleClosePayment}
                className="absolute -top-3 -right-3 bg-white text-gray-600 hover:text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110 z-50 shadow-lg hover:shadow-xl"
              >
                <X size={20} />
              </button>

              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {paymentVerified ? 'Payment Verified!' : 'Payment Details'}
                </h3>
                
                {paymentVerified ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 p-6 rounded-xl text-center"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      >
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    </div>
                    <h4 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h4>
                    <p className="text-green-600 mb-4">Your parking space has been booked.</p>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Transaction ID</span>
                        <span className="font-mono text-gray-800">{transactionDetails?.id}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Amount Paid</span>
                        <span className="font-semibold text-gray-800">{transactionDetails?.amount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Location</span>
                        <span className="text-gray-800">
                          {locations.find(l => l.id === showPayment)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Date & Time</span>
                        <span className="text-gray-800">{transactionDetails?.timestamp}</span>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          A confirmation has been sent to your registered email address.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
                      <p className="text-base font-medium text-gray-600">Amount to Pay</p>
                      <p className="text-2xl font-bold text-blue-600">₹30</p>
                      <div className="mt-2 text-sm text-gray-500">
                        {verificationTimer > 30 ? (
                          <span>Verifying payment in: {verificationTimer}s</span>
                        ) : verificationTimer > 0 ? (
                          <span className="text-yellow-600">Payment processing... {verificationTimer}s</span>
                        ) : (
                          <span className="text-blue-500">Finalizing transaction...</span>
                        )}
                      </div>
                      <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: "100%" }}
                          animate={{ width: "0%" }}
                          transition={{ duration: 60, ease: "linear" }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="bg-white p-2 rounded-xl shadow-sm mb-3">
                        <Image 
                          src="/qr-code.png"
                          alt="QR Code for payment"
                          width={200}
                          height={200}
                          className="mx-auto mb-4"
                        />
                      </div>
                      <div className="w-full space-y-3">
                        <div>
                          <a
                            href="upi://pay?pa=chrsnikhil-1@oksbi&pn=Nikhil&am=30&cu=INR"
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors font-medium"
                          >
                            Pay ₹30 with UPI
                          </a>
                          <p className="text-xs text-gray-500 mt-1 text-center">
                            {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) 
                              ? "Click to open your UPI app"
                              : "Scan QR code with your UPI app"}
                          </p>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                          Payment will be verified automatically
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

