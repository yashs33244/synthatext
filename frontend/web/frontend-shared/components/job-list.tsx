'use client';

import { useState } from 'react';
import { Download, RefreshCw, X, Trash2, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, type JobStatus } from '@/components/status-badge';
import type { JobResponse } from '@/lib/ppt-api-client';

export type Job = Omit<JobResponse, 'status'> & { status: JobStatus };

interface JobListProps {
  jobs: Job[];
  onRefresh?: () => Promise<unknown>;
  onDownload?: (jobId: string) => void;
  onView?: (jobId: string) => void;
  onEdit?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
}

export function JobList({ jobs, onRefresh, onDownload, onView, onEdit, onCancel, onDelete }: JobListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (jobs.length === 0) {
    return (
      <div className="w-full max-w-2xl">
        <div className="bg-[#e8e8e8] border border-gray-200 rounded-2xl shadow-xl p-8 text-center space-y-4">
          <div className="text-4xl opacity-30">📋</div>
          <div>
            <h3 className="text-lg font-semibold text-black">No presentations yet</h3>
            <p className="text-sm text-gray-700 mt-1">Create your first presentation to see it here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Your Presentations</h2>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[1800px] overflow-y-auto">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => onEdit && onEdit(job.id)}
            className="bg-[#e8e8e8] border border-gray-200 rounded-lg shadow-sm p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-black line-clamp-2">{job.title}</h3>
                <p className="text-xs text-gray-600 mt-1">{formatDate(job.createdAt)}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            {job.status === 'processing' && job.completedSlides !== undefined && job.totalSlides !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>
                    {job.completedSlides} / {job.totalSlides} slides
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                    style={{
                      width: `${(job.completedSlides / job.totalSlides) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {job.status === 'completed' && onEdit && (
                <Button
                  onClick={() => onEdit(job.id)}
                  variant="outline"
                  className="flex-1 text-sm h-9"
                >
                  <Edit className="w-3.5 h-3.5 mr-2" />
                  Edit
                </Button>
              )}

              {job.status === 'completed' && onView && (
                <Button
                  onClick={() => onView(job.id)}
                  variant="outline"
                  className="flex-1 text-sm h-9"
                >
                  <Eye className="w-3.5 h-3.5 mr-2" />
                  View
                </Button>
              )}

              {job.status === 'completed' && onDownload && (
                <Button
                  onClick={() => onDownload(job.id)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-9"
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  Download
                </Button>
              )}

              {(job.status === 'pending' || job.status === 'processing') && onCancel && (
                <Button
                  onClick={() => onCancel(job.id)}
                  variant="outline"
                  className="flex-1 text-sm h-9"
                >
                  <X className="w-3.5 h-3.5 mr-2" />
                  Cancel
                </Button>
              )}

              {onDelete && (
                <Button
                  onClick={() => onDelete(job.id)}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {job.status === 'failed' && job.error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded p-2 text-xs text-destructive">
                {job.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

