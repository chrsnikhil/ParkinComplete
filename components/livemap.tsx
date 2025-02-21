"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Car } from "lucide-react"

// Replace this with your ESP32's IP address that you got from Serial Monitor
const ESP32_IP = '192.168.136.162';
const WEBSOCKET_URL = `ws://${ESP32_IP}:81`;

export default function LiveMap() {
  const [wsConnected, setWsConnected] = useState(false)
  const [isOccupied, setIsOccupied] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [distance, setDistance] = useState<number | null>(null)

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
      <h2 className="text-3xl font-bold mb-6 text-white">Live Parking Map</h2>
      <div className="mb-4 p-4 rounded-lg bg-black/30 text-white">
        <p>ESP32 Sensor Status:</p>
        <p className="text-sm opacity-70">Status: {connectionStatus}</p>
        {lastUpdateTime && (
          <p className="text-sm opacity-70">Last Update: {lastUpdateTime}</p>
        )}
      </div>

      <div className="flex justify-center items-center min-h-[60vh]">
        <motion.div
          className={`
            w-64 h-64
            rounded-2xl flex flex-col items-center justify-center
            relative overflow-hidden
            ${isOccupied 
              ? 'bg-red-500 cursor-not-allowed' 
              : 'bg-green-500'
            }
            transition-all duration-300 ease-out
            ${wsConnected 
              ? isOccupied
                ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'shadow-[0_0_15px_rgba(34,197,94,0.5)]'
              : 'shadow-[0_0_15px_rgba(148,163,184,0.5)]'
            }
          `}
        >
          <Car 
            className={`
              w-20 h-20
              relative z-10
              ${isOccupied ? 'text-red-100' : 'text-white'}
            `}
          />
          <span className="text-white font-medium mt-4 relative z-10 text-xl">
            Space 1
          </span>
          <span className="text-white/80 text-sm mt-2 relative z-10">
            {isOccupied ? 'Occupied' : 'Available'}
          </span>
          {!isOccupied && wsConnected && (
            <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 