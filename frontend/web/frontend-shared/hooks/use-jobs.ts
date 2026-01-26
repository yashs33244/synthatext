import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pptApi, type CreateJobPayload, type JobResponse } from '@/lib/ppt-api-client';

const jobKeys = {
  all: ['jobs'] as const,
  list: () => [...jobKeys.all, 'list'] as const,
};

export function createJobPayloadFromFormData(formData: FormData): CreateJobPayload {
  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new Error('Missing file');
  }

  return {
    title: String(formData.get('title') ?? ''),
    subtitle: String(formData.get('subtitle') ?? ''),
    author: String(formData.get('author') ?? ''),
    slideCount: Number.parseInt(String(formData.get('slideCount') ?? '15'), 10),
    outputFormat: (String(formData.get('outputFormat') ?? 'pptx') as CreateJobPayload['outputFormat']) ?? 'pptx',
    llmProvider: (String(formData.get('llmProvider') ?? 'gemini') as CreateJobPayload['llmProvider']) ?? 'gemini',
    primaryColor: String(formData.get('primaryColor') ?? '#4F46E5'),
    secondaryColor: String(formData.get('secondaryColor') ?? '#7C3AED'),
    accentColor: String(formData.get('accentColor') ?? '#06B6D4'),
    backgroundColor: String(formData.get('backgroundColor') ?? '#FFFFFF'),
    pageBackgroundColor: String(formData.get('pageBackgroundColor') ?? '#FFFFFF'),
    contentFont: String(formData.get('contentFont') ?? 'Inter'),
    titleSlideFont: String(formData.get('titleSlideFont') ?? 'Inter'),
    titleFontSize: Number.parseInt(String(formData.get('titleFontSize') ?? '28'), 10),
    bodyFontSize: Number.parseInt(String(formData.get('bodyFontSize') ?? '11'), 10),
    titleSlideColor: String(formData.get('titleSlideColor') ?? '#004080'),
    additionalPrompt: String(formData.get('additionalPrompt') ?? ''),
    file,
  };
}

export function useJobsQuery() {
  return useQuery({
    queryKey: jobKeys.list(),
    queryFn: () => pptApi.getJobs(),
    refetchInterval: 5000,
  });
}

export function useCreateJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateJobPayload) => pptApi.createJob(payload),
    onSuccess: (newJob) => {
      queryClient.setQueryData<JobResponse[]>(jobKeys.list(), (prev) => {
        if (!prev) return [newJob];
        return [newJob, ...prev];
      });
    },
  });
}

export function useDownloadJobMutation() {
  return useMutation({
    mutationFn: (jobId: string) => pptApi.downloadJob(jobId),
  });
}

export function useCancelJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => pptApi.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.list() });
    },
  });
}

export function useDeleteJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => pptApi.deleteJob(jobId),
    onSuccess: (_data, jobId) => {
      queryClient.setQueryData<JobResponse[]>(jobKeys.list(), (prev) => {
        if (!prev) return [];
        return prev.filter((job) => job.id !== jobId);
      });
    },
  });
}

