"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Car, X } from "lucide-react"

// Replace this with your ESP32's IP address that you got from Serial Monitor
// Example: const ESP32_IP = '192.168.1.100';
const ESP32_IP = '192.168.136.162';
const WEBSOCKET_URL = `ws://${ESP32_IP}:81`;

type ParkingSpaceBookingProps = {
  locationId: string
  locationName: string
  totalSpaces: number
  isSensorEnabled?: boolean
}

export default function ParkingSpaceBooking({ 
  locationId, 
  locationName,
  totalSpaces,
  isSensorEnabled 
}: ParkingSpaceBookingProps) {
  const [wsConnected, setWsConnected] = useState(false)
  const [spaceStates, setSpaceStates] = useState<boolean[]>(
    Array(totalSpaces).fill(false)
  )
  const [selectedSpace, setSelectedSpace] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [lastSensorUpdate, setLastSensorUpdate] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)

  // Function to check server status
  const checkServerStatus = () => {
    if (wsInstance?.readyState === WebSocket.OPEN) {
      try {
        wsInstance.send('heartbeat')
        setLastHeartbeat(new Date())
      } catch (error) {
        console.error('Failed to send heartbeat:', error)
        setConnectionStatus('disconnected')
        setErrorMessage('Lost connection to server')
        wsInstance.close()
      }
    }
  }

  // Function to handle reconnection
  const connectWebSocket = () => {
    // Close existing connection if any
    if (wsInstance) {
      wsInstance.close()
      setWsInstance(null)
    }

    try {
      setConnectionStatus('connecting')
      setErrorMessage('')
      const ws = new WebSocket(WEBSOCKET_URL)
      setWsInstance(ws)

      ws.onopen = () => {
        console.log('Connected to ESP32')
        setWsConnected(true)
        setConnectionStatus('connected')
        setReconnectAttempts(0)
        setErrorMessage('')
        setLastHeartbeat(new Date())
        // Send initial heartbeat
        ws.send('heartbeat')
      }

      ws.onclose = (event) => {
        console.log('Disconnected from ESP32:', event.code, event.reason)
        setWsConnected(false)
        setConnectionStatus('disconnected')
        setWsInstance(null)
        setErrorMessage(`Connection closed (Code: ${event.code})${event.reason ? ` - ${event.reason}` : ''}`)
        setReconnectAttempts(prev => prev + 1)
        setLastHeartbeat(null)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('disconnected')
        setWsInstance(null)
        setErrorMessage('Failed to connect to sensor. Please check if ESP32 is powered on and connected to WiFi.')
        setReconnectAttempts(prev => prev + 1)
        setLastHeartbeat(null)
      }

      ws.onmessage = (event) => {
        try {
          if (event.data === 'heartbeat') {
            setLastHeartbeat(new Date())
            return
          }

          const [spaceId, status] = event.data.split(':')
          if (spaceId === '1') {  // We only care about space 1 for now
            const isOccupied = status === 'true'
            setSpaceStates(prev => {
              const newStates = [...prev]
              newStates[0] = isOccupied
              return newStates
            })
            setLastSensorUpdate(new Date())
            setLastUpdateTime(new Date().toLocaleTimeString())
            setErrorMessage('')
          }
        } catch (error) {
          console.error('Error parsing sensor data:', error)
          setErrorMessage('Error reading sensor data')
        }
      }

      return ws
    } catch (error) {
      console.error('Failed to connect:', error)
      setWsConnected(false)
      setConnectionStatus('disconnected')
      setWsInstance(null)
      setErrorMessage('Failed to establish connection')
      setReconnectAttempts(prev => prev + 1)
      setLastHeartbeat(null)
      return null
    }
  }

  // Function to manually trigger reconnection
  const handleReconnect = () => {
    setReconnectAttempts(0)
    connectWebSocket()
  }

  useEffect(() => {
    if (!isSensorEnabled) return

    // Initial connection
    const ws = connectWebSocket()

    // Send heartbeat every 2 seconds
    const heartbeatInterval = setInterval(checkServerStatus, 2000)

    // Check for stale connection every second
    const statusCheckInterval = setInterval(() => {
      if (lastHeartbeat) {
        const timeSinceLastHeartbeat = new Date().getTime() - lastHeartbeat.getTime()
        if (timeSinceLastHeartbeat > 5000) { // No heartbeat for 5 seconds
          console.log('Connection appears stale, reconnecting...')
          setConnectionStatus('disconnected')
          setErrorMessage('Connection timeout - no response from server')
          if (wsInstance) {
            wsInstance.close()
          }
        }
      }
    }, 1000)

    // Attempt to reconnect more frequently initially, then back off
    const reconnectInterval = setInterval(() => {
      if (!wsInstance || wsInstance.readyState === WebSocket.CLOSED) {
        const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000)
        console.log(`Attempting to reconnect... (Attempt ${reconnectAttempts + 1})`)
        setTimeout(connectWebSocket, backoffTime)
      }
    }, 2000)

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval)
      clearInterval(statusCheckInterval)
      clearInterval(reconnectInterval)
      if (wsInstance) {
        wsInstance.close()
      }
    }
  }, [isSensorEnabled, reconnectAttempts, lastHeartbeat])

  const handleSpaceClick = (index: number) => {
    if (spaceStates[index]) return; // Don't allow selecting occupied spaces
    setSelectedSpace(index)
    setShowPayment(true)
  }

  const handlePayment = () => {
    if (selectedSpace === null) return;
    
    const newStates = [...spaceStates]
    newStates[selectedSpace] = true
    setSpaceStates(newStates)
    setShowPayment(false)
    setSelectedSpace(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">{locationName}</h2>
        {isSensorEnabled && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse shadow-[0_0_10px_2px_rgba(34,197,94,0.6)] ring-2 ring-green-500/50' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                } shadow-lg shadow-current`} />
                <span className={`text-sm font-medium ${
                  connectionStatus === 'connected' ? 'text-green-400' :
                  connectionStatus === 'connecting' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {connectionStatus === 'connected' ? 'Sensor Live' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Sensor Offline'}
                </span>
              </div>
              {errorMessage && (
                <div className="text-xs text-red-400 px-4">
                  {errorMessage}
                </div>
              )}
              {lastHeartbeat && connectionStatus === 'connected' && (
                <div className="text-xs text-green-400 px-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  Last heartbeat: {new Date(lastHeartbeat).toLocaleTimeString()}
                </div>
              )}
            </div>
            {connectionStatus !== 'connected' && (
              <button
                onClick={handleReconnect}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors flex items-center gap-2"
              >
                Reconnect {reconnectAttempts > 0 && `(${reconnectAttempts})`}
              </button>
            )}
            {lastUpdateTime && connectionStatus === 'connected' && (
              <div className="text-sm text-white/60">
                Last update: {lastUpdateTime}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`
        ${isSensorEnabled 
          ? 'flex justify-center items-center min-h-[60vh]' 
          : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-8 bg-black/20 rounded-2xl'
        }
      `}>
        {Array.from({ length: totalSpaces }).map((_, index) => (
          <motion.div
            key={index}
            whileHover={!spaceStates[index] ? { 
              scale: 1.1,
              rotate: 2,
              transition: { type: "spring", stiffness: 300, damping: 10 }
            } : undefined}
            whileTap={!spaceStates[index] ? { scale: 0.95 } : undefined}
            className={`
              ${isSensorEnabled ? 'w-64 h-64' : 'w-full h-32 sm:h-40'}
              rounded-2xl flex flex-col items-center justify-center cursor-pointer
              relative overflow-hidden
              ${spaceStates[index] 
                ? 'bg-gray-500 cursor-not-allowed' 
                : selectedSpace === index
                ? 'bg-yellow-500'
                : 'bg-green-500 hover:bg-green-600 transform-gpu'
              }
              transition-all duration-300 ease-out
              ${spaceStates[index] ? '' : 'hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]'}
              ${connectionStatus === 'connected' 
                ? 'shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                : connectionStatus === 'connecting'
                ? 'shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                : 'shadow-[0_0_15px_rgba(239,68,68,0.5)]'}
            `}
            onClick={() => handleSpaceClick(index)}
          >
            {selectedSpace === index && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            <Car 
              className={`
                ${isSensorEnabled ? 'w-20 h-20' : 'w-12 h-12'}
                relative z-10
                ${spaceStates[index] ? 'text-gray-300' : 'text-white'}
                ${selectedSpace === index ? 'animate-pulse' : ''}
              `}
            />
            <span className={`
              text-white font-medium mt-4 relative z-10
              ${isSensorEnabled ? 'text-xl' : 'text-sm'}
            `}>
              Space {index + 1}
            </span>
            {spaceStates[index] && (
              <span className="text-white/80 text-sm mt-2 relative z-10">Occupied</span>
            )}
            {!spaceStates[index] && connectionStatus === 'connected' && (
              <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showPayment && (
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
                onClick={() => setShowPayment(false)} 
                className="absolute -top-3 -right-3 bg-white text-gray-600 hover:text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110 z-50 shadow-lg hover:shadow-xl"
              >
                <X size={20} />
              </button>

              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Payment for Space {selectedSpace !== null ? selectedSpace + 1 : ''}
                </h3>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
                    <p className="text-base font-medium text-gray-600">Amount to Pay</p>
                    <p className="text-2xl font-bold text-blue-600">₹30</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-xl shadow-sm mb-3">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('upi://pay?pa=chrsnikhil-1@oksbi&pn=Nikhil&am=30&cu=INR')}`}
                        alt="UPI QR Code"
                        className="w-36 h-36"
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

                      <div className="relative py-2">
                        <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
                        <p className="text-sm font-medium text-gray-400 bg-gray-50 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2">or</p>
                      </div>

                      <button
                        onClick={handlePayment}
                        className="w-full py-3 px-4 rounded-lg font-medium relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.1)_25%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative z-10 text-white">Mark as Paid</span>
                      </button>
                      <p className="text-xs text-gray-500 text-center">
                        Exploitation is a legal offense
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

