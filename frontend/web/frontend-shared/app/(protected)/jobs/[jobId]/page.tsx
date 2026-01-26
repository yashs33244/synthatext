'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlideViewer } from '@/components/slide-viewer';
import { SlideEditor } from '@/components/slide-editor';
import { useToast } from '@/hooks/use-toast';
import { pptApi } from '@/lib/ppt-api-client';

interface Slide {
  slide_number: number;
  filename: string;
  url: string;
}

interface JobDetailsProps {
  params: Promise<{ jobId: string }>;
}

const JOB_TITLE_STORAGE_KEY = 'ppt_jobs:title_by_id:v1';

export default function JobDetailsPage({ params }: JobDetailsProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSlides, setSelectedSlides] = useState<number[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobStatus, setJobStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [previousSlideCount, setPreviousSlideCount] = useState(0);
  const [editInstructions, setEditInstructions] = useState('');

  useEffect(() => {
    fetchSlides();
    fetchJobStatus();

    const titles = localStorage.getItem(JOB_TITLE_STORAGE_KEY);
    if (titles) {
      const titleMap = JSON.parse(titles);
      setJobTitle(titleMap[resolvedParams.jobId] || resolvedParams.jobId);
    }

    const pollInterval = setInterval(() => {
      if (jobStatus === 'processing' || jobStatus === 'pending') {
        fetchSlides();
        fetchJobStatus();
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [resolvedParams.jobId, jobStatus]);

  const fetchJobStatus = async () => {
    try {
      const data = await pptApi.getJob(resolvedParams.jobId);
      const newStatus = data.status;

      if (jobStatus !== 'completed' && newStatus === 'completed') {
        toast({
          title: '✨ Presentation Complete!',
          description: 'All slides have been generated successfully. You can now download or edit individual slides.',
        });
      }

      setJobStatus(newStatus);
    } catch (error) {
      console.error('Failed to fetch job status:', error);
    }
  };

  const fetchSlides = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      const data = await pptApi.getSlides(resolvedParams.jobId);
      const newSlides = data.slides || [];

      if (newSlides.length > previousSlideCount && previousSlideCount > 0) {
        const newCount = newSlides.length - previousSlideCount;
        toast({
          title: `${newCount} new slide${newCount > 1 ? 's' : ''} generated! 🎉`,
          description: `Total: ${newSlides.length} slide${newSlides.length > 1 ? 's' : ''}`,
        });
      }

      setSlides(newSlides);
      setPreviousSlideCount(newSlides.length);
    } catch (error) {
      console.error('Failed to fetch slides:', error);
    } finally {
      if (showRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  const toggleSlideSelection = (slideNumber: number) => {
    setSelectedSlides((prev) =>
      prev.includes(slideNumber)
        ? prev.filter((n) => n !== slideNumber)
        : [...prev, slideNumber]
    );
  };

  const handleDownload = async () => {
    try {
      const data = await pptApi.getDownloadUrl(resolvedParams.jobId);

      if (data.presigned_url) {
        window.open(data.presigned_url, '_blank');
        toast({
          title: 'Download started',
          description: 'Your presentation will download shortly.',
        });
      }
    } catch (error) {
      console.error('Failed to download:', error);
      toast({
        title: 'Download failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{jobTitle}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {slides.length} slide{slides.length !== 1 ? 's' : ''}
                  </p>
                  {jobStatus === 'completed' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Complete
                    </span>
                  )}
                  {(jobStatus === 'processing' || jobStatus === 'pending') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      Generating
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSlides(true)}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {(jobStatus === 'processing' || jobStatus === 'pending') && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                <div className="absolute inset-0 w-8 h-8 border-4 border-blue-200 rounded-full" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-semibold text-blue-900">
                    🎨 Creating your presentation...
                  </p>
                  {slides.length > 0 && (
                    <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                      {slides.length} slides ready
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-700">
                  {slides.length > 0
                    ? 'New slides appear automatically as they\'re generated. You can start reviewing now!'
                    : 'Analyzing content and generating slides... First slide will appear shortly.'}
                </p>

                {slides.length > 0 && (
                  <div className="mt-3 bg-blue-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-73px)]">
        <div className="w-96 border-r border-border bg-muted/20 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-lg font-semibold mb-4">Edit Instructions</h2>
            {selectedSlides.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Selected Slides: {selectedSlides.sort((a, b) => a - b).join(', ')}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedSlides([])}
                  className="text-xs text-blue-700 hover:text-blue-900"
                >
                  Clear Selection
                </Button>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {selectedSlides.length === 0 ? (
                <p>Select slides from the right to edit them with custom instructions.</p>
              ) : (
                <p>Type your instructions below to modify the selected slides.</p>
              )}
            </div>
          </div>

          <div className="border-t border-border p-4 bg-background">
            <textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              placeholder={selectedSlides.length > 0 ? "Enter instructions to regenerate selected slides..." : "Select slides first to enable editing"}
              disabled={selectedSlides.length === 0}
              className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              rows={4}
            />
            <Button
              className="w-full mt-2 gap-2"
              disabled={selectedSlides.length === 0 || !editInstructions.trim()}
              onClick={() => {
                if (editInstructions.trim()) {
                  setEditMode(true);
                }
              }}
            >
              <Sparkles className="w-4 h-4" />
              Regenerate Selected Slides
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          {(jobStatus === 'processing' || jobStatus === 'pending') && (
            <div className="sticky top-0 z-10 p-4 pb-0 bg-gray-50/95 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    <div className="absolute inset-0 w-8 h-8 border-4 border-blue-200 rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-base font-semibold text-blue-900">
                        🎨 Creating your presentation...
                      </p>
                      {slides.length > 0 && (
                        <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                          {slides.length} slides ready
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-blue-700">
                      {slides.length > 0
                        ? 'New slides appear automatically as they\'re generated. Scroll down to see them!'
                        : 'Analyzing content and generating slides...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 max-w-5xl mx-auto">
            <SlideViewer
              slides={slides}
              selectedSlides={selectedSlides}
              onToggleSelection={toggleSlideSelection}
              isGenerating={jobStatus === 'processing' || jobStatus === 'pending'}
            />
          </div>
        </div>
      </div>

      {editMode && (
        <SlideEditor
          jobId={resolvedParams.jobId}
          selectedSlides={selectedSlides}
          initialInstructions={editInstructions}
          onClose={() => {
            setEditMode(false);
            setSelectedSlides([]);
          }}
          onSuccess={() => {
            fetchSlides();
            setEditMode(false);
            setSelectedSlides([]);
            setEditInstructions('');
          }}
        />
      )}
    </div>
  );
}

