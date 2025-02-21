"use client"

import React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Car, X } from "lucide-react"

type ParkingSpaceBookingProps = {
  locationName: string
  totalSpaces: number
}

type SpaceState = 'available' | 'selected' | 'booked';

export default function ParkingSpaceBookingForPayment({ 
  locationName,
  totalSpaces,
}: ParkingSpaceBookingProps) {
  const [showPayment, setShowPayment] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verificationTimer, setVerificationTimer] = useState(60)
  const [selectedSpace, setSelectedSpace] = useState<number | null>(null)
  const [spaceStates, setSpaceStates] = useState<SpaceState[]>(Array(totalSpaces).fill('available'))
  const [transactionDetails, setTransactionDetails] = useState<{
    id: string;
    timestamp: string;
    amount: string;
    spaceNumber: number;
  } | null>(null);

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
          amount: '₹30.00',
          spaceNumber: selectedSpace! + 1
        });
        setPaymentVerified(true);
        
        // Mark the space as booked after successful payment
        if (selectedSpace !== null) {
          setSpaceStates(prev => {
            const newStates = [...prev];
            newStates[selectedSpace] = 'booked';
            return newStates;
          });
        }
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
  }, [showPayment, selectedSpace, paymentVerified]);

  const handleSpaceClick = (index: number) => {
    if (spaceStates[index] === 'booked') return;
    
    // If clicking the same space, deselect it and close payment
    if (selectedSpace === index) {
      setSelectedSpace(null);
      setSpaceStates(prev => {
        const newStates = [...prev];
        newStates[index] = 'available';
        return newStates;
      });
      setShowPayment(false);
      return;
    }

    // If a different space was previously selected, make it available again
    if (selectedSpace !== null) {
      setSpaceStates(prev => {
        const newStates = [...prev];
        newStates[selectedSpace] = 'available';
        return newStates;
      });
    }

    // Select the new space and show payment
    setSelectedSpace(index);
    setSpaceStates(prev => {
      const newStates = [...prev];
      newStates[index] = 'selected';
      return newStates;
    });
    setShowPayment(true);
    setPaymentVerified(false);
    setVerificationTimer(60);
    setTransactionDetails(null);
  }

  const handleClosePayment = () => {
    setShowPayment(false)
    setPaymentVerified(false)
    setVerificationTimer(60)
    setTransactionDetails(null)
    
    // If payment wasn't verified, make the space available again
    if (!paymentVerified && selectedSpace !== null) {
      setSpaceStates(prev => {
        const newStates = [...prev];
        newStates[selectedSpace] = 'available';
        return newStates;
      });
      setSelectedSpace(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">{locationName}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: totalSpaces }).map((_, index) => (
          <motion.div
            key={index}
            onClick={() => {
              if (spaceStates[index] !== 'booked') {
                handleSpaceClick(index);
              }
            }}
            whileHover={spaceStates[index] !== 'booked' ? { scale: 1.05 } : undefined}
            className={`
              relative w-full pt-[100%] // Square aspect ratio
              rounded-xl cursor-pointer
              ${spaceStates[index] === 'booked' 
                ? 'bg-gray-500 cursor-not-allowed' 
                : spaceStates[index] === 'selected'
                  ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                  : 'bg-green-500 hover:bg-green-600'
              }
              transition-all duration-300
            `}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Car 
                className={`
                  w-8 h-8 sm:w-10 sm:h-10
                  ${spaceStates[index] === 'booked' 
                    ? 'text-gray-300' 
                    : spaceStates[index] === 'selected'
                      ? 'text-yellow-100'
                      : 'text-white'
                  }
                `}
              />
              <span className="text-white text-sm mt-2">
                Space {index + 1}
              </span>
              <span className="text-xs mt-1 text-white/80">
                {spaceStates[index] === 'booked' 
                  ? 'Booked' 
                  : spaceStates[index] === 'selected'
                    ? 'Selected'
                    : 'Click to Book'
                }
              </span>
            </div>
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
                onClick={handleClosePayment} 
                className="absolute -top-3 -right-3 bg-white text-gray-600 hover:text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110 z-50 shadow-lg hover:shadow-xl"
              >
                <X size={20} />
              </button>

              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {paymentVerified ? 'Payment Verified!' : 'Payment Details'}
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
                        <span className="text-gray-800">{transactionDetails?.spaceNumber}</span>
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
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('upi://pay?pa=chrsnikhil-1@oksbi&pn=Nikhil&am=30&cu=INR')}`}
                          alt="UPI QR Code"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}