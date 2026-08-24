import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AdminLayout } from '../../components/AdminLayout';
import api from '../../services/api';
import { QrCode, Search, CheckCircle2, AlertTriangle, XCircle, Camera, CameraOff, Sparkles } from 'lucide-react';

export const AdminScanner: React.FC = () => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    let timeoutId: any;

    if (cameraActive) {
      // Delay scanner init slightly to ensure DOM #reader element is mounted
      timeoutId = setTimeout(() => {
        try {
          const readerElement = document.getElementById('reader');
          if (!readerElement) return;

          if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
              'reader',
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
              },
              /* verbose= */ false
            );

            scanner.render(
              (decodedText) => {
                handleCodeScanned(decodedText);
              },
              (errMessage) => {
                // Ignore frame parse errors
              }
            );

            scannerRef.current = scanner;
            setCameraError(null);
          }
        } catch (err: any) {
          console.warn('HTML5 Scanner initialization warning:', err);
          setCameraError('Camera scanner could not start automatically. You can use manual Unique ID / QR code search below.');
        }
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch((e) => console.log('Scanner clear error:', e));
        } catch (e) {
          // ignore cleanup errors
        }
        scannerRef.current = null;
      }
    };
  }, [cameraActive]);

  const handleCodeScanned = async (code: string) => {
    if (loading) return;
    try {
      setLoading(true);
      setError(null);
      setScanResult(null);

      const res = await api.post('/admin/attendance/scan', { code: code.trim() });

      if (res.data.success) {
        setScanResult(res.data);
      }
    } catch (err: any) {
      console.error('Scan API error:', err);
      setError(err.response?.data?.message || 'Invalid or unconfirmed QR code token.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeScanned(manualCode.trim());
  };

  const toggleCamera = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear().catch(() => {});
      } catch (e) {}
      scannerRef.current = null;
    }
    setCameraActive(!cameraActive);
  };

  return (
    <AdminLayout title="Camera QR Ticket Scanner">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-ms-blue-subtle text-ms-blue rounded-xl">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ms-gray-90">Live Entrance Check-In Scanner</h2>
              <p className="text-xs text-ms-gray-60">
                Scan student QR ticket passes or enter Unique Ticket ID (e.g. MSC26-0001).
              </p>
            </div>
          </div>

          <button
            onClick={toggleCamera}
            className="px-4 py-2 bg-ms-gray-10 border border-ms-gray-40 text-ms-gray-80 text-xs font-semibold rounded hover:bg-ms-gray-20 transition-colors flex items-center space-x-2"
          >
            {cameraActive ? (
              <>
                <CameraOff className="w-4 h-4 text-ms-red-dark" />
                <span>Turn Off Camera</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-ms-blue" />
                <span>Turn On Camera</span>
              </>
            )}
          </button>
        </div>

        {/* Video Camera Scanner Area */}
        {cameraActive && (
          <div className="bg-white rounded-xl border border-ms-gray-30 p-6 shadow-fluent text-center space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-bold text-ms-gray-80 uppercase tracking-wider">Live Camera Viewfinder</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5 animate-pulse"></span> Active Scanner
              </span>
            </div>

            {cameraError && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs text-left">
                {cameraError}
              </div>
            )}

            <div className="max-w-md mx-auto overflow-hidden rounded-xl border-2 border-dashed border-ms-blue/40 bg-ms-gray-10 p-3">
              <div id="reader" className="w-full"></div>
            </div>
          </div>
        )}

        {/* Manual Lookup Tool */}
        <div className="bg-white p-6 rounded-xl border border-ms-gray-30 shadow-fluent space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ms-gray-90 flex items-center">
              <Search className="w-4 h-4 text-ms-blue mr-2" />
              Manual Unique ID & QR Search Fallback
            </h3>
            <span className="text-[11px] text-ms-gray-60">Search by MSC26-XXXX or QR String</span>
          </div>

          <form onSubmit={handleManualSearch} className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. MSC26-0001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-ms-gray-10 border border-ms-gray-40 rounded text-sm text-ms-gray-90 font-mono focus:ring-2 focus:ring-ms-blue focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="px-6 py-2.5 bg-ms-blue text-white text-xs font-semibold rounded hover:bg-ms-blue-dark transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Validating...' : 'Validate Entry'}
            </button>
          </form>
        </div>

        {/* Scan Result Feedback Card */}
        {error && (
          <div className="p-6 bg-ms-red-subtle border border-ms-red/30 rounded-xl text-ms-red-dark space-y-2 text-center shadow-fluent">
            <XCircle className="w-10 h-10 mx-auto text-ms-red-dark" />
            <h3 className="font-bold text-base">Invalid Ticket / Check-In Failed</h3>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {scanResult && (
          <div
            className={`p-6 rounded-xl border shadow-fluent text-center space-y-4 ${
              scanResult.alreadyScanned
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-ms-green-subtle border-ms-green/40 text-ms-green-dark'
            }`}
          >
            {scanResult.alreadyScanned ? (
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-ms-green-subtle rounded-full flex items-center justify-center mx-auto text-ms-green-dark border border-ms-green/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            )}

            <div>
              <span className="text-xs font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-white/80 shadow-sm">
                {scanResult.message}
              </span>
              <h2 className="text-2xl font-bold mt-3 text-ms-gray-90">{scanResult.student.fullName}</h2>
              <p className="text-xs text-ms-gray-70">{scanResult.student.email} | Enrollment: {scanResult.student.enrollmentNumber}</p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-ms-gray-30 max-w-sm mx-auto text-left text-xs space-y-2 shadow-sm">
              <div className="flex justify-between">
                <span className="text-ms-gray-60 font-semibold">Unique ID:</span>
                <span className="font-mono font-bold text-ms-blue">{scanResult.student.uniqueId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ms-gray-60 font-semibold">Check-In Time:</span>
                <span className="font-mono">
                  {new Date(scanResult.student.scannedAt || scanResult.student.firstScannedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ms-gray-60 font-semibold">Scanned By:</span>
                <span>{scanResult.student.scannedBy}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
