'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SeverityBadge, DifficultyBadge } from '@/components/SeverityBadge';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ErrorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    api
      .getError(params.id as string)
      .then(setError)
      .catch(() => toast.error('Error not found'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleFeedback = async (worked: boolean) => {
    if (!user) {
      toast.error('Login to give feedback');
      return;
    }
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback(error.id, worked);
      toast.success(worked ? 'Glad it helped!' : 'Thanks for the feedback');
      // Refresh
      const updated = await api.getError(error.id);
      setError(updated);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Login to comment');
      return;
    }
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      await api.addComment(error.id, comment);
      setComment('');
      const updated = await api.getError(error.id);
      setError(updated);
      toast.success('Comment added');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Error not found</h2>
        <button onClick={() => router.push('/')} className="btn-primary mt-4">
          Back to search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{error.title}</h1>
          <div className="flex gap-2 flex-shrink-0">
            <SeverityBadge severity={error.severity} />
            <DifficultyBadge level={error.difficultyLevel} />
          </div>
        </div>

        {error.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {error.tags.map((tag: string) => (
              <span key={tag} className="badge-tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>By {error.author?.name}</span>
          <span>{new Date(error.createdAt).toLocaleDateString()}</span>
          {error.stats && error.stats.totalFeedback > 0 && (
            <span className="flex items-center gap-1">
              <span className={error.stats.successRate >= 70 ? 'text-green-600' : 'text-yellow-600'}>
                {error.stats.successRate}% success rate
              </span>
              <span className="text-gray-400">({error.stats.totalFeedback} votes)</span>
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {error.description && (
        <div className="card p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Description
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{error.description}</p>
        </div>
      )}

      {/* Solution - highlighted */}
      <div className="card p-6 mb-4 border-l-4 border-l-green-500">
        <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">
          Solution
        </h2>
        <div className="text-gray-700 whitespace-pre-wrap">{error.solution}</div>
      </div>

      {/* Root Cause */}
      {error.rootCause && (
        <div className="card p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Root Cause
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">{error.rootCause}</p>
        </div>
      )}

      {/* NetSuite Path */}
      {error.netsuitePath && (
        <div className="card p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            NetSuite Path
          </h2>
          <code className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-800">
            {error.netsuitePath}
          </code>
        </div>
      )}

      {/* How to Test + Post Validation */}
      {(error.howToTest || error.postValidation) && (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {error.howToTest && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                How to Test
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{error.howToTest}</p>
            </div>
          )}
          {error.postValidation && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Post Validation
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{error.postValidation}</p>
            </div>
          )}
        </div>
      )}

      {/* Images */}
      {error.images?.length > 0 && (
        <div className="card p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Screenshots
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {error.images.map((img: any) => (
              <div key={img.id} className="border rounded-lg overflow-hidden">
                <img
                  src={`${API_URL}${img.imageUrl}`}
                  alt="Error screenshot"
                  className="w-full h-auto"
                  loading="lazy"
                />
                {img.extractedText && (
                  <div className="p-3 bg-gray-50 border-t">
                    <p className="text-xs text-gray-500 font-medium mb-1">OCR Text:</p>
                    <p className="text-xs text-gray-600 line-clamp-3">{img.extractedText}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="card p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Did this solution work?
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleFeedback(true)}
            disabled={submittingFeedback}
            className="btn-secondary flex items-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Yes, it worked!
          </button>
          <button
            onClick={() => handleFeedback(false)}
            disabled={submittingFeedback}
            className="btn-secondary flex items-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            No, didn&apos;t work
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Comments ({error.comments?.length || 0})
        </h2>

        {user && (
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment or additional info..."
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={submittingComment || !comment.trim()}
                className="btn-primary whitespace-nowrap"
              >
                Post
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {error.comments?.map((c: any) => (
            <div key={c.id} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary-700">
                  {c.user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.user?.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          {(!error.comments || error.comments.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">No comments yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
