import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PrivacyTerms: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-ms-gray-10">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-ms-gray-90">Privacy Policy & Terms of Service</h1>
            <p className="text-xs text-ms-gray-60 mt-1">Last updated: August 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ms-gray-90">1. Information We Collect</h2>
            <p className="text-xs text-ms-gray-70 leading-relaxed">
              We collect information provided during event registration, including full name, university email address, phone number, enrollment number, college, course, semester, and division. This data is strictly used for event registration, seat allocation, queue management, ticket issuance, and check-in attendance verification.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ms-gray-90">2. Queue & Confirmation Rules</h2>
            <p className="text-xs text-ms-gray-70 leading-relaxed">
              Seat allocations are processed on a first-come, first-served basis up to configured event capacity. Registrations past capacity enter a FIFO queue. Confirmation deadlines are strictly enforced by the server backend. Failure to confirm prior to expiration results in automatic cancellation and promotion of the next queue candidate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ms-gray-90">3. Attendance & QR Tokens</h2>
            <p className="text-xs text-ms-gray-70 leading-relaxed">
              Dynamic QR codes and Unique IDs issued to confirmed students are single-use tickets for physical event check-in. Duplicate scans are automatically blocked by the system database.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
