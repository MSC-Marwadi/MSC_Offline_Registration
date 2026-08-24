import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/admin/login', {
        email: email.trim(),
        password,
      });

      if (res.data.success) {
        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ms-gray-10 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        
        {/* Microsoft Logo & Title */}
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl border border-ms-gray-30 shadow-fluent mb-4">
          <div className="grid grid-cols-2 gap-0.5 w-7 h-7">
            <div className="bg-[#F25022] w-3 h-3"></div>
            <div className="bg-[#7FBA00] w-3 h-3"></div>
            <div className="bg-[#0078D4] w-3 h-3"></div>
            <div className="bg-[#FFB900] w-3 h-3"></div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-ms-gray-90">Microsoft Admin Portal</h2>
        <p className="mt-1 text-xs text-ms-gray-60">
          Sign in to manage event registrations, queue, and attendance scanning.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-fluent-depth-16 rounded-xl border border-ms-gray-30 sm:px-10">
          
          {error && (
            <div className="mb-6 p-3.5 bg-ms-red-subtle border border-ms-red/30 rounded text-xs text-ms-red-dark flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-ms-gray-80 uppercase mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ms-gray-60 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@msc.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ms-gray-80 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ms-gray-60 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-ms-blue text-white text-sm font-semibold rounded hover:bg-ms-blue-dark transition-colors flex items-center justify-center space-x-2 shadow-fluent disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-ms-gray-30 text-center">
            <p className="text-[11px] text-ms-gray-60">
              Default Seed Admin: <code className="bg-ms-gray-10 px-1 py-0.5 rounded font-mono">admin@msc.edu</code> / <code className="bg-ms-gray-10 px-1 py-0.5 rounded font-mono">Admin@MSC2026</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
