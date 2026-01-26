'use client';

import { CreateJobForm } from '@/components/create-job-form';
import { useToast } from '@/hooks/use-toast';
import { JobList } from '@/components/job-list';
import { useRouter } from 'next/navigation';
import {
  createJobPayloadFromFormData,
  useCreateJobMutation,
  useDownloadJobMutation,
  useCancelJobMutation,
  useDeleteJobMutation,
  useJobsQuery
} from '@/hooks/use-jobs';
import { pptApi } from '@/lib/ppt-api-client';

export default function DashboardPage() {
  const { toast } = useToast();
  const router = useRouter();

  const { data: jobs = [], isLoading, refetch } = useJobsQuery();
  const createJobMutation = useCreateJobMutation();
  const downloadJobMutation = useDownloadJobMutation();
  const cancelJobMutation = useCancelJobMutation();
  const deleteJobMutation = useDeleteJobMutation();

  const handleCreateJob = async (formData: FormData) => {
    try {
      const newJob = await createJobMutation.mutateAsync(createJobPayloadFromFormData(formData));

      toast({
        title: 'Presentation created',
        description: 'Redirecting to slide viewer...',
      });

      setTimeout(() => {
        router.push(`/jobs/${newJob.id}`);
      }, 500);
    } catch (error) {
      console.error('Failed to create job:', error);
      toast({
        title: 'Error creating presentation',
        description: 'Please check your input and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (jobId: string) => {
    try {
      const blob = await downloadJobMutation.mutateAsync(jobId);
      if (!blob) {
        toast({
          title: 'Download started',
          description: 'Opening download in a new tab.',
        });
        return;
      }
      const job = jobs.find((j) => j.id === jobId);
      const extension = job?.outputFormat === 'pdf' ? 'pdf' : 'pptx';
      const filename = `${job?.title.replace(/\s+/g, '-')}.${extension}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Downloaded',
        description: 'Your presentation is ready!',
      });
    } catch (error) {
      console.error('Failed to download job:', error);
      toast({
        title: 'Download failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await cancelJobMutation.mutateAsync(jobId);
      toast({
        title: 'Job cancelled',
        description: 'The presentation generation has been cancelled.',
      });
    } catch (error) {
      console.error('Failed to cancel job:', error);
      toast({
        title: 'Cancel failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) {
      return;
    }

    try {
      await deleteJobMutation.mutateAsync(jobId);
      toast({
        title: 'Job deleted',
        description: 'The presentation and all associated files have been deleted.',
      });
    } catch (error) {
      console.error('Failed to delete job:', error);
      toast({
        title: 'Delete failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleView = async (jobId: string) => {
    try {
      const job = jobs.find((j) => j.id === jobId);
      if (!job || !job.outputS3Key) {
        toast({
          title: 'View not available',
          description: 'Unable to view this presentation.',
          variant: 'destructive',
        });
        return;
      }

      const data = await pptApi.getDownloadUrl(jobId);
      if (data.presigned_url) {
        window.open(data.presigned_url, '_blank');
        toast({
          title: 'Opening presentation',
          description: 'Your presentation will open in a new tab.',
        });
      }
    } catch (error) {
      console.error('Failed to view job:', error);
      toast({
        title: 'View failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="min-h-screen w-full overflow-hidden bg-[#F7F9FA]">
      {/* Soft blue glow background effect */}
      <div className="fixed inset-0 -z-10 bg-[#F7F9FA]">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 30% 50%, #E0F4FA 0%, transparent 50%),
                        radial-gradient(circle at 70% 50%, #FFF1C2 0%, transparent 50%),
                        radial-gradient(circle at 50% 80%, #E0F4FA 0%, transparent 50%)`,
            filter: 'blur(120px)',
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] text-balance">
              AI-Powered Presentation Generator
            </h1>
            <p className="text-lg text-[#6F959F] max-w-2xl mx-auto leading-relaxed">
              Transform your documents into polished, professional presentations in minutes. Let AI handle the heavy
              lifting.
            </p>
          </div>

          <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">
            <div className="flex justify-center lg:justify-end">
              <CreateJobForm onSubmit={handleCreateJob} isLoading={createJobMutation.isPending} />
            </div>

            <div className="flex justify-center lg:justify-start">
              {isLoading ? (
                <div className="w-full max-w-2xl">
                  <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-lg p-8 text-center">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-[#F7DC6F] border-t-transparent rounded-full" />
                    <p className="text-[#6F959F] mt-4 text-sm font-medium">Loading your presentations…</p>
                  </div>
                </div>
              ) : (
                <JobList
                  jobs={jobs}
                  onRefresh={refetch}
                  onDownload={handleDownload}
                  onView={handleView}
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
