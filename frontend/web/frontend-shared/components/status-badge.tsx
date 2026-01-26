'use client';

import React from "react"
import { Check, Clock, Loader2, AlertCircle } from 'lucide-react';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface StatusBadgeProps {
  status: JobStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<JobStatus, { label: string; bgColor: string; textColor: string; icon: React.ReactNode }> = {
    pending: {
      label: 'Pending',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      icon: <Clock className="w-4 h-4" />,
    },
    processing: {
      label: 'Processing',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
    },
    completed: {
      label: 'Completed',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      icon: <Check className="w-4 h-4" />,
    },
    failed: {
      label: 'Failed',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      icon: <AlertCircle className="w-4 h-4" />,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor} text-sm font-medium`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

