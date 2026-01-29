'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

interface MainLayoutProps {
  children: React.ReactNode;
  projectId?: string;
  projectName?: string;
}

export function MainLayout({ children, projectId, projectName }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Determine active nav item
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Header Bar - OpenProject style */}
      <header className="h-12 bg-[#1A67A3] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div 
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1A67A3]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">WBS Project</span>
          </div>

          {/* Breadcrumb */}
          {projectName && (
            <div className="flex items-center text-white/80 text-sm">
              <span className="mx-2">/</span>
              <span className="text-white">{projectName}</span>
            </div>
          )}
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <button className="text-white/80 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          {/* Help */}
          <button className="text-white/80 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4CAF50] rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-white text-sm hidden md:block">{user?.displayName}</span>
            <button
              onClick={handleLogout}
              className="text-white/80 hover:text-white text-sm ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - OpenProject style */}
        <aside className={`${sidebarCollapsed ? 'w-12' : 'w-56'} bg-[#F3F6F8] border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0`}>
          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-10 flex items-center justify-center hover:bg-gray-200 border-b border-gray-200"
          >
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Navigation */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {/* Project Section */}
            {projectId && (
              <>
                <div className={`px-3 py-2 ${sidebarCollapsed ? 'hidden' : ''}`}>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</span>
                </div>
                
                <NavItem 
                  icon={<OverviewIcon />}
                  label="Overview"
                  collapsed={sidebarCollapsed}
                  active={pathname === `/projects/${projectId}`}
                  onClick={() => router.push(`/projects/${projectId}`)}
                />
                
                <NavItem 
                  icon={<WorkPackagesIcon />}
                  label="Work packages"
                  collapsed={sidebarCollapsed}
                  active={pathname?.includes('/work-packages') || pathname === `/projects/${projectId}`}
                  onClick={() => router.push(`/projects/${projectId}`)}
                />
                
                <NavItem 
                  icon={<GanttIcon />}
                  label="Gantt charts"
                  collapsed={sidebarCollapsed}
                  active={pathname?.includes('/gantt')}
                  onClick={() => router.push(`/projects/${projectId}?view=gantt`)}
                />
                
                <NavItem 
                  icon={<BoardIcon />}
                  label="Boards"
                  collapsed={sidebarCollapsed}
                  active={pathname?.includes('/boards')}
                  onClick={() => {}}
                />

                <NavItem 
                  icon={<CalendarIcon />}
                  label="Calendars"
                  collapsed={sidebarCollapsed}
                  active={pathname?.includes('/calendar')}
                  onClick={() => {}}
                />

                <div className="my-2 border-t border-gray-200" />

                <NavItem 
                  icon={<MembersIcon />}
                  label="Members"
                  collapsed={sidebarCollapsed}
                  active={pathname?.includes('/members')}
                  onClick={() => {}}
                />

                <NavItem 
                  icon={<SettingsIcon />}
                  label="Settings"
                  collapsed={sidebarCollapsed}
                  active={pathname?.includes('/settings')}
                  onClick={() => {}}
                />
              </>
            )}

            {/* Global Navigation (when no project selected) */}
            {!projectId && (
              <>
                <NavItem 
                  icon={<HomeIcon />}
                  label="Home"
                  collapsed={sidebarCollapsed}
                  active={pathname === '/'}
                  onClick={() => router.push('/')}
                />
                
                <NavItem 
                  icon={<ProjectsIcon />}
                  label="Projects"
                  collapsed={sidebarCollapsed}
                  active={pathname === '/projects' || pathname?.startsWith('/projects')}
                  onClick={() => router.push('/projects')}
                />
              </>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className={`p-2 border-t border-gray-200 ${sidebarCollapsed ? 'hidden' : ''}`}>
            <div className="text-xs text-gray-400 text-center">
              WBS Project v1.0
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

// Navigation Item Component
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, collapsed, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
        ${active 
          ? 'bg-[#1A67A3] text-white' 
          : 'text-gray-700 hover:bg-gray-200'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? label : undefined}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

// Icons
function HomeIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function OverviewIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function WorkPackagesIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function GanttIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
