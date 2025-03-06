'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      toast.success('Password reset instructions sent to your email!');
      onClose();
    } catch (error) {
      console.error('ForgotPassword - Error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Centering Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101]">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Enter your email address and we'll send you instructions to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
} 