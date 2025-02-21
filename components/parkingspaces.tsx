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
  const [spaceStates, setSpaceStates] = useState<boolean[]>([false, false, false])
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const [selectedSpace, setSelectedSpace] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

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
          setErrorMessage('');
          setReconnectAttempts(0);
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
            
            if (event.data === 'heartbeat') {
              setLastHeartbeat(new Date());
              return;
            }

            // Handle the string format: "1:true" or "1:false"
            const [spaceId, status] = event.data.split(':');
            if (spaceId === '1') {
              const isSpaceOccupied = status === 'true';
              setSpaceStates(prev => {
                const newStates = { ...prev };
                if (Array.isArray(newStates["2"])) {
                  newStates["2"] = [...newStates["2"]];
                  newStates["2"][0] = isSpaceOccupied;
                }
                return newStates;
              });
              setLastUpdateTime(new Date().toLocaleTimeString());
            }
          } catch (error) {
            console.error('Error processing message:', error);
            setErrorMessage('Error processing update');
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

  const handlePayment = () => {
    if (selectedSpace === null) return;
    
    const newStates = [...spaceStates];
    newStates[selectedSpace] = true;
    setSpaceStates(newStates);
    
    // Broadcast the state change to all connected clients
    if (wsInstance?.readyState === WebSocket.OPEN) {
      try {
        wsInstance.send(JSON.stringify({
          type: 'spaceUpdate',
          spaceId: selectedSpace,
          isOccupied: true,
          locationId: parkingLocations[0].id,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Failed to broadcast space state:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-white">Available Parking Locations</h2>
      <div className="mb-4 p-4 rounded-lg bg-black/30 text-white">
        <p>ESP32 Connection Status:</p>
        <p className="text-sm opacity-70">Attempting to connect to: {WEBSOCKET_URL}</p>
        <p className="text-sm opacity-70">Status: {wsConnected ? 'Connected' : 'Disconnected'}</p>
        <p className="text-xs opacity-50 mt-2">If connection fails, verify the ESP32 IP address in Serial Monitor</p>
      </div>
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

