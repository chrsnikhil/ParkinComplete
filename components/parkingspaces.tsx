"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"

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
  { id: "1", name: "Downtown Parking", address: "123 Main St", availableSpaces: 30, totalSpaces: 30 },
  { id: "2", name: "Mall Parking", address: "456 Shop Ave", availableSpaces: 1, totalSpaces: 1, isSensorEnabled: true },
  { id: "3", name: "Airport Parking", address: "789 Fly Rd", availableSpaces: 30, totalSpaces: 30 },
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

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    function connectWebSocket() {
      try {
        console.log('Attempting to connect to WebSocket server at:', WEBSOCKET_URL)
        ws = new WebSocket(WEBSOCKET_URL)

        ws.onopen = () => {
          console.log('Successfully connected to ESP32')
          setWsConnected(true)
        }

        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          })
          setWsConnected(false)
          // Try to reconnect every 2 seconds
          reconnectTimer = setTimeout(connectWebSocket, 2000)
        }

        ws.onerror = (error) => {
          console.error('WebSocket error details:', {
            error,
            readyState: ws?.readyState,
            url: WEBSOCKET_URL,
            timestamp: new Date().toISOString()
          })
          
          // Check if the ESP32 IP is in the correct format
          if (!ESP32_IP.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
            console.error('Invalid ESP32 IP address format:', ESP32_IP)
          }
          
          // Additional connection diagnostics
          console.log('Connection diagnostics:', {
            wsStatus: ws?.readyState,
            connected: wsConnected,
            protocol: ws?.protocol,
            extensions: ws?.extensions
          })

          ws.close()
        }

        // Add message event logging
        ws.onmessage = (event) => {
          console.log('Received WebSocket message:', event.data)
        }

      } catch (error) {
        console.error('Failed to establish WebSocket connection:', {
          error,
          url: WEBSOCKET_URL,
          timestamp: new Date().toISOString()
        })
        setWsConnected(false)
      }
    }

    connectWebSocket()

    // Connection health check
    const healthCheck = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send('ping')
        } catch (error) {
          console.error('Health check failed:', error)
          ws.close()
        }
      }
    }, 5000)

    // Cleanup on component unmount
    return () => {
      console.log('Cleaning up WebSocket connection')
      if (ws) {
        ws.close()
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      clearInterval(healthCheck)
    }
  }, []) // Empty dependency array means this runs once on mount

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-white">Available Parking Locations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parkingLocations.map((location) => (
          <motion.div
            key={location.id}
            whileHover={{ scale: 1.03 }}
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
                    <CardDescription className="text-white/60">{location.address}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Available Spaces: {location.availableSpaces}/{location.totalSpaces}
                    </p>
                    <Link
                      href={{
                        pathname: `/parkingspacebooking/${location.id}`,
                        query: { 
                          name: location.name, 
                          totalSpaces: location.totalSpaces,
                          isSensorEnabled: location.isSensorEnabled
                        }
                      }}
                      className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Book Now
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
                        pathname: `/parkingspacebooking/${location.id}`,
                        query: { 
                          name: location.name, 
                          totalSpaces: location.totalSpaces,
                          isSensorEnabled: location.isSensorEnabled
                        }
                      }}
                      className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
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
    </div>
  )
}

