'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ImageDropzone } from '@/components/ImageDropzone';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface UploadedImage {
  id: string;
  imageUrl: string;
  extractedText: string;
}

export default function NewErrorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [netsuitePath, setNetsuitePath] = useState('');
  const [howToTest, setHowToTest] = useState('');
  const [postValidation, setPostValidation] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [difficultyLevel, setDifficultyLevel] = useState('BASIC');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleImageUpload = (image: UploadedImage) => {
    setImages((prev) => [...prev, image]);

    // If OCR extracted text, auto-populate description and trigger AI suggestions
    if (image.extractedText) {
      if (!description) {
        setDescription(image.extractedText);
      }
      // Auto-trigger AI suggestions
      if (!aiSuggested) {
        requestAiSuggestions(image.extractedText);
      }
    }
  };

  const requestAiSuggestions = async (text: string) => {
    setAiLoading(true);
    try {
      const res = await api.aiSuggest(text);
      if (res.suggestions) {
        if (!title) setTitle(res.suggestions.suggestedTitle || '');
        if (!rootCause) setRootCause(res.suggestions.suggestedCause || '');
        if (!solution) setSolution(res.suggestions.suggestedSolution || '');
        if (res.suggestions.suggestedTags?.length) {
          const newTags = res.suggestions.suggestedTags;
          setTags((prev) => Array.from(new Set([...prev, ...newTags])));
        }
        setAiSuggested(true);
        toast.success('AI suggestions applied!');
      }
    } catch {
      // AI not available, silently continue
    } finally {
      setAiLoading(false);
    }
  };

  const handleManualAiSuggest = () => {
    const text = description || title;
    if (text && text.length >= 5) {
      requestAiSuggestions(text);
    } else {
      toast.error('Add a description first (min 5 chars)');
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !solution.trim()) {
      toast.error('Title and Solution are required');
      return;
    }

    setSubmitting(true);
    try {
      const data: any = {
        title: title.trim(),
        solution: solution.trim(),
        severity,
        difficultyLevel,
        tags,
        imageIds: images.map((img) => img.id),
      };
      if (description.trim()) data.description = description.trim();
      if (rootCause.trim()) data.rootCause = rootCause.trim();
      if (netsuitePath.trim()) data.netsuitePath = netsuitePath.trim();
      if (howToTest.trim()) data.howToTest = howToTest.trim();
      if (postValidation.trim()) data.postValidation = postValidation.trim();

      const result = await api.createError(data);
      toast.success('Error registered!');
      router.push(`/errors/${result.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse"><div className="h-96 bg-gray-100 rounded-xl" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Register New Error</h1>
      <p className="text-gray-500 mb-6">
        Upload a screenshot or describe the error. AI will help fill in the details.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Image Upload */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">1. Upload Screenshot (fastest)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Drag the error screenshot. OCR extracts text automatically.
          </p>
          <ImageDropzone onUpload={handleImageUpload} images={images} />
        </div>

        {/* Step 2: Error details */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">2. Error Details</h2>
              <p className="text-sm text-gray-500">Title and solution are required</p>
            </div>
            <button
              type="button"
              onClick={handleManualAiSuggest}
              disabled={aiLoading}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              {aiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Suggest
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., SSS_MISSING_REQD_ARGUMENT in SuiteScript"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Error Content / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Paste the full error message here..."
              />
            </div>

            {/* Solution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solution <span className="text-red-500">*</span>
              </label>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Step-by-step solution..."
                required
              />
            </div>

            {/* Severity + Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="input-field"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="CONFIG">Config</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  className="input-field"
                >
                  <option value="BASIC">Basic</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="input-field flex-1"
                  placeholder="Type tag and press Enter"
                />
                <button type="button" onClick={addTag} className="btn-secondary">
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge-tag flex items-center gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="w-4 h-4 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs hover:bg-red-400"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Advanced fields (collapsible) */}
        <div className="card p-6">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full"
          >
            <div>
              <h2 className="font-semibold text-gray-900">3. Advanced Details (Optional)</h2>
              <p className="text-sm text-gray-500">Root cause, NetSuite path, testing steps</p>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="space-y-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Root Cause
                </label>
                <textarea
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Why does this error happen?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NetSuite Path
                </label>
                <input
                  type="text"
                  value={netsuitePath}
                  onChange={(e) => setNetsuitePath(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Setup > Users/Roles > Manage Roles"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How to Test
                </label>
                <textarea
                  value={howToTest}
                  onChange={(e) => setHowToTest(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Steps to verify the fix..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post Validation
                </label>
                <textarea
                  value={postValidation}
                  onChange={(e) => setPostValidation(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="How to confirm everything is working..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 py-3 text-base"
          >
            {submitting ? 'Saving...' : 'Register Error'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
