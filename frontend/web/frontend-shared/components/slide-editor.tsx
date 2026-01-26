'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { pptApi } from '@/lib/ppt-api-client';

interface SlideEditorProps {
  jobId: string;
  selectedSlides: number[];
  initialInstructions?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SlideEditor({ jobId, selectedSlides, initialInstructions = '', onClose, onSuccess }: SlideEditorProps) {
  const { toast } = useToast();
  const [instructions, setInstructions] = useState(initialInstructions);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!instructions.trim()) {
      toast({
        title: 'Instructions required',
        description: 'Please provide instructions for regenerating the slides.',
        variant: 'destructive',
      });
      return;
    }

    setIsRegenerating(true);

    try {
      await pptApi.regenerateSlides(jobId, selectedSlides, instructions.trim());

      toast({
        title: 'Slides regenerated',
        description: `Successfully regenerated ${selectedSlides.length} slide(s).`,
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to regenerate slides:', error);
      toast({
        title: 'Regeneration failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Edit Slides</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedSlides.length} slide(s) selected: {selectedSlides.sort((a, b) => a - b).join(', ')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isRegenerating}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Regeneration Instructions *
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe how you want to modify these slides. For example: 'Make the content more concise', 'Add more bullet points', 'Change the layout to two columns', etc."
              className="w-full h-40 px-4 py-3 border border-input rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isRegenerating}
            />
            <p className="text-xs text-muted-foreground mt-2">
              These instructions will be added to the original prompts. The slides will be regenerated with the same content but modified according to your instructions.
            </p>
          </div>

          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">💡 Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Be specific about layout changes (e.g., "use two columns")</li>
              <li>• Mention visual preferences (e.g., "add more white space")</li>
              <li>• Request content adjustments (e.g., "make text more concise")</li>
              <li>• All your original styling (colors, fonts) will be preserved</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 bg-muted/20 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRegenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating || !instructions.trim()}
            className="gap-2"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Regenerate Slides
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

