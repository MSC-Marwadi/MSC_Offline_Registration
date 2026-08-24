import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotAccepted: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-ms-gray-10">
      <Navbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent p-8 space-y-4">
            <div className="w-12 h-12 bg-ms-gray-20 text-ms-gray-70 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-ms-gray-90">Registration Status Notice</h1>
            <p className="text-xs text-ms-gray-70 leading-relaxed">
              All event seats have been allocated and confirmed. Queue promotions have concluded for this event.
            </p>
            <div className="pt-4 border-t border-ms-gray-30">
              <Link
                to="/"
                className="inline-flex items-center text-xs font-semibold text-ms-blue hover:underline space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Event Homepage</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
