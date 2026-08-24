import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import api from '../../services/api';
import { AuditLog } from '../../types';
import { FileText, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/audit-logs');
      if (res.data.success) {
        setLogs(res.data.auditLogs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="System Audit Trail">
      <div className="space-y-6">
        
        <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-ms-gray-90 flex items-center">
              <FileText className="w-5 h-5 text-ms-blue mr-2" />
              Audit Trail & Activity Log ({logs.length})
            </h2>
            <p className="text-xs text-ms-gray-60">
              Immutable historical record of registrations, confirmations, expirations, promotions, and scans.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 bg-ms-gray-10 border border-ms-gray-30 text-ms-gray-70 hover:text-ms-gray-90 rounded"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-ms-gray-60 animate-pulse">
              Loading system audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-ms-gray-60 space-y-2">
              <AlertCircle className="w-8 h-8 text-ms-gray-50 mx-auto" />
              <p className="font-semibold text-sm">No audit log entries recorded yet.</p>
              <p className="text-xs">Audit logs are created automatically when system state changes occur.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-ms-gray-10 border-b border-ms-gray-30 text-ms-gray-70 uppercase text-[11px]">
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Action Event</th>
                    <th className="py-3 px-4 font-semibold">Associated Student</th>
                    <th className="py-3 px-4 font-semibold">Admin / Trigger</th>
                    <th className="py-3 px-4 font-semibold">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ms-gray-30">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-ms-gray-10/50 transition-colors">
                      <td className="py-3 px-4 text-ms-gray-70 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-ms-blue">
                        <span className="bg-ms-blue-subtle px-2 py-0.5 rounded border border-ms-blue/20">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-ms-gray-90">
                        {log.registration ? (
                          <div>
                            <span className="font-semibold block">{log.registration.fullName}</span>
                            <span className="text-[11px] text-ms-gray-60">{log.registration.email}</span>
                          </div>
                        ) : (
                          <span className="text-ms-gray-50">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-ms-gray-70">
                        {log.adminId || 'System Worker'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-ms-gray-60 max-w-xs truncate">
                        {log.metadata || '—'}
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
