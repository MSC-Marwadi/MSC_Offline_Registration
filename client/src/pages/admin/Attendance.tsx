import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import api from '../../services/api';
import { AttendanceRecord } from '../../types';
import { UserCheck, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/attendance');
      if (res.data.success) {
        setAttendance(res.data.attendance);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (registrationId: string) => {
    if (!window.confirm('Revert attendance status back to CONFIRMED?')) return;
    try {
      setActionMessage(null);
      const res = await api.post('/admin/attendance/undo', { registrationId });
      if (res.data.success) {
        setActionMessage('Attendance reverted successfully.');
        fetchAttendance();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to undo attendance.');
    }
  };

  return (
    <AdminLayout title="Attendance Records">
      <div className="space-y-6">
        
        {actionMessage && (
          <div className="p-3.5 bg-ms-blue-subtle text-ms-blue-dark text-xs font-semibold rounded border border-ms-blue/30 flex justify-between items-center">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="uppercase text-[10px]">
              Close
            </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-ms-gray-90 flex items-center">
              <UserCheck className="w-5 h-5 text-ms-blue mr-2" />
              Verified Event Check-Ins ({attendance.length})
            </h2>
            <p className="text-xs text-ms-gray-60">
              Live records of students scanned at venue entrance.
            </p>
          </div>

          <button
            onClick={fetchAttendance}
            className="p-2 bg-ms-gray-10 border border-ms-gray-30 text-ms-gray-70 hover:text-ms-gray-90 rounded"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-ms-gray-60 animate-pulse">
              Loading attendance records...
            </div>
          ) : attendance.length === 0 ? (
            <div className="py-16 text-center text-ms-gray-60 space-y-2">
              <AlertCircle className="w-8 h-8 text-ms-gray-50 mx-auto" />
              <p className="font-semibold text-sm">No attendance records yet.</p>
              <p className="text-xs">Scan QR tickets using the device camera scanner to record check-ins.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-ms-gray-10 border-b border-ms-gray-30 text-ms-gray-70 uppercase text-[11px]">
                    <th className="py-3 px-4 font-semibold">Unique ID</th>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Enrollment #</th>
                    <th className="py-3 px-4 font-semibold">Scanned Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Scanned By</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ms-gray-30">
                  {attendance.map((a) => (
                    <tr key={a.id} className="hover:bg-ms-gray-10/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-ms-blue text-sm">
                        {a.registration?.uniqueId || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-ms-gray-90">
                        {a.registration?.fullName}
                      </td>
                      <td className="py-3 px-4 text-ms-gray-70">{a.registration?.email}</td>
                      <td className="py-3 px-4 font-mono text-ms-gray-80">
                        {a.registration?.enrollmentNumber}
                      </td>
                      <td className="py-3 px-4 text-ms-gray-70 font-mono">
                        {new Date(a.scannedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-ms-gray-60">{a.scannedBy}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleUndo(a.registrationId)}
                          className="px-2.5 py-1 bg-ms-gray-20 text-ms-gray-80 rounded hover:bg-ms-red-subtle hover:text-ms-red-dark transition-colors inline-flex items-center space-x-1"
                          title="Undo Attendance"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};
