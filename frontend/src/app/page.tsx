'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { SeverityBadge } from '@/components/SeverityBadge';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function HomePage() {
  const { user } = useAuth();
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getErrors({ limit: '6' })
      .then((res) => setRecentErrors(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero search */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          NetSuite Error Library
        </h1>
        <p className="text-sm text-gray-400 mb-2">v2.0 - Deployed with Vercel</p>
        <p className="text-lg text-gray-500 mb-8">
          Find solutions fast. Paste the error, get the fix.
        </p>
        <SearchBar large />
        <p className="text-sm text-gray-400 mt-3">
          Tip: paste the full error message for best results
        </p>
      </div>

      {/* Quick actions */}
      {user && (
        <div className="flex justify-center gap-3 mb-12">
          <Link
            href="/errors/new"
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Register New Error
          </Link>
        </div>
      )}

      {/* Recent errors */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Errors
        </h2>
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : recentErrors.length > 0 ? (
          <div className="grid gap-3">
            {recentErrors.map((error) => (
              <Link key={error.id} href={`/errors/${error.id}`} className="card p-4 hover:border-primary-300 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                      {error.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {error.solution}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SeverityBadge severity={error.severity} />
                  </div>
                </div>
                {error.tags?.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {error.tags.slice(0, 4).map((tag: string) => (
                      <span key={tag} className="badge-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500">No errors registered yet.</p>
            {user && (
              <Link href="/errors/new" className="btn-primary mt-4 inline-block">
                Register the first error
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
