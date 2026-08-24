import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import api from '../services/api';
import { CheckCircle2, XCircle, AlertCircle, Ticket, ArrowRight, Loader2 } from 'lucide-react';

export const Confirm: React.FC = () => {
  const { token, response } = useParams<{ token: string; response: string }>();

  const [loading, setLoading] = useState(true);
  const [successStatus, setSuccessStatus] = useState<'YES_CONFIRMED' | 'NO_CANCELLED' | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && (response === 'yes' || response === 'no')) {
      processToken();
    } else {
      setError('Invalid confirmation parameters.');
      setLoading(false);
    }
  }, [token, response]);

  const processToken = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/public/confirm/${token}/${response}`);

      if (res.data.success) {
        setSuccessStatus(res.data.status);
        setStudentName(res.data.studentName);
        setUniqueId(res.data.uniqueId);
        setMessage(res.data.message);

        // Confetti celebration if YES
        if (res.data.status === 'YES_CONFIRMED') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (err: any) {
      console.error('Confirmation processing error:', err);
      setError(
        err.response?.data?.message || 'Failed to process confirmation. The link may be expired or already used.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ms-gray-10">
      <Navbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent-depth-16 p-8 sm:p-10 text-center">
            
            {loading ? (
              <div className="py-12 space-y-4">
                <Loader2 className="w-10 h-10 text-ms-blue animate-spin mx-auto" />
                <p className="text-sm font-semibold text-ms-gray-70">Processing your confirmation token...</p>
              </div>
            ) : error ? (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-ms-red-subtle text-ms-red-dark rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-ms-gray-90">Confirmation Link Error</h1>
                <p className="text-sm text-ms-gray-70 leading-relaxed bg-ms-gray-10 p-4 rounded border border-ms-gray-30">
                  {error}
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-ms-blue text-white text-sm font-semibold rounded hover:bg-ms-blue-dark transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            ) : successStatus === 'YES_CONFIRMED' ? (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-ms-green-subtle text-ms-green-dark rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs font-semibold text-ms-green-dark bg-ms-green-subtle px-3 py-1 rounded-full border border-ms-green/30">
                    Attendance Confirmed
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-ms-gray-90 mt-3">
                    You're Officially Registered, {studentName}!
                  </h1>
                </div>

                {uniqueId && (
                  <div className="bg-ms-blue-subtle/50 border border-ms-blue/30 rounded-lg p-6">
                    <span className="text-xs font-semibold text-ms-blue uppercase tracking-wider block">
                      Your Official Event Unique ID
                    </span>
                    <div className="text-3xl font-mono font-bold text-ms-blue my-2 tracking-wider">
                      {uniqueId}
                    </div>
                    <p className="text-xs text-ms-gray-60">
                      We sent your official QR code ticket email to your registered inbox. Present your Unique ID or QR code at check-in.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center px-6 py-3 bg-ms-blue text-white text-sm font-semibold rounded hover:bg-ms-blue-dark transition-colors space-x-2"
                  >
                    <span>View Event Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-ms-gray-20 text-ms-gray-70 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8" />
                </div>

                <h1 className="text-2xl font-bold text-ms-gray-90">Seat Allocation Declined</h1>
                <p className="text-sm text-ms-gray-70 leading-relaxed">
                  Thank you for letting us know, {studentName}. Your seat has been released and made available to the next student in the queue.
                </p>

                <div className="pt-2">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-ms-gray-80 text-white text-sm font-semibold rounded hover:bg-ms-gray-90 transition-colors"
                  >
                    Return to Home
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
