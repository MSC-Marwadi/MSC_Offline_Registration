import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Public Pages
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Success } from './pages/Success';
import { Confirm } from './pages/Confirm';
import { NotAccepted } from './pages/NotAccepted';
import { PrivacyTerms } from './pages/PrivacyTerms';

// Admin Pages
import { AdminLogin } from './pages/admin/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminRegistrations } from './pages/admin/Registrations';
import { AdminQueue } from './pages/admin/Queue';
import { AdminAttendance } from './pages/admin/Attendance';
import { AdminScanner } from './pages/admin/Scanner';
import { AdminSettings } from './pages/admin/Settings';
import { AdminAuditLogs } from './pages/admin/AuditLogs';

export function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registration-success" element={<Success />} />
        <Route path="/confirm/:token/:response" element={<Confirm />} />
        <Route path="/not-accepted" element={<NotAccepted />} />
        <Route path="/privacy" element={<PrivacyTerms />} />
        <Route path="/terms" element={<PrivacyTerms />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/registrations" element={<AdminRegistrations />} />
        <Route path="/admin/queue" element={<AdminQueue />} />
        <Route path="/admin/attendance" element={<AdminAttendance />} />
        <Route path="/admin/scanner" element={<AdminScanner />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
      </Routes>
    </Router>
  );
}

export default App;
