"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Car } from 'lucide-react'

type SensorSpaceProps = {
  wsUrl: string
  initialOccupied: boolean
}

export default function SensorSpace({ wsUrl, initialOccupied }: SensorSpaceProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isOccupied, setIsOccupied] = useState(initialOccupied)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const [spaceId, status] = event.data.split(':')
        if (spaceId === '1') {
          setIsOccupied(status === 'true')
          setLastUpdate(new Date().toLocaleTimeString())
        }
      } catch (error) {
        console.error('Error processing message:', error)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      setLastUpdate(null)
    }

    return () => {
      ws.close()
    }
  }, [wsUrl])

  return (
    <div className="relative">
      <motion.div
        className={`
          w-64 h-64
          rounded-2xl flex flex-col items-center justify-center
          relative overflow-hidden
          ${isOccupied 
            ? 'bg-red-500' 
            : isConnected
              ? 'bg-green-500'
              : 'bg-gray-500'
          }
          transition-colors duration-300
        `}
      >
        <Car 
          className={`
            w-20 h-20 mb-4
            ${isOccupied 
              ? 'text-red-100' 
              : isConnected
                ? 'text-white'
                : 'text-gray-300'
            }
          `}
        />
        <span className="text-white font-medium text-xl mb-2">
          Space 1
        </span>
        <span className="text-white/80 text-sm">
          {isConnected 
            ? isOccupied 
              ? 'Currently Occupied'
              : 'Available'
            : 'Sensor Offline'
          }
        </span>
        {isConnected && (
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ 
              backgroundColor: isOccupied 
                ? 'rgba(239, 68, 68, 0.1)' 
                : 'rgba(34, 197, 94, 0.1)' 
            }}
          />
        )}
      </motion.div>

      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div 
            className={`
              w-2 h-2 rounded-full
              ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
            `}
          />
          <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? 'Sensor Connected' : 'Sensor Offline'}
          </span>
          {lastUpdate && (
            <span className="text-gray-400 text-sm ml-2">
              Last update: {lastUpdate}
            </span>
          )}
        </div>
      </div>
    </div>
  )
} 