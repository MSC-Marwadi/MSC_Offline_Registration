import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Ticket } from 'lucide-react';

interface NavbarProps {
  availableSeats?: number;
  totalCapacity?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ availableSeats, totalCapacity }) => {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-ms-gray-30 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            {/* Microsoft 4-tile icon */}
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 transform group-hover:scale-105 transition-transform">
              <div className="bg-[#F25022] w-2.5 h-2.5"></div>
              <div className="bg-[#7FBA00] w-2.5 h-2.5"></div>
              <div className="bg-[#0078D4] w-2.5 h-2.5"></div>
              <div className="bg-[#FFB900] w-2.5 h-2.5"></div>
            </div>
            <div>
              <span className="font-semibold text-lg text-ms-gray-90 tracking-tight">
                Microsoft Student Community
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 bg-ms-blue-subtle text-ms-blue rounded">
                Event Portal
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-4 sm:space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-ms-blue flex items-center space-x-1.5 ${
                location.pathname === '/' ? 'text-ms-blue font-semibold border-b-2 border-ms-blue py-5' : 'text-ms-gray-70'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Event Info</span>
            </Link>

            <Link
              to="/register"
              className={`text-sm font-medium transition-colors hover:text-ms-blue flex items-center space-x-1.5 ${
                location.pathname === '/register' ? 'text-ms-blue font-semibold border-b-2 border-ms-blue py-5' : 'text-ms-gray-70'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Register</span>
            </Link>

            {/* Live Seat Availability Badge */}
            {typeof availableSeats === 'number' && typeof totalCapacity === 'number' && (
              <div className="hidden md:flex items-center bg-ms-gray-10 border border-ms-gray-30 px-3 py-1.5 rounded-full text-xs">
                <span className={`w-2 h-2 rounded-full mr-2 ${availableSeats > 0 ? 'bg-ms-green animate-pulse' : 'bg-amber-500'}`}></span>
                <span className="text-ms-gray-70">Seats Remaining:</span>
                <span className="font-bold ml-1 text-ms-gray-90">
                  {availableSeats} / {totalCapacity}
                </span>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
