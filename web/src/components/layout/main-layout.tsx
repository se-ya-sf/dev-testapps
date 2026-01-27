'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1
              onClick={() => router.push('/projects')}
              className="text-xl font-bold text-primary-600 cursor-pointer hover:text-primary-700"
            >
              WBS Progress
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">{user.displayName}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
