'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('pm@example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDevLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Dev login
      const loginRes = await api.post('/auth/dev-login', {
        email,
        displayName: email.split('@')[0],
        entraOid: `mock-${email.replace('@', '-')}`,
      });

      const { token } = loginRes.data;
      setToken(token);

      // Get user info
      const meRes = await api.get('/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(meRes.data);

      router.push('/projects');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A67A3] to-[#0D4A7A] flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-[#1A67A3]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-xl">WBS Project</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#1A67A3] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">WBS Project Management</h1>
            <p className="text-gray-500 mt-2">Work breakdown structure & Gantt charts</p>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A67A3] focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={handleDevLogin}
              disabled={isLoading || !email}
              className="w-full py-3 px-4 bg-[#1A67A3] text-white font-medium rounded-lg hover:bg-[#155a8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A67A3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in (Development)'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Test accounts</span>
              </div>
            </div>

            {/* Test Accounts */}
            <div className="grid grid-cols-1 gap-2">
              {[
                { email: 'admin@example.com', role: 'Admin', color: 'bg-red-100 text-red-700' },
                { email: 'pm@example.com', role: 'Project Manager', color: 'bg-blue-100 text-blue-700' },
                { email: 'dev@example.com', role: 'Developer', color: 'bg-green-100 text-green-700' },
              ].map((account) => (
                <button
                  key={account.email}
                  onClick={() => setEmail(account.email)}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{account.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${account.color}`}>
                    {account.role}
                  </span>
                </button>
              ))}
            </div>

            {/* Production Login (disabled) */}
            <div className="pt-4 border-t border-gray-200">
              <button
                disabled
                className="w-full py-3 px-4 border border-gray-300 text-gray-400 font-medium rounded-lg flex items-center justify-center gap-3 cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 23 23" fill="currentColor">
                  <path d="M0 0h10.931v10.931H0V0zm12.069 0H23v10.931H12.069V0zM0 12.069h10.931V23H0V12.069zm12.069 0H23V23H12.069V12.069z"/>
                </svg>
                Sign in with Microsoft Entra ID
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                (Available in production environment)
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-white/60 text-sm">
          WBS Project Management v1.0.0-mvp
        </p>
      </footer>
    </div>
  );
}
