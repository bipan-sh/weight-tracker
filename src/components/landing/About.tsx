'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" ref={ref} className="py-24 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-900 sm:text-4xl"
          >
            About Weight Tracker
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto"
          >
            <p>Your trusted companion on the journey to a healthier you</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.7 }}
            className="relative rounded-xl overflow-hidden shadow-xl h-96"
          >
            <Image
              src="/images/about-fitness.jpg"
              alt="People tracking fitness goals"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent">
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <div className="font-semibold text-2xl mb-2">Our Mission</div>
                <p>Empowering individuals to achieve their health goals through data-driven insights</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-indigo-700 mb-3">Our Story</h3>
              <p className="text-gray-600">
                Weight Tracker was founded in 2023 with a simple mission: to make weight management accessible, 
                understandable, and achievable for everyone. We believe that by providing intuitive tools for 
                tracking progress, we can help people achieve lasting results.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-indigo-700 mb-3">Our Approach</h3>
              <p className="text-gray-600">
                We take a holistic approach to weight management, focusing not just on numbers, but on the 
                overall journey. Our platform combines easy tracking, visual analytics, and positive 
                reinforcement to keep you motivated and informed.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-indigo-700 mb-3">Our Values</h3>
              <ul className="text-gray-600 list-disc pl-6 space-y-2">
                <li><span className="font-medium">Privacy:</span> Your data is yours alone. We maintain strict privacy standards.</li>
                <li><span className="font-medium">Accessibility:</span> Our tools are designed for everyone, regardless of tech-savviness.</li>
                <li><span className="font-medium">Empowerment:</span> We believe information leads to empowerment and better decisions.</li>
                <li><span className="font-medium">Community:</span> Progress is better when shared. Connect with partners for mutual support.</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 