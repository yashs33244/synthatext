'use client';

import { useState, useEffect } from 'react';
import { Check, X, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  slide_number: number;
  filename: string;
  url: string;
}

interface SlideViewerProps {
  slides: Slide[];
  selectedSlides: number[];
  onToggleSelection: (slideNumber: number) => void;
  isGenerating?: boolean;
}

export function SlideViewer({ slides, selectedSlides, onToggleSelection, isGenerating = false }: SlideViewerProps) {
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(new Set());
  const [fullscreenSlide, setFullscreenSlide] = useState<number | null>(null);

  const handleSlideLoad = (slideNumber: number) => {
    setLoadedSlides((prev) => new Set(prev).add(slideNumber));
  };

  const openFullscreen = (slideNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenSlide(slideNumber);
  };

  const closeFullscreen = () => {
    setFullscreenSlide(null);
  };

  const navigateSlide = (direction: 'prev' | 'next') => {
    if (fullscreenSlide === null) return;

    const currentIndex = slides.findIndex(s => s.slide_number === fullscreenSlide);
    if (direction === 'prev' && currentIndex > 0) {
      setFullscreenSlide(slides[currentIndex - 1].slide_number);
    } else if (direction === 'next' && currentIndex < slides.length - 1) {
      setFullscreenSlide(slides[currentIndex + 1].slide_number);
    }
  };

  const currentFullscreenSlide = slides.find(s => s.slide_number === fullscreenSlide);

  useEffect(() => {
    if (fullscreenSlide === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      } else if (e.key === 'ArrowLeft') {
        navigateSlide('prev');
      } else if (e.key === 'ArrowRight') {
        navigateSlide('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenSlide, slides]);

  if (slides.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative inline-block">
          <div className="text-6xl mb-6 animate-bounce">
            {isGenerating ? '🎨' : '📄'}
          </div>
          {isGenerating && (
            <div className="absolute -top-2 -right-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping" />
              <div className="w-4 h-4 bg-blue-600 rounded-full absolute top-0" />
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          {isGenerating ? 'AI is crafting your slides...' : 'No slides yet'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          {isGenerating
            ? 'Analyzing your content and generating beautiful slides. The first slide will appear in a moment!'
            : 'Slides will appear here once generation begins'}
        </p>
        {isGenerating && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-shimmer"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite linear',
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Processing your document...</span>
            </div>
          </div>
        )}
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {slides.length > 0 && (
        <div className="mb-6 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Generated Slides
            </h2>
            <p className="text-sm text-muted-foreground">
              {isGenerating
                ? `${slides.length} slide${slides.length > 1 ? 's' : ''} ready • More coming...`
                : `${slides.length} slide${slides.length > 1 ? 's' : ''} total`
              }
            </p>
          </div>
          {!isGenerating && (
            <div className="text-xs text-muted-foreground">
              Click slides to select for editing
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col space-y-6 pb-6">
      {slides.map((slide, index) => {
        const isSelected = selectedSlides.includes(slide.slide_number);
        const isLoaded = loadedSlides.has(slide.slide_number);

        return (
          <div
            key={slide.slide_number}
            className={`
              relative group rounded-xl overflow-hidden
              border-2 transition-all duration-300 w-full
              ${isSelected
                ? 'border-primary shadow-2xl scale-[1.01] ring-4 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:shadow-xl'
              }
              animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards
            `}
            style={{
              animationDelay: `${Math.min(index * 50, 300)}ms`,
              animationDuration: '400ms',
            }}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 z-20 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
              </div>
            )}

            <div className="absolute top-3 left-3 z-10 px-4 py-2 bg-gradient-to-r from-black/90 to-black/80 backdrop-blur-sm rounded-lg text-sm font-bold text-white shadow-xl">
              <span className="opacity-70 text-xs">Slide</span> <span className="text-lg">{slide.slide_number}</span>
            </div>

            {isGenerating && index >= slides.length - 3 && (
              <div className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full text-xs font-bold text-white shadow-lg animate-pulse">
                ✨ NEW
              </div>
            )}

            <div
              className="aspect-[16/9] bg-white shadow-inner cursor-pointer relative"
              onClick={(e) => {
                e.stopPropagation();
                openFullscreen(slide.slide_number, e);
              }}
            >
              {!isLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-3" />
                  <p className="text-xs text-muted-foreground">Loading slide {slide.slide_number}...</p>
                </div>
              )}

              <iframe
                src={slide.url}
                className="w-full h-full pointer-events-none"
                title={`Slide ${slide.slide_number}`}
                onLoad={() => {
                  console.log(`✅ Slide ${slide.slide_number} loaded from:`, slide.url);
                  handleSlideLoad(slide.slide_number);
                }}
                onError={(e) => {
                  console.error(`❌ Failed to load slide ${slide.slide_number}:`, slide.url, e);
                  handleSlideLoad(slide.slide_number);
                }}
                sandbox="allow-same-origin allow-scripts"
                style={{
                  opacity: isLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                }}
              />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-sm rounded-full p-4 shadow-2xl">
                <Maximize2 className="w-8 h-8 text-white" />
              </div>
            </div>

            <div
              className={`
                absolute inset-0 bg-black/0 group-hover:bg-primary/5
                transition-all duration-200 pointer-events-none
                ${isSelected ? 'bg-primary/5' : ''}
              `}
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center justify-between text-white text-xs">
                <span className="font-medium">{slide.filename}</span>
                <div className="flex items-center gap-3">
                  <span className="opacity-70">Click to view fullscreen</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelection(slide.slide_number);
                    }}
                    className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                  >
                    {isSelected ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>

      {fullscreenSlide !== null && currentFullscreenSlide && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
            <p className="text-white text-sm font-medium">
              Slide {currentFullscreenSlide.slide_number} of {slides.length}
            </p>
          </div>

          {slides.findIndex(s => s.slide_number === fullscreenSlide) > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateSlide('prev');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {slides.findIndex(s => s.slide_number === fullscreenSlide) < slides.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateSlide('next');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          <div
            className="w-[90vw] h-[90vh] max-w-7xl bg-white rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={currentFullscreenSlide.url}
              className="w-full h-full"
              title={`Slide ${currentFullscreenSlide.slide_number} - Fullscreen`}
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
            <p className="text-white text-xs text-center">
              Use <kbd className="px-2 py-1 bg-white/20 rounded">←</kbd> <kbd className="px-2 py-1 bg-white/20 rounded">→</kbd> or click buttons to navigate • <kbd className="px-2 py-1 bg-white/20 rounded">ESC</kbd> to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}

