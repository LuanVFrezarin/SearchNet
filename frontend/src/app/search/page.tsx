'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { SeverityBadge, DifficultyBadge } from '@/components/SeverityBadge';
import { api } from '@/lib/api';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [severity, setSeverity] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    const params: Record<string, string> = {};
    if (severity) params.severity = severity;
    if (difficulty) params.difficulty = difficulty;

    api
      .search(q, params)
      .then((res) => {
        setResults(res.results);
        setSources(res.sources);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q, severity, difficulty]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <SearchBar initialQuery={q} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
          <option value="CONFIG">Config</option>
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">All Levels</option>
          <option value="BASIC">Basic</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
        {sources.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
            Sources:
            {sources.map((s) => (
              <span key={s} className="badge bg-gray-100 text-gray-500">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{q}&quot;
          </p>
          <div className="space-y-3">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/errors/${result.id}`}
                className="card p-5 block hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3
                    className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors"
                    dangerouslySetInnerHTML={{ __html: result.title }}
                  />
                  <SeverityBadge severity={result.severity} />
                </div>

                {result.solution && (
                  <p
                    className="text-sm text-gray-600 mt-2 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: result.solution.length > 200
                        ? result.solution.slice(0, 200) + '...'
                        : result.solution,
                    }}
                  />
                )}

                <div className="flex items-center gap-2 mt-3">
                  {result.tags?.slice(0, 5).map((tag: string) => (
                    <span key={tag} className="badge-tag">{tag}</span>
                  ))}
                  {result.source === 'semantic' && (
                    <span className="badge bg-purple-100 text-purple-700 ml-auto">
                      AI Match
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : q ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-1">No results found</h3>
          <p className="text-gray-500 mb-4">
            Try different keywords or register this error
          </p>
          <Link href="/errors/new" className="btn-primary inline-block">
            Register this error
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-6"><div className="h-12 bg-gray-100 rounded-xl animate-pulse" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
