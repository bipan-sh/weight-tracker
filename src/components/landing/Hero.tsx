'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import SignUpModal from './SignUpModal';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const router = useRouter();

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSignUpModalOpen(true);
  };

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/auth/signin');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <pattern
            id="grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-white"
            />
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
            Welcome to{' '}
            <span className="text-indigo-400">Weight Tracker</span>
          </h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto text-xl text-gray-200"
          >
            Track your weight, meals, and exercises with ease. Achieve your fitness goals with our intuitive and powerful tracking tools.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <button
              onClick={handleGetStarted}
              type="button"
              className="relative inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              Get Started
            </button>
            <button
              onClick={handleSignIn}
              type="button"
              className="relative inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </motion.div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-indigo-400/20 rounded-full filter blur-3xl opacity-70"></div>
            <div className="w-64 h-64 bg-purple-400/20 rounded-full filter blur-3xl opacity-70"></div>
          </div>
        </motion.div>
      </div>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
      />
    </div>
  );
} 