'use client';

import React from "react"

import { useState, useRef } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateJobFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateJobForm({ onSubmit, isLoading = false }: CreateJobFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: '',
    slideCount: 15,
    outputFormat: 'pptx' as 'pptx' | 'pdf',
    llmProvider: 'gemini' as 'gemini' | 'claude',
    primaryColor: '#4F46E5',
    secondaryColor: '#7C3AED',
    accentColor: '#06B6D4',
    backgroundColor: '#FFFFFF',
    pageBackgroundColor: '#FFFFFF',
    contentFont: 'Inter',
    titleSlideFont: 'Inter',
    titleFontSize: 28,
    bodyFontSize: 11,
    titleSlideColor: '#004080',
    additionalPrompt: '',
  });

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (['application/pdf', 'text/plain', 'text/markdown'].includes(droppedFile.type)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    const submitData = new FormData();
    submitData.append('file', file);
    submitData.append('title', formData.title);
    submitData.append('subtitle', formData.subtitle);
    submitData.append('author', formData.author);
    submitData.append('slideCount', formData.slideCount.toString());
    submitData.append('outputFormat', formData.outputFormat);
    submitData.append('llmProvider', formData.llmProvider);
    submitData.append('primaryColor', formData.primaryColor);
    submitData.append('secondaryColor', formData.secondaryColor);
    submitData.append('accentColor', formData.accentColor);
    submitData.append('backgroundColor', formData.backgroundColor);
    submitData.append('pageBackgroundColor', formData.pageBackgroundColor);
    submitData.append('contentFont', formData.contentFont);
    submitData.append('titleSlideFont', formData.titleSlideFont);
    submitData.append('titleFontSize', formData.titleFontSize.toString());
    submitData.append('bodyFontSize', formData.bodyFontSize.toString());
    submitData.append('titleSlideColor', formData.titleSlideColor);
    submitData.append('additionalPrompt', formData.additionalPrompt);

    await onSubmit(submitData);
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#e8e8e8] border border-gray-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-black">Create Presentation</h2>
          <p className="text-sm text-gray-700 mt-1">Upload your document and configure your presentation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Document</label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : file
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-muted/30 hover:border-primary/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className={`w-6 h-6 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-center">
                  {file ? (
                    <>
                      <p className="font-medium text-black">{file.name}</p>
                      <p className="text-xs text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-black">Drag & drop your file</p>
                      <p className="text-xs text-gray-600">or click to browse</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">PDF, TXT, or MD formats supported</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Presentation Title *</label>
            <Input
              type="text"
              placeholder="e.g., Q4 2024 Product Launch"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="bg-[#1a1a1a] text-white border-gray-700 placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Subtitle</label>
            <Input
              type="text"
              placeholder="e.g., Strategic Overview"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="bg-[#1a1a1a] text-white border-gray-700 placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Author</label>
            <Input
              type="text"
              placeholder="Your name or company"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="bg-[#1a1a1a] text-white border-gray-700 placeholder:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Slide Count</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="15"
                value={formData.slideCount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  const num = parseInt(val) || 0;
                  if (num > 0 || val === '') {
                    setFormData({ ...formData, slideCount: num || 15 });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-700 rounded-md bg-[#1a1a1a] text-white placeholder:text-gray-500 text-sm h-10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Output Format</label>
              <select
                value={formData.outputFormat}
                onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value as 'pptx' | 'pdf' })}
                className="w-full px-3 py-2 border border-gray-700 rounded-md bg-[#1a1a1a] text-white text-sm"
              >
                <option value="pptx">PowerPoint</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">AI Model</label>
            <select
              value={formData.llmProvider}
              onChange={(e) => setFormData({ ...formData, llmProvider: e.target.value as 'gemini' | 'claude' })}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-[#1a1a1a] text-white text-sm"
            >
              <option value="gemini">Google Gemini</option>
              <option value="claude">Anthropic Claude</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-3">Theme Colors</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Primary</label>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Secondary</label>
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Accent</label>
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Title BG</label>
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Page BG</label>
                <input
                  type="color"
                  value={formData.pageBackgroundColor}
                  onChange={(e) => setFormData({ ...formData, pageBackgroundColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-3">Font Sizes</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Title (default: 28px)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="28"
                  value={formData.titleFontSize}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    const num = parseInt(val) || 0;
                    if (num > 0 || val === '') {
                      setFormData({ ...formData, titleFontSize: num || 28 });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md bg-[#1a1a1a] text-white placeholder:text-gray-500 text-sm h-10"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Body (default: 11px)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="11"
                  value={formData.bodyFontSize}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    const num = parseInt(val) || 0;
                    if (num > 0 || val === '') {
                      setFormData({ ...formData, bodyFontSize: num || 11 });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md bg-[#1a1a1a] text-white placeholder:text-gray-500 text-sm h-10"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Content Font {formData.outputFormat === 'pdf' && <span className="text-xs text-gray-600">(PDF only)</span>}
            </label>
            <select
              value={formData.contentFont}
              onChange={(e) => setFormData({ ...formData, contentFont: e.target.value })}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-[#1a1a1a] text-white text-sm"
              style={{ fontFamily: formData.contentFont }}
            >
              <option value="Inter" style={{ fontFamily: 'Inter' }}>Inter</option>
              <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial</option>
              <option value="Helvetica" style={{ fontFamily: 'Helvetica' }}>Helvetica</option>
              <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</option>
              <option value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</option>
              <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New</option>
              <option value="Verdana" style={{ fontFamily: 'Verdana' }}>Verdana</option>
              <option value="Trebuchet MS" style={{ fontFamily: 'Trebuchet MS' }}>Trebuchet MS</option>
              <option value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</option>
              <option value="Open Sans" style={{ fontFamily: 'Open Sans' }}>Open Sans</option>
              <option value="Lato" style={{ fontFamily: 'Lato' }}>Lato</option>
              <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
            </select>
            <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: formData.contentFont }}>
              Preview: The quick brown fox jumps over the lazy dog
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-3">Title Slide</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Color</label>
                <input
                  type="color"
                  value={formData.titleSlideColor}
                  onChange={(e) => setFormData({ ...formData, titleSlideColor: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Font {formData.outputFormat === 'pdf' && <span className="text-xs">(PDF only)</span>}</label>
                <select
                  value={formData.titleSlideFont}
                  onChange={(e) => setFormData({ ...formData, titleSlideFont: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md bg-[#1a1a1a] text-white text-sm"
                  style={{ fontFamily: formData.titleSlideFont }}
                >
                  <option value="Inter" style={{ fontFamily: 'Inter' }}>Inter</option>
                  <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial</option>
                  <option value="Helvetica" style={{ fontFamily: 'Helvetica' }}>Helvetica</option>
                  <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</option>
                  <option value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</option>
                  <option value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</option>
                  <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Additional Instructions (Optional)</label>
            <textarea
              placeholder="Add any specific instructions or requirements for slide generation..."
              value={formData.additionalPrompt}
              onChange={(e) => setFormData({ ...formData, additionalPrompt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-[#1a1a1a] text-white placeholder:text-gray-500 text-sm min-h-[80px] resize-y"
            />
          </div>

          <Button
            type="submit"
            disabled={!file || !formData.title || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⚡</span>
                Generating magic…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Magic
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

