'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { Project, Task, Dependency } from '@/types';
import { MainLayout } from '@/components/layout/main-layout';
import { WbsTable } from '@/components/wbs/wbs-table';
import { GanttChart } from '@/components/gantt/gantt-chart';
import { TaskDetailPanel } from '@/components/task/task-detail-panel';

type ViewMode = 'table' | 'gantt' | 'split';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const { isAuthenticated, token } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Check URL for view mode
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'gantt') setViewMode('gantt');
    else if (view === 'table') setViewMode('table');
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchProjectData();
  }, [isAuthenticated, projectId]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes, depsRes] = await Promise.all([
        api.get(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/projects/${projectId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/projects/${projectId}/dependencies`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data.items);
      setDependencies(depsRes.data.items || []);
    } catch (err) {
      console.error('Failed to fetch project data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await api.patch(`/tasks/${taskId}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, ...response.data.updatedTask } : t
        )
      );

      // Update affected tasks if any
      if (response.data.affectedTasks?.length > 0) {
        setTasks((prev) =>
          prev.map((t) => {
            const affected = response.data.affectedTasks.find(
              (at: Task) => at.id === t.id
            );
            return affected ? { ...t, ...affected } : t;
          })
        );
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    }
  };

  const handleTaskCreate = async (data: Partial<Task>) => {
    try {
      const response = await api.post(
        `/projects/${projectId}/tasks`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
        setShowDetailPanel(false);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  const handleSelectTask = (taskId: string | null) => {
    setSelectedTaskId(taskId);
    if (taskId) {
      setShowDetailPanel(true);
    }
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  if (isLoading) {
    return (
      <MainLayout projectId={projectId}>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A67A3]"></div>
            <p className="text-gray-500">Loading project...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout projectId={projectId}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The project you're looking for doesn't exist or you don't have access.
            </p>
            <button
              onClick={() => router.push('/projects')}
              className="mt-4 text-[#1A67A3] hover:underline"
            >
              ← Back to projects
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout projectId={projectId} projectName={project.name}>
      <div className="h-full flex flex-col">
        {/* Sub-header with view mode tabs */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4">
            {/* View Mode Tabs - OpenProject style */}
            <div className="flex">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'table'
                    ? 'border-[#1A67A3] text-[#1A67A3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Table
                </span>
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'gantt'
                    ? 'border-[#1A67A3] text-[#1A67A3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Gantt
                </span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'split'
                    ? 'border-[#1A67A3] text-[#1A67A3]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                  </svg>
                  Split
                </span>
              </button>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Auto Schedule indicator */}
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  project.autoSchedule
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {project.autoSchedule ? '🔄 Auto Schedule' : '📋 Manual'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main View Area */}
          <div className={`flex-1 overflow-hidden ${showDetailPanel && selectedTask ? '' : ''}`}>
            {viewMode === 'split' ? (
              <div className="h-full flex">
                {/* WBS Table - Left half */}
                <div className="w-1/2 border-r border-gray-200 overflow-hidden">
                  <WbsTable
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={handleSelectTask}
                    onCreateTask={handleTaskCreate}
                    onUpdateTask={handleTaskUpdate}
                    onDeleteTask={handleTaskDelete}
                  />
                </div>
                {/* Gantt Chart - Right half */}
                <div className="w-1/2 overflow-hidden">
                  <GanttChart
                    tasks={tasks}
                    dependencies={dependencies}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={handleSelectTask}
                  />
                </div>
              </div>
            ) : viewMode === 'table' ? (
              <WbsTable
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={handleSelectTask}
                onCreateTask={handleTaskCreate}
                onUpdateTask={handleTaskUpdate}
                onDeleteTask={handleTaskDelete}
              />
            ) : (
              <GanttChart
                tasks={tasks}
                dependencies={dependencies}
                selectedTaskId={selectedTaskId}
                onSelectTask={handleSelectTask}
              />
            )}
          </div>

          {/* Task Detail Panel - Slide-in from right */}
          {showDetailPanel && selectedTask && (
            <div className="w-[420px] flex-shrink-0 border-l border-gray-200 bg-white shadow-lg overflow-hidden">
              <TaskDetailPanel
                task={selectedTask}
                projectId={projectId}
                onClose={() => {
                  setShowDetailPanel(false);
                  setSelectedTaskId(null);
                }}
                onUpdate={(updates) => handleTaskUpdate(selectedTaskId!, updates)}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
