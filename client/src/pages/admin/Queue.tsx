import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import api from '../../services/api';
import { Registration } from '../../types';
import { Clock, Plus, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminQueue: React.FC = () => {
  const [queue, setQueue] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => {
      fetchQueue(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get('/admin/queue');
      if (res.data.success) {
        setQueue(res.data.queue);
      }
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handlePromote = async () => {
    try {
      setActionMessage(null);
      const res = await api.post('/admin/queue/promote-manual');
      if (res.data.success) {
        setActionMessage(res.data.message);
        fetchQueue(true);
        setTimeout(() => fetchQueue(true), 300);
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to promote student.');
    }
  };

  return (
    <AdminLayout title="Queue Management">
      <div className="space-y-6">
        
        {actionMessage && (
          <div className="p-3.5 bg-ms-blue-subtle text-ms-blue-dark text-xs font-semibold rounded border border-ms-blue/30 flex justify-between items-center">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="uppercase text-[10px]">
              Close
            </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-ms-gray-90 flex items-center">
              <Clock className="w-5 h-5 text-amber-600 mr-2" />
              FIFO Queue Pipeline
            </h2>
            <p className="text-xs text-ms-gray-60">
              Students automatically queue when capacity is full. Promotions occur FIFO on seat releases.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchQueue()}
              className="p-2 bg-ms-gray-10 border border-ms-gray-30 text-ms-gray-70 hover:text-ms-gray-90 rounded"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handlePromote}
              disabled={queue.length === 0}
              className="px-4 py-2 bg-ms-green text-white text-xs font-semibold rounded hover:bg-ms-green-dark transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Manually Promote Next Student</span>
            </button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-ms-gray-60 animate-pulse">
              Loading real queue records...
            </div>
          ) : queue.length === 0 ? (
            <div className="py-16 text-center text-ms-gray-60 space-y-2">
              <AlertCircle className="w-8 h-8 text-ms-gray-50 mx-auto" />
              <p className="font-semibold text-sm">The queue is currently empty.</p>
              <p className="text-xs">No students are currently waiting in the queue.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-ms-gray-10 border-b border-ms-gray-30 text-ms-gray-70 uppercase text-[11px]">
                    <th className="py-3 px-4 font-semibold">Position</th>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Enrollment #</th>
                    <th className="py-3 px-4 font-semibold">College & Course</th>
                    <th className="py-3 px-4 font-semibold">Queue Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ms-gray-30">
                  {queue.map((q) => (
                    <tr key={q.id} className="hover:bg-ms-gray-10/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-amber-700 text-sm">
                        #{q.queuePosition}
                      </td>
                      <td className="py-3 px-4 font-semibold text-ms-gray-90">{q.fullName}</td>
                      <td className="py-3 px-4 text-ms-gray-70">{q.email}</td>
                      <td className="py-3 px-4 font-mono text-ms-gray-80">{q.enrollmentNumber}</td>
                      <td className="py-3 px-4 text-ms-gray-70">
                        {q.college} ({q.course})
                      </td>
                      <td className="py-3 px-4 text-ms-gray-60">
                        {new Date(q.createdAt).toLocaleString()}
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
