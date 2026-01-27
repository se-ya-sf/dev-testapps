'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [email, setEmail] = useState('pm@example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Development login
      const response = await api.post('/auth/dev-login', { email });
      const { token } = response.data;

      // Store token
      setToken(token);
      localStorage.setItem('token', token);

      // Fetch user info
      const meResponse = await api.get('/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(meResponse.data);

      router.push('/projects');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            WBS Progress Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Internal Project Management System
          </p>
        </div>

        {/* Development Login Form */}
        <form onSubmit={handleDevLogin} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in (Development)'}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Development Mode - Use one of these test accounts:</p>
            <ul className="mt-2 space-y-1">
              <li>admin@example.com (Admin)</li>
              <li>pm@example.com (Project Manager)</li>
              <li>dev@example.com (Developer)</li>
            </ul>
          </div>
        </form>

        {/* Entra ID Login (Production) */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              disabled
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="currentColor">
                <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" />
              </svg>
              Sign in with Microsoft Entra ID
            </button>
            <p className="mt-2 text-xs text-gray-400 text-center">
              (Available in production environment)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
