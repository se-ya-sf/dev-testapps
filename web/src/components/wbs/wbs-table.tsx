'use client';

import { useState, useMemo } from 'react';
import { Task, TaskType, TaskStatus } from '@/types';
import { buildTaskTree, flattenTree, formatDate, cn } from '@/lib/utils';

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

  // Build and flatten task tree
  const tree = useMemo(() => buildTaskTree(tasks), [tasks]);
  const flatTasks = useMemo(
    () => flattenTree(tree, expandedIds),
    [tree, expandedIds]
  );

  const toggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedIds(newExpanded);
  };

  const expandAll = () => setExpandedIds(new Set(tasks.map((t) => t.id)));
  const collapseAll = () => setExpandedIds(new Set());

  // Calculate WBS number
  const calculateWbsNumber = (task: Task, index: number): string => {
    const siblings = tasks.filter((t) => t.parentId === task.parentId);
    const position = siblings.findIndex((t) => t.id === task.id) + 1;
    
    if (!task.parentId) {
      return String(position);
    }
    
    const parent = tasks.find((t) => t.id === task.parentId);
    if (parent) {
      const parentIndex = flatTasks.findIndex((t) => t.id === parent.id);
      const parentWbs = calculateWbsNumber(parent, parentIndex);
      return `${parentWbs}.${position}`;
    }
    return String(position);
  };

  // Handle inline edit
  const handleCellEdit = async (taskId: string, field: string, value: string) => {
    setEditingCell(null);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updates: Partial<Task> = {};
    
    switch (field) {
      case 'title':
        if (value !== task.title) {
          updates.title = value;
        }
        break;
      case 'startDate':
        if (value !== task.startDate) {
          updates.startDate = value || null;
        }
        break;
      case 'endDate':
        if (value !== task.endDate) {
          updates.endDate = value || null;
        }
        break;
      case 'status':
        if (value !== task.status) {
          updates.status = value as TaskStatus;
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      await onUpdateTask(taskId, updates);
    }
  };

  // Get type icon and color
  const getTypeDisplay = (type: TaskType) => {
    switch (type) {
      case 'summary':
        return { icon: '📁', label: 'Phase', color: 'bg-blue-100 text-blue-800' };
      case 'milestone':
        return { icon: '◆', label: 'Milestone', color: 'bg-green-100 text-green-800' };
      default:
        return { icon: '📋', label: 'Task', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Get status display
  const getStatusDisplay = (status: TaskStatus) => {
    switch (status) {
      case 'NotStarted':
        return { label: 'New', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
      case 'InProgress':
        return { label: 'In progress', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
      case 'Blocked':
        return { label: 'Blocked', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
      case 'Done':
        return { label: 'Closed', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
    }
  };

  // Calculate duration
  const getDuration = (task: Task): string => {
    if (!task.startDate || !task.endDate) return '-';
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${days}d`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar - OpenProject style */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-[#F8FAFB]">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Create button */}
            <button
              onClick={() => onCreateTask({ type: 'task', title: 'New Task', status: 'NotStarted' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A67A3] text-white text-sm font-medium rounded hover:bg-[#155a8a] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create
            </button>

            {/* Filter */}
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-600 text-sm border border-gray-300 rounded hover:bg-gray-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Expand/Collapse */}
            <button
              onClick={expandAll}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Expand all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={collapseAll}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Collapse all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            </button>

            {/* Settings */}
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Table - OpenProject spreadsheet style */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          {/* Header */}
          <thead className="sticky top-0 z-10 bg-[#F3F6F8]">
            <tr>
              <th className="w-16 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200">
                ID
              </th>
              <th className="w-24 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200">
                TYPE
              </th>
              <th className="min-w-[300px] px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200">
                SUBJECT
              </th>
              <th className="w-28 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200">
                STATUS
              </th>
              <th className="w-28 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200">
                START DATE
              </th>
              <th className="w-28 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200">
                FINISH DATE
              </th>
              <th className="w-20 px-3 py-2 text-left font-semibold text-gray-600 border-b border-r border-gray-200">
                DURATION
              </th>
              <th className="w-20 px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                % DONE
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {flatTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No work packages to display</p>
                    <button
                      onClick={() => onCreateTask({ type: 'task', title: 'New Task', status: 'NotStarted' })}
                      className="mt-2 text-[#1A67A3] hover:underline"
                    >
                      Create your first work package
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              flatTasks.map((task, index) => {
                const typeDisplay = getTypeDisplay(task.type);
                const statusDisplay = getStatusDisplay(task.status);
                const wbsNumber = calculateWbsNumber(task, index);
                const hasChildren = tasks.some((t) => t.parentId === task.id);
                const isExpanded = expandedIds.has(task.id);
                const isSelected = task.id === selectedTaskId;

                return (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={cn(
                      'border-b border-gray-100 cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-[#E8F4FD] hover:bg-[#DDEEFB]'
                        : 'hover:bg-gray-50',
                      task.type === 'summary' && 'font-medium'
                    )}
                  >
                    {/* ID */}
                    <td className="px-3 py-2 border-r border-gray-100 text-gray-500">
                      #{wbsNumber}
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2 border-r border-gray-100">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', typeDisplay.color)}>
                        {typeDisplay.icon} {typeDisplay.label}
                      </span>
                    </td>

                    {/* Subject (Title) */}
                    <td className="px-3 py-2 border-r border-gray-100">
                      <div 
                        className="flex items-center gap-1"
                        style={{ paddingLeft: `${task.level * 20}px` }}
                      >
                        {/* Expand/Collapse button */}
                        {hasChildren ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(task.id);
                            }}
                            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
                          >
                            <svg
                              className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-90')}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        ) : (
                          <span className="w-5" />
                        )}

                        {/* Title - editable */}
                        {editingCell?.taskId === task.id && editingCell?.field === 'title' ? (
                          <input
                            type="text"
                            defaultValue={task.title}
                            autoFocus
                            onBlur={(e) => handleCellEdit(task.id, 'title', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellEdit(task.id, 'title', e.currentTarget.value);
                              } else if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-1 py-0.5 border border-[#1A67A3] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1A67A3]"
                          />
                        ) : (
                          <span
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingCell({ taskId: task.id, field: 'title' });
                            }}
                            className={cn(
                              'flex-1 truncate',
                              task.type === 'summary' && 'text-[#1A67A3]'
                            )}
                          >
                            {task.title}
                          </span>
                        )}

                        {/* Warning indicator */}
                        {task.hasScheduleWarning && (
                          <span className="text-amber-500" title="Schedule warning">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 border-r border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', statusDisplay.dot)} />
                        <span className="text-gray-700 text-xs">{statusDisplay.label}</span>
                      </div>
                    </td>

                    {/* Start Date */}
                    <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                      {task.startDate ? formatDate(task.startDate) : '-'}
                    </td>

                    {/* End Date */}
                    <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                      {task.endDate ? formatDate(task.endDate) : '-'}
                    </td>

                    {/* Duration */}
                    <td className="px-3 py-2 border-r border-gray-100 text-gray-600">
                      {getDuration(task)}
                    </td>

                    {/* Progress */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              task.progress >= 100 ? 'bg-green-500' : 'bg-[#1A67A3]'
                            )}
                            style={{ width: `${Math.min(task.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{task.progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer - task count */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 bg-[#F8FAFB] text-xs text-gray-500">
        {flatTasks.length} work package{flatTasks.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
