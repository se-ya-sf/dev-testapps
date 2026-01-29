'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { Project, ProjectStatus } from '@/types';
import { MainLayout } from '@/components/layout/main-layout';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchProjects();
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data.items);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (status: ProjectStatus) => {
    switch (status) {
      case 'Active':
        return { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
      case 'Planning':
        return { label: 'Planning', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
      case 'OnHold':
        return { label: 'On hold', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' };
      case 'Done':
        return { label: 'Completed', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
      case 'Archived':
        return { label: 'Archived', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' };
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A67A3]"></div>
            <p className="text-gray-500">Loading projects...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-[#F8FAFB]">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {projects.length} project{projects.length !== 1 ? 's' : ''} available
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex border border-gray-300 rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'list' ? 'bg-[#1A67A3] text-white' : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'grid' ? 'bg-[#1A67A3] text-white' : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              {/* Create button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A67A3] text-white text-sm font-medium rounded hover:bg-[#155a8a] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New project
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first project.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A67A3] text-white text-sm font-medium rounded hover:bg-[#155a8a]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create project
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F3F6F8]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Schedule
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.map((project) => {
                    const statusDisplay = getStatusDisplay(project.status);
                    return (
                      <tr
                        key={project.id}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1A67A3] rounded flex items-center justify-center text-white font-medium">
                              {project.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{project.name}</p>
                              {project.description && (
                                <p className="text-sm text-gray-500 truncate max-w-md">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn('w-2 h-2 rounded-full', statusDisplay.dot)} />
                            <span className="text-sm text-gray-700">{statusDisplay.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {project.startDate || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {project.endDate || '-'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                            project.autoSchedule ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {project.autoSchedule ? '🔄 Auto' : '📋 Manual'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const statusDisplay = getStatusDisplay(project.status);
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="bg-white border border-gray-200 rounded-lg p-5 cursor-pointer hover:shadow-md hover:border-[#1A67A3]/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-[#1A67A3] rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                        statusDisplay.color
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusDisplay.dot)} />
                        {statusDisplay.label}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                    
                    {project.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <span>
                        {project.startDate || '-'} → {project.endDate || '-'}
                      </span>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded',
                        project.autoSchedule ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                      )}>
                        {project.autoSchedule ? 'Auto' : 'Manual'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchProjects();
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}

function CreateProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await api.post(
        '/projects',
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1A67A3] focus:border-[#1A67A3]"
              placeholder="Project name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1A67A3] focus:border-[#1A67A3] resize-none"
              placeholder="Add a description..."
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 bg-[#1A67A3] text-white rounded hover:bg-[#155a8a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
