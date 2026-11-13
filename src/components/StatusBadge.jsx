import React from 'react';
import { STATUS } from '../format';

const StatusBadge = ({ status, className = '' }) => {
  const s = STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls} ${className}`}>
      {s.label}
    </span>
  );
};

export default StatusBadge;
