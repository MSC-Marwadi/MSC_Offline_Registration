import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CheckCircle2, Clock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';

export const Success: React.FC = () => {
  const location = useLocation();
  const state = location.state as { registration?: any; message?: string } | undefined;

  const registration = state?.registration;
  const isQueued = registration?.status === 'QUEUED';

  return (
    <div className="min-h-screen flex flex-col bg-ms-gray-10">
      <Navbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent-depth-16 p-8 sm:p-10 text-center">
            
            {isQueued ? (
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-ms-green-subtle text-ms-green-dark rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-ms-gray-90 mb-2">
              {isQueued ? 'Added to Registration Queue' : 'Registration Submitted!'}
            </h1>

            <p className="text-sm text-ms-gray-70 mb-6 leading-relaxed">
              {state?.message || 'Your registration request has been processed successfully.'}
            </p>

            {isQueued ? (
              <div className="bg-ms-gray-10 border border-ms-gray-30 rounded-lg p-6 mb-8 text-center">
                <span className="text-xs font-semibold text-ms-gray-60 uppercase tracking-wider block">
                  Your Assigned Queue Position
                </span>
                <div className="text-5xl font-black text-amber-700 my-2">
                  #{registration?.queuePosition}
                </div>
                <p className="text-xs text-ms-gray-60 mt-2">
                  We sent a queue confirmation email to <strong>{registration?.email}</strong>. If an allocated seat opens up, you will be notified instantly.
                </p>
              </div>
            ) : (
              <div className="bg-ms-blue-subtle/60 border border-ms-blue/20 rounded-lg p-6 mb-8 text-left space-y-3">
                <div className="flex items-center space-x-2 text-ms-blue font-semibold text-sm">
                  <Mail className="w-5 h-5" />
                  <span>Action Required: Check Your Email</span>
                </div>
                <p className="text-xs text-ms-gray-80 leading-relaxed">
                  We sent a confirmation email to <strong>{registration?.email}</strong>.
                </p>
                <p className="text-xs text-ms-gray-70 leading-relaxed">
                  Please open the email and click <strong>YES</strong> before your deadline (<strong>{registration?.confirmationDeadline ? new Date(registration.confirmationDeadline).toLocaleString() : '24 hours'}</strong>) to receive your Unique ID & QR entry code.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="px-6 py-2.5 bg-ms-blue text-white text-sm font-semibold rounded hover:bg-ms-blue-dark transition-colors inline-flex items-center justify-center space-x-2"
              >
                <span>Return to Home</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
