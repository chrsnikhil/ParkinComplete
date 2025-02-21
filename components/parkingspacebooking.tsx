"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Car, X } from "lucide-react"

// Replace this with your ESP32's IP address that you got from Serial Monitor
// Example: const ESP32_IP = '192.168.1.100';
const ESP32_IP = '192.168.136.162';
const WEBSOCKET_URL = `ws://${ESP32_IP}:81`;

const SENSOR_CONTROLLED_SPACE = 0; // First space is controlled by sensor

type ParkingSpaceBookingProps = {
  locationId: string
  locationName: string
  totalSpaces: number
  isSensorEnabled?: boolean
  wsUrl?: string
  initialOccupied?: boolean
}

export default function ParkingSpaceBooking({ 
  locationId, 
  locationName,
  totalSpaces,
  isSensorEnabled,
  wsUrl = WEBSOCKET_URL,
  initialOccupied = false
}: ParkingSpaceBookingProps) {
  const [wsConnected, setWsConnected] = useState(false)
  const [isOccupied, setIsOccupied] = useState(initialOccupied)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [showPayment, setShowPayment] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verificationTimer, setVerificationTimer] = useState(60)
  const [transactionDetails, setTransactionDetails] = useState<{
    id: string;
    timestamp: string;
    amount: string;
  } | null>(null);

  useEffect(() => {
    if (!isSensorEnabled) return;

    let wsInstance: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    function connectWebSocket() {
      try {
        wsInstance = new WebSocket(wsUrl);
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
              // Ensure connection status is set when receiving messages
              setWsConnected(true);
              setConnectionStatus('connected');
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        return wsInstance;
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        setWsConnected(false);
        setConnectionStatus('disconnected');
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
  }, [wsUrl, isSensorEnabled, reconnectAttempts]);

  // Payment verification timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;

    if (showPayment && !paymentVerified) {
      timer = setTimeout(() => {
        const timestamp = new Date().toLocaleString();
        setTransactionDetails({
          id: `PK${Date.now().toString().slice(-8)}`,
          timestamp,
          amount: '₹30.00'
        });
        setPaymentVerified(true);
      }, 30000);

      countdownTimer = setInterval(() => {
        setVerificationTimer(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
      setVerificationTimer(60);
    };
  }, [showPayment]);

  const handleSpaceClick = (index: number) => {
    if (index === SENSOR_CONTROLLED_SPACE && !wsConnected) return;
    setShowPayment(true)
    setPaymentVerified(false)
    setVerificationTimer(60)
    setTransactionDetails(null)
  }

  const handlePayment = () => {
    if (SENSOR_CONTROLLED_SPACE === null) return;
    
    setIsOccupied(true)
  }

  const handleClosePayment = () => {
    setShowPayment(false)
    setPaymentVerified(false)
    setVerificationTimer(60)
    setTransactionDetails(null)
  }

  // Update the space display to reflect real-time sensor state
  const getSpaceClassName = (index: number) => {
    if (!isSensorEnabled) return 'bg-green-500 hover:bg-green-600';
    if (index === 0) { // First space is controlled by sensor
      return isOccupied 
        ? 'bg-red-500 cursor-not-allowed'
        : 'bg-green-500 hover:bg-green-600';
    }
    return 'bg-green-500 hover:bg-green-600';
  };

  // Update the space display to show real-time status
  const isSpaceAvailable = (index: number) => {
    if (!isSensorEnabled) return true;
    if (index === 0) return !isOccupied;
    return true;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">{locationName}</h2>
        {isSensorEnabled && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500 animate-pulse shadow-[0_0_10px_2px_rgba(34,197,94,0.6)] ring-2 ring-green-500/50' 
                  : 'bg-red-500'
              } shadow-lg shadow-current`} />
              <span className={`text-sm font-medium ${connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                {connectionStatus === 'connected' ? 'Sensor Live' : 'Sensor Offline'}
              </span>
            </div>
            {lastUpdateTime && connectionStatus === 'connected' && (
              <div className="text-sm text-green-400">
                Last update: {lastUpdateTime}
              </div>
            )}
          </div>
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
                onClick={handleClosePayment} 
                className="absolute -top-3 -right-3 bg-white text-gray-600 hover:text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110 z-50 shadow-lg hover:shadow-xl"
              >
                <X size={20} />
              </button>

              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {paymentVerified ? 'Payment Verified!' : 'Payment for Space 1'}
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
                        <span className="text-gray-800">{locationName}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Space Number</span>
                        <span className="text-gray-800">1</span>
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


