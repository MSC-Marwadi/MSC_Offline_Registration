import React from 'react';
import { RegistrationStatus } from '../types';

interface BadgeProps {
  status: RegistrationStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ms-green-subtle text-ms-green-dark border border-ms-green/20">
          <span className="w-1.5 h-1.5 rounded-full bg-ms-green-dark mr-1.5"></span>
          Confirmed
        </span>
      );
    case 'PRESENT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-ms-blue-dark border border-ms-blue/30">
          <span className="w-1.5 h-1.5 rounded-full bg-ms-blue mr-1.5 animate-pulse"></span>
          Present
        </span>
      );
    case 'CONFIRMATION_PENDING':
    case 'PROMOTED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ms-yellow-subtle text-amber-800 border border-ms-yellow/30">
          <span className="w-1.5 h-1.5 rounded-full bg-ms-yellow mr-1.5"></span>
          {status === 'PROMOTED' ? 'Promoted (Pending)' : 'Pending Confirmation'}
        </span>
      );
    case 'QUEUED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1.5"></span>
          In Queue
        </span>
      );
    case 'CANCELLED':
    case 'EXPIRED':
    case 'REJECTED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ms-red-subtle text-ms-red-dark border border-ms-red/20">
          <span className="w-1.5 h-1.5 rounded-full bg-ms-red-dark mr-1.5"></span>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};
