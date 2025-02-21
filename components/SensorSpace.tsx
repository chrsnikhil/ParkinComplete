"use client"

import { useEffect, useState } from 'react'
import { FaCar } from 'react-icons/fa'

interface SensorSpaceProps {
  wsUrl: string
  initialOccupied: boolean
}

export default function SensorSpace({ wsUrl, initialOccupied }: SensorSpaceProps) {
  const [wsConnected, setWsConnected] = useState(false)
  const [isOccupied, setIsOccupied] = useState(initialOccupied)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')
  const [showPayment, setShowPayment] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds

  useEffect(() => {
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket Connected')
      setWsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setIsOccupied(data.occupied)
        setLastUpdateTime(new Date().toLocaleTimeString())
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket Disconnected')
      setWsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [wsUrl])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showPayment && !paymentVerified) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setShowPayment(false)
            return 300
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [showPayment, paymentVerified])

  const handleSpaceClick = () => {
    if (!isOccupied && wsConnected) {
      setShowPayment(true)
    }
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=chrsnikhil-1@oksbi&pn=Nikhil&am=30&cu=INR`

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-white text-center mb-4">
        <p>Connection Status: {wsConnected ? 'Connected' : 'Disconnected'}</p>
        {lastUpdateTime && <p>Last Update: {lastUpdateTime}</p>}
      </div>

      <div
        onClick={handleSpaceClick}
        className={`
          relative w-64 h-64 rounded-lg flex items-center justify-center cursor-pointer
          transition-all duration-300 transform hover:scale-105
          ${isOccupied 
            ? 'bg-red-500 cursor-not-allowed' 
            : wsConnected 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gray-500 cursor-not-allowed'
          }
        `}
      >
        <FaCar className="text-white text-6xl" />
        {!isOccupied && wsConnected && (
          <div className="absolute bottom-4 text-white font-semibold">
            Click to Book
          </div>
        )}
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Complete Payment</h3>
            <p className="mb-4">Scan the QR code to pay ₹30</p>
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                width={200}
                height={200}
              />
            </div>
            <p className="text-center mb-4">
              Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowPayment(false)
                  setTimeLeft(300)
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPaymentVerified(true)
                  setShowPayment(false)
                }}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Verify Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 