"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Car } from 'lucide-react'

type ParkingSpaceGridProps = {
  locationName: string
  totalSpaces?: number
}

export default function ParkingSpaceGridBooking({ 
  locationName,
  totalSpaces = 30
}: ParkingSpaceGridProps) {
  const [selectedSpace, setSelectedSpace] = useState<number | null>(null)

  const spaces = Array.from({ length: totalSpaces }, (_, i) => i + 1)

  const handleSpaceClick = (spaceNumber: number) => {
    setSelectedSpace(spaceNumber)
  }

  const handleProceedToPayment = () => {
    if (selectedSpace) {
      // Handle payment logic through props or navigation
      console.log(`Proceeding to payment for space ${selectedSpace}`)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">{locationName}</h2>
      
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
    </div>
  )
} 