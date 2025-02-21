"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Car } from "lucide-react"

// Replace this with your ESP32's IP address that you got from Serial Monitor
const ESP32_IP = '192.168.136.162';
const WEBSOCKET_URL = `ws://${ESP32_IP}:81`;

const TOTAL_SPACES = 30;
const SENSOR_CONTROLLED_SPACE = 0; // First space is controlled by sensor

export default function LiveMap() {
  const [wsConnected, setWsConnected] = useState(false)
  const [spaceStates, setSpaceStates] = useState<boolean[]>(Array(TOTAL_SPACES).fill(false))
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
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
              setSpaceStates(prev => {
                const newStates = [...prev];
                newStates[SENSOR_CONTROLLED_SPACE] = isSpaceOccupied;
                return newStates;
              });
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

  const handleSpaceClick = (index: number) => {
    if (index === SENSOR_CONTROLLED_SPACE) return; // Don't allow manual changes to sensor-controlled space
    setSpaceStates(prev => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {spaceStates.map((isOccupied, index) => (
          <motion.div
            key={index}
            onClick={() => handleSpaceClick(index)}
            whileHover={index !== SENSOR_CONTROLLED_SPACE ? { scale: 1.05 } : undefined}
            className={`
              relative w-full pt-[100%] // Square aspect ratio
              rounded-xl cursor-pointer
              ${isOccupied 
                ? 'bg-red-500' 
                : 'bg-green-500'
              }
              ${index === SENSOR_CONTROLLED_SPACE && wsConnected
                ? isOccupied
                  ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                : ''
              }
              transition-all duration-300
            `}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Car 
                className={`
                  w-8 h-8 sm:w-10 sm:h-10
                  ${isOccupied ? 'text-red-100' : 'text-white'}
                `}
              />
              <span className="text-white text-sm mt-2">
                Space {index + 1}
              </span>
              {index === SENSOR_CONTROLLED_SPACE && (
                <span className="absolute top-2 right-2 flex items-center">
                  <span className={`
                    w-2 h-2 rounded-full
                    ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}
                  `}/>
                </span>
              )}
            </div>
            {!isOccupied && index === SENSOR_CONTROLLED_SPACE && wsConnected && (
              <div className="absolute inset-0 bg-green-500/10 animate-pulse rounded-xl"/>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
} 