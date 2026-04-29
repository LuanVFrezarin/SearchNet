'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">NS</span>
              </div>
              <span className="font-semibold text-lg text-gray-900">
                Error Library
              </span>
            </Link>
            {user && (
              <div className="hidden sm:flex items-center gap-6">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Search
                </Link>
                <Link
                  href="/errors/new"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  New Error
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user.name}
                </span>
                <span className="badge bg-primary-100 text-primary-700 text-xs">
                  {user.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-secondary text-sm">
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
