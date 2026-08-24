import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Badge } from '../../components/Badge';
import api from '../../services/api';
import { Registration, RegistrationStatus } from '../../types';
import { Search, Filter, Mail, XCircle, Eye, X, AlertCircle, Plus, Edit2, CheckCircle2, Trash2 } from 'lucide-react';

export const AdminRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    enrollmentNumber: '',
    grNumber: '',
    department: 'CE',
    status: 'CONFIRMATION_PENDING' as RegistrationStatus,
    additionalInfo: '',
  });

  useEffect(() => {
    fetchRegistrations();
    // Auto-poll every 3 seconds for real-time table updates without manual browser refresh
    const interval = setInterval(() => {
      fetchRegistrations(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchRegistrations = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/admin/registrations', { params });
      if (res.data.success) {
        setRegistrations(res.data.registrations);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegistrations();
  };

  const handleCancelRegistration = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
    try {
      setActionMessage(null);
      const res = await api.post('/admin/registration/cancel', { registrationId: id });
      if (res.data.success) {
        setActionMessage('Registration cancelled successfully.');
        fetchRegistrations(true);
        setTimeout(() => fetchRegistrations(true), 300);
        setSelectedReg(null);
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to cancel registration.');
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this entry from the database? This action cannot be undone.')) return;
    try {
      setActionMessage(null);
      const res = await api.delete(`/admin/registration/${id}`);
      if (res.data.success) {
        setActionMessage(res.data.message || 'Registration entry permanently deleted.');
        fetchRegistrations(true);
        setTimeout(() => fetchRegistrations(true), 300);
        setSelectedReg(null);
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to delete registration entry.');
    }
  };

  const handleResendEmail = async (id: string) => {
    try {
      setActionMessage(null);
      const res = await api.post('/admin/resend-email', { registrationId: id });
      if (res.data.success) {
        setActionMessage('Email enqueued for delivery.');
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to resend email.');
    }
  };

  const openCreateModal = () => {
    setFormData({
      fullName: '',
      email: '',
      enrollmentNumber: '',
      grNumber: '',
      department: 'CE',
      status: 'CONFIRMATION_PENDING',
      additionalInfo: '',
    });
    setIsCreating(true);
  };

  const openEditModal = (reg: Registration) => {
    setEditingReg(reg);
    setFormData({
      fullName: reg.fullName,
      email: reg.email,
      enrollmentNumber: reg.enrollmentNumber,
      grNumber: reg.grNumber || '',
      department: reg.department || 'CE',
      status: reg.status,
      additionalInfo: reg.additionalInfo || '',
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionMessage(null);
      const res = await api.post('/admin/registration/create', formData);
      if (res.data.success) {
        setActionMessage('New registration created successfully.');
        setIsCreating(false);
        fetchRegistrations(true);
        setTimeout(() => fetchRegistrations(true), 300);
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to create registration.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    try {
      setActionMessage(null);
      const res = await api.put('/admin/registration/update', {
        registrationId: editingReg.id,
        ...formData,
      });
      if (res.data.success) {
        setActionMessage('Registration updated successfully.');
        setEditingReg(null);
        fetchRegistrations(true);
        setTimeout(() => fetchRegistrations(true), 300);
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Failed to update registration.');
    }
  };

  return (
    <AdminLayout title="Registration Management">
      <div className="space-y-6">
        
        {actionMessage && (
          <div className="p-3.5 bg-ms-blue-subtle text-ms-blue-dark text-xs font-semibold rounded border border-ms-blue/30 flex justify-between items-center">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="uppercase text-[10px]">
              Close
            </button>
          </div>
        )}

        {/* Search, Filter & Add Controls */}
        <div className="bg-white p-4 rounded-xl border border-ms-gray-30 shadow-sm flex flex-col sm:flex-row justify-between gap-4 items-center">
          
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-96 relative">
            <Search className="w-4 h-4 text-ms-gray-60 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Name, Email, Enrollment #, GR #, Unique ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-ms-gray-10 border border-ms-gray-40 rounded text-xs text-ms-gray-90 focus:outline-none focus:ring-2 focus:ring-ms-blue"
            />
          </form>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-ms-gray-60" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-ms-gray-10 border border-ms-gray-40 rounded text-xs text-ms-gray-90 focus:outline-none focus:ring-2 focus:ring-ms-blue"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CONFIRMATION_PENDING">Pending Confirmation</option>
                <option value="QUEUED">In Queue</option>
                <option value="PRESENT">Present</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-ms-blue text-white text-xs font-semibold rounded hover:bg-ms-blue-dark transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Registration</span>
            </button>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-ms-gray-60 animate-pulse">
              Loading registration records...
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-16 text-center text-ms-gray-60 space-y-2">
              <AlertCircle className="w-8 h-8 text-ms-gray-50 mx-auto" />
              <p className="font-semibold text-sm">No registrations found.</p>
              <p className="text-xs">No records match your search or filter parameters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-ms-gray-10 border-b border-ms-gray-30 text-ms-gray-70 uppercase text-[11px]">
                    <th className="py-3 px-4 font-semibold">Unique ID</th>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Enrollment / GR</th>
                    <th className="py-3 px-4 font-semibold">Dept</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Queue / Deadline</th>
                    <th className="py-3 px-4 font-semibold">Reg Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ms-gray-30">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-ms-gray-10/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-ms-blue">
                        {reg.uniqueId || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-ms-gray-90 block">{reg.fullName}</span>
                        <span className="text-ms-gray-60 text-[11px] block">{reg.email}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-ms-gray-80">
                        <div>Enr: {reg.enrollmentNumber}</div>
                        <div className="text-[11px] text-ms-gray-60">GR: {reg.grNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-ms-gray-80">{reg.department || 'CE'}</td>
                      <td className="py-3 px-4">
                        <Badge status={reg.status} />
                      </td>
                      <td className="py-3 px-4 text-ms-gray-70">
                        {reg.status === 'QUEUED' && (
                          <span className="font-semibold text-amber-700">Queue #{reg.queuePosition}</span>
                        )}
                        {reg.confirmationDeadline && reg.status === 'CONFIRMATION_PENDING' && (
                          <span className="text-[11px] text-amber-800">
                            Until {new Date(reg.confirmationDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {!reg.queuePosition && !reg.confirmationDeadline && <span>—</span>}
                      </td>
                      <td className="py-3 px-4 text-ms-gray-60">
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="p-1.5 bg-ms-gray-20 text-ms-gray-80 rounded hover:bg-ms-blue hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(reg)}
                          className="p-1.5 bg-ms-gray-20 text-ms-gray-80 rounded hover:bg-ms-blue hover:text-white transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleResendEmail(reg.id)}
                          className="p-1.5 bg-ms-blue-subtle text-ms-blue rounded hover:bg-ms-blue hover:text-white transition-colors"
                          title="Resend Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        {reg.status !== 'CANCELLED' && reg.status !== 'EXPIRED' && (
                          <button
                            onClick={() => handleCancelRegistration(reg.id)}
                            className="p-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded hover:bg-amber-600 hover:text-white transition-colors"
                            title="Cancel Registration (Release Seat)"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRegistration(reg.id)}
                          className="p-1.5 bg-ms-red-subtle text-ms-red-dark border border-ms-red/30 rounded hover:bg-ms-red hover:text-white transition-colors"
                          title="Delete Whole Entry Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Modal */}
        {selectedReg && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent-depth-64 max-w-lg w-full p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-ms-gray-30 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-ms-gray-90">{selectedReg.fullName}</h3>
                  <span className="text-xs text-ms-gray-60">{selectedReg.email}</span>
                </div>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="p-1 text-ms-gray-60 hover:text-ms-gray-90 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-ms-gray-60 block">Unique ID</span>
                    <span className="font-mono font-bold text-ms-blue text-sm">{selectedReg.uniqueId || 'Not Assigned'}</span>
                  </div>
                  <div>
                    <span className="text-ms-gray-60 block">Status</span>
                    <Badge status={selectedReg.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <span className="text-ms-gray-60 block">Enrollment #</span>
                    <span className="font-mono text-ms-gray-90">{selectedReg.enrollmentNumber}</span>
                  </div>
                  <div>
                    <span className="text-ms-gray-60 block">GR Number</span>
                    <span className="font-mono text-ms-gray-90">{selectedReg.grNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <span className="text-ms-gray-60 block">Department</span>
                    <span className="text-ms-gray-90">{selectedReg.department || 'CE'}</span>
                  </div>
                  <div>
                    <span className="text-ms-gray-60 block">Additional Info</span>
                    <span className="text-ms-gray-90">{selectedReg.additionalInfo || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-ms-gray-30">
                <button
                  onClick={() => handleResendEmail(selectedReg.id)}
                  className="px-4 py-2 bg-ms-blue text-white text-xs font-semibold rounded hover:bg-ms-blue-dark transition-colors"
                >
                  Resend RSVP Email
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {(isCreating || editingReg) && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent-depth-64 max-w-lg w-full p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-ms-gray-30 pb-3">
                <h3 className="text-base font-bold text-ms-gray-90">
                  {isCreating ? 'Create Registration' : 'Edit Registration'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingReg(null);
                  }}
                  className="p-1 text-ms-gray-60 hover:text-ms-gray-90 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={isCreating ? handleCreateSubmit : handleEditSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-ms-gray-80 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-ms-gray-40 rounded focus:ring-2 focus:ring-ms-blue"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ms-gray-80 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-ms-gray-40 rounded focus:ring-2 focus:ring-ms-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-ms-gray-80 mb-1">Enrollment # (11 digits) *</label>
                    <input
                      type="text"
                      required
                      value={formData.enrollmentNumber}
                      onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-ms-gray-40 rounded focus:ring-2 focus:ring-ms-blue font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-ms-gray-80 mb-1">GR Number (6 digits) *</label>
                    <input
                      type="text"
                      required
                      value={formData.grNumber}
                      onChange={(e) => setFormData({ ...formData, grNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-ms-gray-40 rounded focus:ring-2 focus:ring-ms-blue font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-ms-gray-80 mb-1">Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-ms-gray-40 rounded focus:ring-2 focus:ring-ms-blue"
                    >
                      <option value="CE">CE</option>
                      <option value="AI">AI</option>
                      <option value="ICT">ICT</option>
                      <option value="IT">IT</option>
                      <option value="MCA">MCA</option>
                      <option value="BCA">BCA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-ms-gray-80 mb-1">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as RegistrationStatus })}
                      className="w-full px-3 py-2 border border-ms-gray-40 rounded focus:ring-2 focus:ring-ms-blue"
                    >
                      <option value="CONFIRMATION_PENDING">CONFIRMATION_PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="QUEUED">QUEUED</option>
                      <option value="PRESENT">PRESENT</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-ms-gray-80 mb-1">Additional Info</label>
                  <textarea
                    rows={2}
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    className="w-full px-3 py-2 border border-ms-gray-40 rounded focus:ring-2 focus:ring-ms-blue"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-ms-gray-30">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingReg(null);
                    }}
                    className="px-4 py-2 bg-ms-gray-20 text-ms-gray-80 font-semibold rounded hover:bg-ms-gray-30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-ms-blue text-white font-semibold rounded hover:bg-ms-blue-dark"
                  >
                    {isCreating ? 'Create Registration' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
