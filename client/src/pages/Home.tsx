import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import api from '../services/api';
import { EventConfig } from '../types';
import { Calendar, MapPin, Users, Clock, CheckCircle2, ChevronRight, HelpCircle, AlertCircle, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  const [eventData, setEventData] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    fetchEventInfo();
  }, []);

  const fetchEventInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/public/event-info');
      if (res.data.success) {
        setEventData(res.data.event);
      }
    } catch (err: any) {
      console.error('Error loading event info:', err);
      setError('Unable to load event details right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusQuery.trim()) return;

    try {
      setStatusLoading(true);
      setStatusError(null);
      setStatusResult(null);

      const res = await api.get(`/public/check-status?query=${encodeURIComponent(statusQuery.trim())}`);
      if (res.data.success) {
        setStatusResult(res.data.registration);
      }
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'No registration record found for this input.');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ms-gray-10">
      <Navbar availableSeats={eventData?.availableSeats} totalCapacity={eventData?.totalCapacity} />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white via-ms-blue-subtle/30 to-ms-gray-10 border-b border-ms-gray-30 py-16 lg:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-ms-blue-subtle text-ms-blue border border-ms-blue/20 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-ms-blue animate-pulse"></span>
                <span>Official Microsoft Student Chapter Event</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-ms-gray-90 tracking-tight leading-tight">
                {loading ? 'Loading Event Info...' : eventData?.name || 'MSC Annual Tech Symposium 2026'}
              </h1>

              <p className="text-base sm:text-lg text-ms-gray-70 leading-relaxed whitespace-pre-line">
                {eventData?.description ||
                  'Join top student innovators, cloud architects, and tech leaders for hands-on workshops, keynotes, and project showcases.'}
              </p>

              {/* Event Metadata Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start space-x-3 p-3.5 bg-white rounded-lg border border-ms-gray-30 shadow-fluent">
                  <Calendar className="w-5 h-5 text-ms-blue mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-ms-gray-60 uppercase block">Date & Time</span>
                    <span className="text-sm font-medium text-ms-gray-90">
                      {eventData?.eventDate ? new Date(eventData.eventDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }) : 'Date TBD'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-white rounded-lg border border-ms-gray-30 shadow-fluent">
                  <MapPin className="w-5 h-5 text-ms-red mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-ms-gray-60 uppercase block">Venue</span>
                    <span className="text-sm font-medium text-ms-gray-90">{eventData?.venue || 'Main Auditorium'}</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold rounded bg-ms-blue text-white hover:bg-ms-blue-dark transition-all shadow-fluent-depth-8 hover:shadow-fluent-depth-16"
                >
                  <span>Register Now</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>

                <a
                  href="#check-status"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold rounded bg-white text-ms-gray-80 border border-ms-gray-40 hover:bg-ms-gray-20 transition-all shadow-sm"
                >
                  <span>Check Status</span>
                </a>
              </div>
            </div>

            {/* Right Side Capacity Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-ms-gray-30 p-6 sm:p-8 shadow-fluent-depth-16">
                <div className="flex items-center justify-between border-b border-ms-gray-30 pb-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-ms-blue" />
                    <h3 className="font-semibold text-ms-gray-90 text-lg">Live Seat Status</h3>
                  </div>
                  <span className="text-xs font-mono bg-ms-gray-20 text-ms-gray-70 px-2.5 py-1 rounded">
                    Real-time DB
                  </span>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-ms-gray-60 animate-pulse">Loading live capacity data...</div>
                ) : error ? (
                  <div className="p-4 bg-ms-red-subtle text-ms-red-dark rounded text-sm">{error}</div>
                ) : (
                  <div className="space-y-6">
                    {/* Primary Seat Metric */}
                    <div className="text-center p-6 bg-ms-blue-subtle/50 rounded-lg border border-ms-blue/20">
                      <span className="text-xs font-semibold text-ms-blue uppercase tracking-wider block">
                        Available Seats Remaining
                      </span>
                      <div className="text-5xl font-black text-ms-blue my-2 tracking-tight">
                        {eventData?.availableSeats}
                      </div>
                      <span className="text-xs text-ms-gray-70">
                        Out of {eventData?.totalCapacity} Total Allocated Seats
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-ms-gray-70 mb-1.5">
                        <span>Confirmed & Allocated ({eventData ? eventData.totalCapacity - eventData.availableSeats : 0})</span>
                        <span>Capacity ({eventData?.totalCapacity})</span>
                      </div>
                      <div className="w-full h-3 bg-ms-gray-30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ms-blue transition-all duration-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              eventData
                                ? ((eventData.totalCapacity - eventData.availableSeats) / eventData.totalCapacity) * 100
                                : 0
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* DB Statistics Grid */}
                    <div className="grid grid-cols-2 gap-4 text-center text-xs">
                      <div className="p-3 bg-ms-gray-10 rounded border border-ms-gray-30">
                        <span className="text-ms-gray-60 block">Confirmed Seats</span>
                        <span className="text-lg font-bold text-ms-green-dark">{eventData?.confirmedCount}</span>
                      </div>

                      <div className="p-3 bg-ms-gray-10 rounded border border-ms-gray-30">
                        <span className="text-ms-gray-60 block">Current Queue</span>
                        <span className="text-lg font-bold text-amber-700">{eventData?.queueCount}</span>
                      </div>
                    </div>

                    <div className="text-xs text-ms-gray-60 text-center leading-relaxed">
                      * Registrations beyond seat capacity automatically enter the queue. If an allocated seat is declined or expires, queue members are promoted FIFO.
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Status Lookup Tool Section */}
      <section id="check-status" className="py-12 bg-white border-b border-ms-gray-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-ms-gray-10 rounded-xl border border-ms-gray-30 p-6 sm:p-8 shadow-fluent">
            <h3 className="text-xl font-bold text-ms-gray-90 mb-2 flex items-center">
              <CheckCircle2 className="w-5 h-5 text-ms-blue mr-2" />
              Check Your Registration Status
            </h3>
            <p className="text-sm text-ms-gray-70 mb-6">
              Enter your email address or enrollment number to view your seat or queue position.
            </p>

            <form onSubmit={handleStatusCheck} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter Email or Enrollment Number..."
                value={statusQuery}
                onChange={(e) => setStatusQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded border border-ms-gray-40 text-sm focus:outline-none focus:ring-2 focus:ring-ms-blue bg-white"
              />
              <button
                type="submit"
                disabled={statusLoading}
                className="px-6 py-2.5 bg-ms-blue text-white text-sm font-semibold rounded hover:bg-ms-blue-dark transition-colors disabled:opacity-50"
              >
                {statusLoading ? 'Searching...' : 'Check Status'}
              </button>
            </form>

            {statusError && (
              <div className="mt-4 p-3 bg-ms-red-subtle text-ms-red-dark text-xs rounded border border-ms-red/20 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            {statusResult && (
              <div className="mt-6 p-4 bg-white rounded border border-ms-blue/30 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-ms-gray-90">{statusResult.fullName}</h4>
                    <p className="text-xs text-ms-gray-60">{statusResult.email} | Enrollment: {statusResult.enrollmentNumber}</p>
                  </div>
                  <span className="px-3 py-1 bg-ms-blue-subtle text-ms-blue text-xs font-bold rounded-full">
                    {statusResult.status}
                  </span>
                </div>

                {statusResult.status === 'QUEUED' && (
                  <div className="p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900 font-medium">
                    Queue Position: <strong className="text-base text-amber-700">#{statusResult.queuePosition}</strong>
                  </div>
                )}

                {statusResult.uniqueId && (
                  <div className="p-3 bg-ms-green-subtle rounded border border-ms-green/30 text-xs text-ms-green-dark font-medium">
                    Assigned Unique ID: <strong className="text-base">{statusResult.uniqueId}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-ms-gray-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-ms-gray-90">Frequently Asked Questions</h2>
            <p className="text-sm text-ms-gray-60 mt-2">Everything you need to know about seat confirmation & queue rules.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-ms-gray-30 shadow-fluent">
              <h3 className="font-semibold text-ms-gray-90 flex items-center">
                <HelpCircle className="w-4 h-4 text-ms-blue mr-2" />
                How does seat allocation work?
              </h3>
              <p className="text-sm text-ms-gray-70 mt-2 leading-relaxed">
                The first 100 eligible students receive an initial seat allocation in <code className="bg-ms-gray-20 px-1 py-0.5 rounded text-xs">CONFIRMATION_PENDING</code> status and an email with secure YES/NO buttons.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-ms-gray-30 shadow-fluent">
              <h3 className="font-semibold text-ms-gray-90 flex items-center">
                <HelpCircle className="w-4 h-4 text-ms-blue mr-2" />
                What happens if I register after capacity is reached?
              </h3>
              <p className="text-sm text-ms-gray-70 mt-2 leading-relaxed">
                You will be automatically placed in a FIFO queue. You will receive an email displaying your exact queue position. As existing allocated seats are declined or expire, queue members are promoted sequentially.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-ms-gray-30 shadow-fluent">
              <h3 className="font-semibold text-ms-gray-90 flex items-center">
                <HelpCircle className="w-4 h-4 text-ms-blue mr-2" />
                What happens if a student declines or fails to respond before the deadline?
              </h3>
              <p className="text-sm text-ms-gray-70 mt-2 leading-relaxed">
                The system automatically cancels the seat allocation and promotes the next student in the queue. The promoted student receives a confirmation request email with a strict response window.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
