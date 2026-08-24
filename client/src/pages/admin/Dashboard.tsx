import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import api from '../../services/api';
import { DashboardStats } from '../../types';
import { Users, CheckCircle2, Clock, XCircle, UserCheck, QrCode, AlertCircle, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to retrieve real database metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualPromote = async () => {
    try {
      setActionMessage(null);
      const res = await api.post('/admin/queue/promote-manual');
      if (res.data.success) {
        setActionMessage(res.data.message);
        fetchStats();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to promote queued student.');
    }
  };

  return (
    <AdminLayout title="System Dashboard">
      <div className="space-y-8">
        
        {/* Action feedback alert */}
        {actionMessage && (
          <div className="p-4 bg-ms-blue-subtle border border-ms-blue/30 rounded-lg text-sm text-ms-blue-dark flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-xs font-bold uppercase">
              Dismiss
            </button>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent">
          <div>
            <h2 className="text-lg font-bold text-ms-gray-90">Real-Time Event Statistics</h2>
            <p className="text-xs text-ms-gray-60">
              Live database queries. Zero dummy or simulated records.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchStats}
              className="p-2 bg-ms-gray-10 border border-ms-gray-30 text-ms-gray-70 hover:text-ms-gray-90 rounded hover:bg-ms-gray-20 transition-colors"
              title="Refresh Stats"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleManualPromote}
              className="px-3.5 py-2 bg-ms-green text-white text-xs font-semibold rounded hover:bg-ms-green-dark transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Promote Next Queue</span>
            </button>

            <Link
              to="/admin/scanner"
              className="px-3.5 py-2 bg-ms-blue text-white text-xs font-semibold rounded hover:bg-ms-blue-dark transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <QrCode className="w-4 h-4" />
              <span>Open Scanner</span>
            </Link>
          </div>
        </div>

        {/* Stat Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-ms-gray-60 animate-pulse font-semibold">
            Querying database metrics...
          </div>
        ) : error ? (
          <div className="p-6 bg-ms-red-subtle text-ms-red-dark rounded-xl border border-ms-red/30">
            {error}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Registrations */}
            <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-ms-gray-60 uppercase">Total Submissions</span>
                <div className="p-2 bg-ms-blue-subtle text-ms-blue rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-ms-gray-90 mt-2">{stats.totalRegistrations}</div>
              <span className="text-[11px] text-ms-gray-60 block mt-1">Total student submissions</span>
            </div>

            {/* Confirmed Seats */}
            <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-ms-gray-60 uppercase">Confirmed Seats</span>
                <div className="p-2 bg-ms-green-subtle text-ms-green-dark rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-ms-green-dark mt-2">{stats.confirmed}</div>
              <span className="text-[11px] text-ms-gray-60 block mt-1">Confirmed with YES button</span>
            </div>

            {/* Queue Count */}
            <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-ms-gray-60 uppercase">In Queue</span>
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-amber-700 mt-2">{stats.queue}</div>
              <span className="text-[11px] text-ms-gray-60 block mt-1">Awaiting capacity opening</span>
            </div>

            {/* Attendance Present */}
            <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-ms-gray-60 uppercase">Present At Event</span>
                <div className="p-2 bg-blue-100 text-ms-blue-dark rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-ms-blue mt-2">{stats.present}</div>
              <span className="text-[11px] text-ms-gray-60 block mt-1">Scanned QR tickets</span>
            </div>

            {/* Remaining Seats */}
            <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-ms-gray-60 uppercase">Remaining Seats</span>
                <div className="p-2 bg-ms-gray-20 text-ms-gray-80 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-ms-gray-90 mt-2">{stats.remainingSeats}</div>
              <span className="text-[11px] text-ms-gray-60 block mt-1">Capacity: {stats.totalCapacity}</span>
            </div>

            {/* Pending Confirmation */}
            <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-ms-gray-60 uppercase">Pending Response</span>
                <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-amber-800 mt-2">{stats.pending}</div>
              <span className="text-[11px] text-ms-gray-60 block mt-1">Email sent, awaiting YES/NO</span>
            </div>

            {/* Cancelled / Expired */}
            <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-ms-gray-60 uppercase">Cancelled / Expired</span>
                <div className="p-2 bg-ms-red-subtle text-ms-red-dark rounded-lg">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-ms-red-dark mt-2">
                {stats.cancelled + stats.expired}
              </div>
              <span className="text-[11px] text-ms-gray-60 block mt-1">Declined or timed out</span>
            </div>

          </div>
        ) : null}

        {/* Capacity Overview Bar */}
        {stats && (
          <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-ms-gray-80">
              <span>Overall Seat Occupancy</span>
              <span>
                {stats.confirmed + stats.pending + stats.present} / {stats.totalCapacity} Allocated
              </span>
            </div>
            <div className="w-full h-4 bg-ms-gray-20 rounded-full overflow-hidden flex">
              <div
                title="Confirmed Seats"
                style={{ width: `${(stats.confirmed / stats.totalCapacity) * 100}%` }}
                className="bg-ms-green h-full"
              ></div>
              <div
                title="Present"
                style={{ width: `${(stats.present / stats.totalCapacity) * 100}%` }}
                className="bg-ms-blue h-full"
              ></div>
              <div
                title="Pending"
                style={{ width: `${(stats.pending / stats.totalCapacity) * 100}%` }}
                className="bg-ms-yellow h-full"
              ></div>
            </div>
            <div className="flex items-center space-x-6 text-xs text-ms-gray-60 pt-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-ms-green rounded-full"></span>
                <span>Confirmed ({stats.confirmed})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-ms-blue rounded-full"></span>
                <span>Present ({stats.present})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-ms-yellow rounded-full"></span>
                <span>Pending Response ({stats.pending})</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
