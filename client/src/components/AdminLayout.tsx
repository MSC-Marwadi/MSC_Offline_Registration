import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AdminUser } from '../types';
import { LayoutDashboard, Users, Clock, QrCode, UserCheck, Settings, FileText, LogOut, ShieldCheck, Download } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/me');
      if (res.data.success) {
        setAdmin(res.data.admin);
      }
    } catch (err) {
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/admin/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      navigate('/admin/login');
    }
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/registrations', label: 'Registrations', icon: Users },
    { path: '/admin/queue', label: 'Queue List', icon: Clock },
    { path: '/admin/attendance', label: 'Attendance', icon: UserCheck },
    { path: '/admin/scanner', label: 'QR Scanner', icon: QrCode },
    { path: '/admin/settings', label: 'Event Settings', icon: Settings },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ms-gray-10 text-ms-gray-70 text-sm font-semibold">
        Verifying Admin Credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-ms-gray-10">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#004578] text-white flex flex-col fixed inset-y-0 z-30 shadow-lg">
        {/* Header */}
        <div className="h-16 flex items-center space-x-3 px-6 border-b border-ms-blue-dark">
          <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
            <div className="bg-[#F25022] w-2 h-2"></div>
            <div className="bg-[#7FBA00] w-2 h-2"></div>
            <div className="bg-[#50E6FF] w-2 h-2"></div>
            <div className="bg-[#FFB900] w-2 h-2"></div>
          </div>
          <span className="font-semibold text-base tracking-wide text-white">Admin Control</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-ms-blue text-white shadow'
                    : 'text-ms-blue-subtle/80 hover:bg-ms-blue-dark hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile & Logout Footer */}
        <div className="p-4 border-t border-ms-blue-dark bg-ms-blue-deeper/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-ms-blue flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold block text-white truncate">{admin?.name}</span>
              <span className="text-[10px] text-ms-blue-light block truncate">{admin?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded text-ms-blue-light hover:text-white hover:bg-ms-blue-dark transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-ms-gray-30 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <h1 className="text-lg font-bold text-ms-gray-90">{title}</h1>

          <div className="flex items-center space-x-4">
            <a
              href="/api/admin/export/registrations"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-ms-gray-20 text-ms-gray-80 text-xs font-semibold rounded border border-ms-gray-30 hover:bg-ms-gray-30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            <div className="h-4 w-px bg-ms-gray-40"></div>

            <Link
              to="/"
              target="_blank"
              className="text-xs font-medium text-ms-blue hover:underline flex items-center"
            >
              <span>Public Portal &rarr;</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};
