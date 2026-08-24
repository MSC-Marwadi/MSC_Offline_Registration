import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-ms-gray-10 border-t border-ms-gray-30 text-ms-gray-70 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                <div className="bg-[#F25022] w-2 h-2"></div>
                <div className="bg-[#7FBA00] w-2 h-2"></div>
                <div className="bg-[#0078D4] w-2 h-2"></div>
                <div className="bg-[#FFB900] w-2 h-2"></div>
              </div>
              <span className="font-semibold text-ms-gray-90">Microsoft Student Chapter</span>
            </div>
            <p className="text-xs leading-relaxed text-ms-gray-60">
              Empowering students through technology, innovation, leadership, and community learning.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ms-gray-90 uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-ms-blue transition-colors">
                  Event Details
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-ms-blue transition-colors">
                  Registration Page
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ms-gray-90 uppercase tracking-wider mb-3">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-ms-blue transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-ms-blue transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-ms-gray-60">Email: support@msc.edu</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-ms-gray-30 flex flex-col sm:flex-row justify-between items-center text-xs text-ms-gray-60">
          <p>&copy; {new Date().getFullYear()} Microsoft Student Chapter. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built with React, Express, Prisma & PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
};
