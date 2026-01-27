'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { Project, Task } from '@/types';
import { MainLayout } from '@/components/layout/main-layout';
import { WbsTable } from '@/components/wbs/wbs-table';
import { GanttChart } from '@/components/gantt/gantt-chart';
import { TaskDetailPanel } from '@/components/task/task-detail-panel';

type ViewMode = 'wbs' | 'gantt' | 'split';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, token } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchProjectData();
  }, [isAuthenticated, projectId]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/projects/${projectId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data.items);
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
        const affectedIds = new Set(response.data.affectedTasks.map((t: Task) => t.id));
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
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="p-6 text-center">
          <p className="text-gray-500">Project not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b bg-white">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => router.push('/projects')}
                className="text-sm text-gray-500 hover:text-gray-700 mb-1"
              >
                ← Back to Projects
              </button>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('wbs')}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === 'wbs'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  WBS
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === 'gantt'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  Gantt
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === 'split'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  Split
                </button>
              </div>

              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  project.autoSchedule
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {project.autoSchedule ? '🔄 Auto Schedule' : '📋 Manual'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* WBS/Gantt Area */}
          <div
            className={`flex-1 overflow-hidden ${
              selectedTaskId && viewMode !== 'gantt' ? 'border-r' : ''
            }`}
          >
            {viewMode === 'split' ? (
              <div className="h-full flex">
                <div className="w-1/2 border-r overflow-auto">
                  <WbsTable
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={setSelectedTaskId}
                    onCreateTask={handleTaskCreate}
                    onUpdateTask={handleTaskUpdate}
                    onDeleteTask={handleTaskDelete}
                  />
                </div>
                <div className="w-1/2 overflow-auto">
                  <GanttChart
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    onSelectTask={setSelectedTaskId}
                  />
                </div>
              </div>
            ) : viewMode === 'wbs' ? (
              <div className="h-full overflow-auto">
                <WbsTable
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                  onCreateTask={handleTaskCreate}
                  onUpdateTask={handleTaskUpdate}
                  onDeleteTask={handleTaskDelete}
                />
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <GanttChart
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                />
              </div>
            )}
          </div>

          {/* Task Detail Panel */}
          {selectedTaskId && selectedTask && viewMode !== 'gantt' && (
            <div className="w-96 flex-shrink-0 overflow-auto bg-white">
              <TaskDetailPanel
                task={selectedTask}
                projectId={projectId}
                onClose={() => setSelectedTaskId(null)}
                onUpdate={(updates) => handleTaskUpdate(selectedTaskId, updates)}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
