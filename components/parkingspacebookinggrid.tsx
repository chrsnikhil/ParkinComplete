"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Car } from 'lucide-react'
import Image from 'next/image'

type ParkingSpaceGridProps = {
  locationName: string
  totalSpaces?: number
}

export default function ParkingSpaceGridBooking({ 
  locationName,
  totalSpaces = 30
}: ParkingSpaceGridProps) {
  const [selectedSpace, setSelectedSpace] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verificationTimer, setVerificationTimer] = useState(60)
  const [transactionDetails, setTransactionDetails] = useState<{
    id: string;
    timestamp: string;
    amount: string;
  } | null>(null)

  const spaces = Array.from({ length: totalSpaces }, (_, i) => i + 1)

  const handleSpaceClick = (spaceNumber: number) => {
    setSelectedSpace(spaceNumber)
  }

  const handleProceedToPayment = () => {
    if (selectedSpace) {
      setShowPayment(true)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">{locationName}</h2>
      
      {!showPayment ? (
        <>
          <div className="grid grid-cols-5 gap-4 mb-8">
            {spaces.map((space) => (
              <motion.div
                key={space}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSpaceClick(space)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer
                  ${selectedSpace === space 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }
                  transition-colors duration-200
                `}
              >
                <Car className={`w-8 h-8 mb-2 ${selectedSpace === space ? 'text-white' : 'text-gray-600'}`} />
                <span className="font-medium">Space {space}</span>
              </motion.div>
            ))}
          </div>

          <button
            onClick={handleProceedToPayment}
            disabled={!selectedSpace}
            className={`
              w-full py-3 rounded-lg font-medium text-white
              ${selectedSpace 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-300 cursor-not-allowed'
              }
              transition-colors duration-200
            `}
          >
            {selectedSpace ? 'Proceed to Payment' : 'Select a Space'}
          </button>
        </>
      ) : (
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
            <p className="text-base font-medium text-gray-600">Amount to Pay</p>
            <p className="text-2xl font-bold text-blue-600">₹30</p>
            <div className="mt-2 text-sm text-gray-500">
              Selected Space: {selectedSpace}
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
  )
} 