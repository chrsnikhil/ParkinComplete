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
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  // Add a state for parking locations that will update with sensor data
  const [locations, setLocations] = useState(parkingLocations);

  // Update Pothys availability whenever sensor state changes
  useEffect(() => {
    setLocations(prev => prev.map(location => 
      location.id === "2" 
        ? { ...location, availableSpaces: isOccupied ? 0 : 1 }
        : location
    ));
  }, [isOccupied]);

  useEffect(() => {
    let wsInstance: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    function connectWebSocket() {
      try {
        wsInstance = new WebSocket(WEBSOCKET_URL);
        setWsInstance(wsInstance);

        wsInstance.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
          setConnectionStatus('connected');
        };

        wsInstance.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnected(false);
          setConnectionStatus('disconnected');
          
          // Attempt to reconnect
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectTimer = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, backoffTime);
        };

        wsInstance.onmessage = (event) => {
          try {
            console.log('Received message:', event.data);
            // Handle the string format: "1:true" or "1:false"
            const [spaceId, status] = event.data.split(':');
            if (spaceId === '1') {
              const isSpaceOccupied = status === 'true';
              setIsOccupied(isSpaceOccupied);
              setLastUpdateTime(new Date().toLocaleTimeString());
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        return wsInstance;
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        setWsConnected(false);
        return null;
      }
    }

    const ws = connectWebSocket();
    
    return () => {
      if (wsInstance) {
        wsInstance.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [reconnectAttempts]);

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

