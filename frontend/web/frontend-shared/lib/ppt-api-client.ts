import axios, { AxiosError } from 'axios';
import { getAccessToken } from '@/lib/api';

// PPT backend API URL (FastAPI)
// Production URL first, then environment variable, then localhost fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_PPT_API_URL || 'https://api-synthatext.itsyash.space';
// Uncomment for local development:
// const API_BASE_URL = process.env.NEXT_PUBLIC_PPT_API_URL || 'http://localhost:8000';

const API_V1_PREFIX = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[PPT API] Request:', config.method?.toUpperCase(), config.url, 'Auth:', !!token);
    return config;
  },
  (error) => {
    console.error('[PPT API] Request error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('[PPT API] Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error('[PPT API] Response error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export interface CreateJobPayload {
  title: string;
  subtitle?: string;
  author?: string;
  slideCount: number;
  outputFormat: 'pptx' | 'pdf';
  llmProvider: 'gemini' | 'claude';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  pageBackgroundColor: string;
  contentFont: string;
  titleSlideFont: string;
  titleFontSize: number;
  bodyFontSize: number;
  titleSlideColor: string;
  additionalPrompt?: string;
  file: File;
}

export interface JobResponse {
  id: string;
  title: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedSlides?: number;
  totalSlides?: number;
  error?: string;
  outputFormat?: 'pptx' | 'pdf';
  outputS3Key?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface FileUploadResponse {
  s3_key: string;
  file_name: string;
  file_size: number;
}

export interface JobCreateResponse {
  job_id: string;
  status: JobResponse['status'];
  created_at: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobResponse['status'];
  total_slides: number;
  completed_slides: number;
  progress_percentage: number;
  output_s3_key?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface JobListResponse {
  jobs: JobStatusResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface PresignedUrlResponse {
  presigned_url: string;
  expires_in: number;
}

export interface SlidesResponse {
  slides: Array<{ slide_number: number; filename: string; url: string; slide_type?: string; id?: string }>;
  status: string;
  total_expected?: number;
}

const JOB_TITLE_STORAGE_KEY = 'ppt_jobs:title_by_id:v1';

function readJobTitlesFromStorage(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(JOB_TITLE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, string>;
    return {};
  } catch {
    return {};
  }
}

function writeJobTitlesToStorage(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(JOB_TITLE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function persistJobTitle(jobId: string, title: string) {
  if (!jobId || !title) return;
  const existing = readJobTitlesFromStorage();
  existing[jobId] = title;
  writeJobTitlesToStorage(existing);
}

function getPersistedJobTitle(jobId: string): string | undefined {
  const map = readJobTitlesFromStorage();
  const title = map[jobId];
  return typeof title === 'string' && title.trim() ? title : undefined;
}

function mapJobStatusToJobResponse(job: JobStatusResponse): JobResponse {
  const outputS3Key = job.output_s3_key ?? undefined;
  const outputFormat = outputS3Key?.endsWith('.pdf') ? 'pdf' : 'pptx';

  return {
    id: job.job_id,
    title: getPersistedJobTitle(job.job_id) ?? job.job_id,
    createdAt: job.created_at,
    status: job.status,
    completedSlides: job.completed_slides,
    totalSlides: job.total_slides,
    error: job.error_message ?? undefined,
    outputFormat,
    outputS3Key,
  };
}

export const pptApi = {
  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post<FileUploadResponse>(`${API_V1_PREFIX}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async createJob(payload: CreateJobPayload): Promise<JobResponse> {
    try {
      const upload = await pptApi.uploadFile(payload.file);
      const createBody = {
        input_s3_key: upload.s3_key,
        config: {
          title: payload.title,
          subtitle: payload.subtitle || undefined,
          author: payload.author || undefined,
          number_of_slides: payload.slideCount,
          pages_to_process: -1,
          output_format: payload.outputFormat,
          llm_provider: payload.llmProvider,
          primary_color: payload.primaryColor,
          secondary_color: payload.secondaryColor,
          accent_color: payload.accentColor,
          background_color: payload.backgroundColor,
          page_background_color: payload.pageBackgroundColor,
          content_font: payload.contentFont,
          title_slide_font: payload.titleSlideFont,
          title_font_size: payload.titleFontSize,
          body_font_size: payload.bodyFontSize,
          title_slide_color: payload.titleSlideColor,
          additional_prompt: payload.additionalPrompt || '',
        },
      };

      const response = await apiClient.post<JobCreateResponse>(`${API_V1_PREFIX}/jobs`, createBody);
      persistJobTitle(response.data.job_id, payload.title);

      return {
        id: response.data.job_id,
        title: payload.title,
        createdAt: response.data.created_at,
        status: response.data.status,
        completedSlides: 0,
        totalSlides: payload.slideCount + 2,
        outputFormat: payload.outputFormat,
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getJobs(): Promise<JobResponse[]> {
    try {
      const response = await apiClient.get<JobListResponse>(`${API_V1_PREFIX}/jobs`);
      return response.data.jobs.map(mapJobStatusToJobResponse);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getJob(id: string): Promise<JobResponse> {
    try {
      const response = await apiClient.get<JobStatusResponse>(`${API_V1_PREFIX}/jobs/${encodeURIComponent(id)}`);
      return mapJobStatusToJobResponse(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getDownloadUrl(id: string): Promise<PresignedUrlResponse> {
    try {
      const response = await apiClient.get<PresignedUrlResponse>(
        `${API_V1_PREFIX}/jobs/${encodeURIComponent(id)}/download`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async downloadJob(id: string): Promise<Blob | null> {
    const { presigned_url } = await pptApi.getDownloadUrl(id);

    try {
      const response = await fetch(presigned_url);
      if (!response.ok) throw new Error(`Download failed with ${response.status}`);
      return await response.blob();
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.open(presigned_url, '_blank', 'noopener,noreferrer');
      }
      return null;
    }
  },

  async cancelJob(id: string): Promise<void> {
    try {
      await apiClient.post(`${API_V1_PREFIX}/jobs/${encodeURIComponent(id)}/cancel`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async deleteJob(id: string): Promise<void> {
    try {
      await apiClient.delete(`${API_V1_PREFIX}/jobs/${encodeURIComponent(id)}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getSlides(id: string): Promise<SlidesResponse> {
    try {
      const response = await apiClient.get<SlidesResponse>(`${API_V1_PREFIX}/jobs/${encodeURIComponent(id)}/slides`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async regenerateSlides(id: string, slideNumbers: number[], instructions: string): Promise<void> {
    try {
      await apiClient.post(`${API_V1_PREFIX}/jobs/${encodeURIComponent(id)}/slides/regenerate`, {
        slide_numbers: slideNumbers,
        instructions,
      });
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as any)?.message ||
      (error.response?.data as any)?.detail ||
      error.message ||
      'An error occurred';
    const status = error.response?.status;
    return { message, status };
  }
  return { message: 'An unexpected error occurred' };
}

export default apiClient;

