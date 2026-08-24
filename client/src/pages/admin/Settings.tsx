import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import api from '../../services/api';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    eventDate: '',
    venue: '',
    totalCapacity: 100,
    confirmationWindowHours: 24,
    queueConfirmationWindowHours: 1,
    registrationOpen: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        const s = res.data.settings;
        setSettings({
          name: s.name,
          description: s.description,
          eventDate: s.eventDate ? new Date(s.eventDate).toISOString().slice(0, 16) : '',
          venue: s.venue,
          totalCapacity: s.totalCapacity,
          confirmationWindowHours: s.confirmationWindowHours,
          queueConfirmationWindowHours: s.queueConfirmationWindowHours,
          registrationOpen: s.registrationOpen,
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load event settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const res = await api.put('/admin/settings', settings);
      if (res.data.success) {
        setMessage('Event settings updated successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Event & Queue Settings">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {message && (
          <div className="p-4 bg-ms-green-subtle text-ms-green-dark border border-ms-green/40 rounded-xl text-sm font-semibold flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-ms-red-subtle text-ms-red-dark border border-ms-red/40 rounded-xl text-sm flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 border-b border-ms-gray-30 pb-4">
            <div className="p-2.5 bg-ms-blue-subtle text-ms-blue rounded-lg">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ms-gray-90">System Configuration</h2>
              <p className="text-xs text-ms-gray-60">
                Configure event details, seat capacity limit, and queue promotion response windows.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-ms-gray-60 animate-pulse">
              Loading settings from database...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Event Name */}
              <div>
                <label className="block text-xs font-semibold text-ms-gray-80 uppercase mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none"
                />
              </div>

              {/* Event Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-ms-gray-80 uppercase">
                    Event Description & Highlights
                  </label>
                  <div className="flex space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, description: s.description + '\n• ' }))}
                      className="px-2 py-0.5 bg-ms-gray-20 text-ms-gray-80 rounded hover:bg-ms-blue hover:text-white transition-colors"
                    >
                      + Bullet Line
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, description: s.description + '\n\n📍 What you will learn:\n' }))}
                      className="px-2 py-0.5 bg-ms-gray-20 text-ms-gray-80 rounded hover:bg-ms-blue hover:text-white transition-colors"
                    >
                      + Section Heading
                    </button>
                  </div>
                </div>
                <textarea
                  rows={7}
                  placeholder={`Write your event summary and highlights here.\n\nPress Enter for new paragraphs.\nUse • or - for bullet points.`}
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none leading-relaxed font-sans"
                ></textarea>
                <p className="text-[11px] text-ms-gray-60 mt-1">
                  💡 <strong>Formatting Tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-ms-gray-20 rounded border border-ms-gray-40 text-[10px]">Enter</kbd> to add clean paragraph breaks and list lines. They will automatically format on the student landing page.
                </p>
              </div>

              {/* Date & Venue Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-ms-gray-80 uppercase mb-1">
                    Event Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={settings.eventDate}
                    onChange={(e) => setSettings({ ...settings, eventDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ms-gray-80 uppercase mb-1">
                    Venue Location
                  </label>
                  <input
                    type="text"
                    value={settings.venue}
                    onChange={(e) => setSettings({ ...settings, venue: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Capacity & Windows */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-ms-gray-30">
                <div>
                  <label className="block text-xs font-semibold text-ms-gray-80 uppercase mb-1">
                    Total Seat Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.totalCapacity}
                    onChange={(e) => setSettings({ ...settings, totalCapacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 font-mono focus:ring-2 focus:ring-ms-blue focus:outline-none"
                  />
                  <span className="text-[11px] text-ms-gray-60 mt-1 block">Default: 100 seats</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ms-gray-80 uppercase mb-1">
                    Initial Confirmation Window (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.confirmationWindowHours}
                    onChange={(e) => setSettings({ ...settings, confirmationWindowHours: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 font-mono focus:ring-2 focus:ring-ms-blue focus:outline-none"
                  />
                  <span className="text-[11px] text-ms-gray-60 mt-1 block">Default: 24 hours</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ms-gray-80 uppercase mb-1">
                    Queue Promotion Window (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.queueConfirmationWindowHours}
                    onChange={(e) => setSettings({ ...settings, queueConfirmationWindowHours: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 font-mono focus:ring-2 focus:ring-ms-blue focus:outline-none"
                  />
                  <span className="text-[11px] text-ms-gray-60 mt-1 block">Default: 1 hour</span>
                </div>
              </div>

              {/* Registration Open Switch */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="regOpen"
                  checked={settings.registrationOpen}
                  onChange={(e) => setSettings({ ...settings, registrationOpen: e.target.checked })}
                  className="w-4 h-4 text-ms-blue border-ms-gray-40 rounded focus:ring-ms-blue"
                />
                <label htmlFor="regOpen" className="text-xs font-semibold text-ms-gray-80">
                  Accepting Public Registrations (Registration Open)
                </label>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-ms-gray-30 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-ms-blue text-white text-xs font-semibold rounded hover:bg-ms-blue-dark transition-colors shadow-sm flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </AdminLayout>
  );
};
