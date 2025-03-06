'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import SignUpModal from './SignUpModal';
import SignInModal from './SignInModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import Image from 'next/image';

export default function Hero() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSignUpModalOpen(true);
  };

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSignInModalOpen(true);
  };

  return (
    <div className="relative h-[85vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.jpg"
          alt="Fitness background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-black/50" />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="text-center w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6"
          >
            Track Your Weight Journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Monitor your progress, set goals, and achieve your fitness objectives with our intuitive weight tracking platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleGetStarted}
              className="relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={handleSignIn}
              className="relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-transparent border-2 border-white rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
            >
              Sign In
            </button>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSignInClick={() => {
          setIsSignUpModalOpen(false);
          setIsSignInModalOpen(true);
        }}
      />
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSignUpClick={() => {
          setIsSignInModalOpen(false);
          setIsSignUpModalOpen(true);
        }}
        onForgotPasswordClick={() => {
          setIsSignInModalOpen(false);
          setIsForgotPasswordModalOpen(true);
        }}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </div>
  );
} 