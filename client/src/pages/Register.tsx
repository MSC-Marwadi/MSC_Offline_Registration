import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import api from '../services/api';
import { User, Mail, Hash, Building2, HelpCircle, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    enrollmentNumber: '',
    grNumber: '',
    email: '',
    department: 'CE',
    additionalInfo: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Full Name
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }

    // 2. Enrollment Number (11 digits)
    const enrollmentClean = formData.enrollmentNumber.trim();
    if (!/^\d{11}$/.test(enrollmentClean)) {
      setErrorMessage('Enrollment Number must be exactly 11 digits (numbers only).');
      return;
    }

    // 3. GR Number (6 digits)
    const grClean = formData.grNumber.trim();
    if (!/^\d{6}$/.test(grClean)) {
      setErrorMessage('GR Number must be exactly 6 digits (numbers only).');
      return;
    }

    // 4. Email (@marwadiuniversity.ac.in)
    const emailClean = formData.email.trim();
    if (!/^[a-zA-Z0-9._%+-]+@marwadiuniversity\.ac\.in$/i.test(emailClean)) {
      setErrorMessage('Email address must end with @marwadiuniversity.ac.in');
      return;
    }

    // 5. Department
    const validDepts = ['CE', 'AI', 'ICT', 'IT', 'MCA', 'BCA'];
    if (!validDepts.includes(formData.department)) {
      setErrorMessage('Please select a valid Department.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await api.post('/public/register', {
        fullName: formData.fullName.trim(),
        enrollmentNumber: enrollmentClean,
        grNumber: grClean,
        email: emailClean,
        department: formData.department,
        additionalInfo: formData.additionalInfo.trim(),
      });

      if (response.data.success) {
        navigate('/registration-success', {
          state: {
            registration: response.data.registration,
            message: response.data.message,
          },
        });
      }
    } catch (err: any) {
      console.error('Registration submit error:', err);
      setErrorMessage(
        err.response?.data?.message || 'An error occurred during registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ms-gray-10">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">

          {/* Header Card */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-ms-blue-subtle rounded-2xl text-ms-blue mb-3 shadow-fluent-depth-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-ms-gray-90">Student Event Registration</h1>
            <p className="text-sm text-ms-gray-60 mt-1">
              Marwadi University Student Portal & Entry Pass Verification
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-xl border border-ms-gray-30 shadow-fluent-depth-16 p-6 sm:p-10">
            {errorMessage && (
              <div className="mb-6 p-4 bg-ms-red-subtle border border-ms-red/30 rounded-lg flex items-start text-ms-red-dark text-sm">
                <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">Validation Error</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-ms-gray-80 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-ms-red">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-ms-gray-60 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Enrollment Number & GR Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Enrollment Number */}
                <div>
                  <label className="block text-xs font-semibold text-ms-gray-80 uppercase tracking-wider mb-1.5">
                    Enrollment Number (11-digit) <span className="text-ms-red">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-ms-gray-60 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      name="enrollmentNumber"
                      required
                      maxLength={11}
                      placeholder="e.g. 21010101001"
                      value={formData.enrollmentNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-ms-gray-60 mt-1 block">
                    Must be exactly 11 digits.
                  </span>
                </div>

                {/* GR Number */}
                <div>
                  <label className="block text-xs font-semibold text-ms-gray-80 uppercase tracking-wider mb-1.5">
                    GR Number (6-digit) <span className="text-ms-red">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-ms-gray-60 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      name="grNumber"
                      required
                      maxLength={6}
                      placeholder="e.g. 104912"
                      value={formData.grNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-ms-gray-60 mt-1 block">
                    Must be exactly 6 digits.
                  </span>
                </div>

              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-ms-gray-80 uppercase tracking-wider mb-1.5">
                  Email Address (@marwadiuniversity.ac.in) <span className="text-ms-red">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ms-gray-60 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="student.name@marwadiuniversity.ac.in"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-ms-gray-60 mt-1 block">
                  Must end with @marwadiuniversity.ac.in for verification.
                </span>
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-ms-gray-80 uppercase tracking-wider mb-1.5">
                  Department <span className="text-ms-red">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-ms-gray-60 absolute left-3.5 top-3 z-10 pointer-events-none" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none appearance-none"
                  >
                    <option value="CE">CE (Computer Engineering)</option>
                    <option value="AI">AI (Artificial Intelligence)</option>
                    <option value="ICT">ICT (Information and Communication Technology)</option>
                    <option value="IT">IT (Information Technology)</option>
                    <option value="MCA">MCA (Master of Computer Application)</option>
                    <option value="BCA">BCA (Bachelor of Computer Application)</option>
                  </select>
                </div>
              </div>

              {/* Additional Q/A */}
              <div>
                <label className="block text-xs font-semibold text-ms-gray-80 uppercase tracking-wider mb-1.5">
                  Additional Q/A <span className="text-ms-gray-50 text-[11px] font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <HelpCircle className="w-4 h-4 text-ms-gray-60 absolute left-3.5 top-3" />
                  <textarea
                    name="additionalInfo"
                    rows={3}
                    placeholder="Any specific questions, topics, or expectations for the event..."
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-ms-gray-40 rounded text-sm text-ms-gray-90 focus:ring-2 focus:ring-ms-blue focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-ms-gray-30">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-ms-blue text-white text-base font-semibold rounded hover:bg-ms-blue-dark transition-all shadow-fluent-depth-8 hover:shadow-fluent-depth-16 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Processing Registration...</span>
                  ) : (
                    <>
                      <span>Submit Registration</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
