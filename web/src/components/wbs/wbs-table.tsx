'use client';

import { useState, useMemo } from 'react';
import { Task, TreeNode, TaskType, TaskStatus } from '@/types';
import {
  buildTaskTree,
  flattenTree,
  formatDate,
  getStatusColor,
  getTaskTypeIcon,
  calculateWbsCode,
  cn,
} from '@/lib/utils';

interface WbsTableProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onCreateTask: (data: Partial<Task>) => Promise<Task>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function WbsTable({
  tasks,
  selectedTaskId,
  onSelectTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: WbsTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(tasks.map((t) => t.id))
  );
  const [editingCell, setEditingCell] = useState<{
    taskId: string;
    field: string;
  } | null>(null);

  const tree = useMemo(() => buildTaskTree(tasks), [tasks]);
  const flatTasks = useMemo(
    () => flattenTree(tree, expandedIds),
    [tree, expandedIds]
  );

  const toggleExpand = (taskId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleAddTask = async (parentId: string | null = null) => {
    try {
      await onCreateTask({
        parentId,
        type: 'task' as TaskType,
        title: 'New Task',
        status: 'NotStarted' as TaskStatus,
        progress: 0,
      });
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleCellEdit = async (
    taskId: string,
    field: string,
    value: any
  ) => {
    try {
      await onUpdateTask(taskId, { [field]: value });
      setEditingCell(null);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const hasChildren = (taskId: string) => {
    return tasks.some((t) => t.parentId === taskId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 p-2 border-b bg-gray-50 flex items-center gap-2">
        <button
          onClick={() => handleAddTask(null)}
          className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          + Add Task
        </button>
        <button
          onClick={() => setExpandedIds(new Set(tasks.map((t) => t.id)))}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        >
          Expand All
        </button>
        <button
          onClick={() => setExpandedIds(new Set())}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
        >
          Collapse All
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 text-left font-medium text-gray-600 w-12">
                WBS
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[200px]">
                Title
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 w-24">
                Type
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 w-28">
                Start
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 w-28">
                End
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 w-20">
                Progress
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 w-28">
                Status
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 w-20">
                Est PD
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 w-10">
                ⚠️
              </th>
            </tr>
          </thead>
          <tbody>
            {flatTasks.map((task) => {
              const wbsCode = calculateWbsCode(task, tasks);
              const isSelected = task.id === selectedTaskId;
              const canExpand = hasChildren(task.id);
              const isExpanded = expandedIds.has(task.id);

              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className={cn(
                    'wbs-row border-b cursor-pointer',
                    isSelected && 'selected bg-blue-50'
                  )}
                >
                  {/* WBS Code */}
                  <td className="px-2 py-1.5 text-gray-500 font-mono text-xs">
                    {wbsCode}
                  </td>

                  {/* Title */}
                  <td className="px-2 py-1.5">
                    <div
                      className="flex items-center gap-1"
                      style={{ paddingLeft: `${task.level * 20}px` }}
                    >
                      {canExpand && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(task.id);
                          }}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded"
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      )}
                      {!canExpand && <span className="w-5" />}
                      <span className="mr-1">{getTaskTypeIcon(task.type)}</span>
                      {editingCell?.taskId === task.id &&
                      editingCell?.field === 'title' ? (
                        <input
                          type="text"
                          defaultValue={task.title}
                          autoFocus
                          className="flex-1 px-1 border rounded"
                          onBlur={(e) =>
                            handleCellEdit(task.id, 'title', e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellEdit(
                                task.id,
                                'title',
                                (e.target as HTMLInputElement).value
                              );
                            }
                            if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingCell({ taskId: task.id, field: 'title' });
                          }}
                          className={cn(
                            'truncate',
                            task.type === 'summary' && 'font-medium'
                          )}
                        >
                          {task.title}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-2 py-1.5 text-gray-600 capitalize">
                    {task.type}
                  </td>

                  {/* Start Date */}
                  <td className="px-2 py-1.5 text-gray-600">
                    {formatDate(task.startDate)}
                  </td>

                  {/* End Date */}
                  <td className="px-2 py-1.5 text-gray-600">
                    {formatDate(task.endDate)}
                  </td>

                  {/* Progress */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">
                        {task.progress}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-2 py-1.5">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        getStatusColor(task.status)
                      )}
                    >
                      {task.status}
                    </span>
                  </td>

                  {/* Estimate PD */}
                  <td className="px-2 py-1.5 text-gray-600 text-right">
                    {task.estimatePd ?? '-'}
                  </td>

                  {/* Warning */}
                  <td className="px-2 py-1.5 text-center">
                    {task.hasScheduleWarning && (
                      <span title={task.scheduleWarnings?.join(', ')}>⚠️</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {tasks.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No tasks yet. Click "Add Task" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
