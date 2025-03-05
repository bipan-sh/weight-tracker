'use client';

import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
