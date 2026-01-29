'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus, Comment, TimeLog, ChangeLog } from '@/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { formatDate, cn } from '@/lib/utils';

interface TaskDetailPanelProps {
  task: Task;
  projectId: string;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => Promise<void>;
}

type TabType = 'overview' | 'activity' | 'time' | 'relations';

export function TaskDetailPanel({
  task,
  projectId,
  onClose,
  onUpdate,
}: TaskDetailPanelProps) {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Task>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [history, setHistory] = useState<ChangeLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize edit data
  useEffect(() => {
    setEditData({
      title: task.title,
      description: task.description,
      startDate: task.startDate,
      endDate: task.endDate,
      progress: task.progress,
      status: task.status,
      estimatePd: task.estimatePd,
    });
  }, [task]);

  // Fetch tab data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'activity') {
          const [commentsRes, historyRes] = await Promise.all([
            api.get(`/tasks/${task.id}/comments`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            api.get(`/tasks/${task.id}/history`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setComments(commentsRes.data.items || []);
          setHistory(historyRes.data.items || []);
        } else if (activeTab === 'time') {
          const res = await api.get(`/tasks/${task.id}/time-logs`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTimeLogs(res.data.items || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, task.id, token]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const res = await api.post(
        `/tasks/${task.id}/comments`,
        { body: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => [res.data, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  // Get status options
  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'NotStarted', label: 'New', color: 'bg-gray-400' },
    { value: 'InProgress', label: 'In progress', color: 'bg-blue-500' },
    { value: 'Blocked', label: 'Blocked', color: 'bg-red-500' },
    { value: 'Done', label: 'Closed', color: 'bg-green-500' },
  ];

  // Get type display
  const getTypeDisplay = () => {
    switch (task.type) {
      case 'summary':
        return { icon: '📁', label: 'Phase', color: 'text-blue-600' };
      case 'milestone':
        return { icon: '◆', label: 'Milestone', color: 'text-green-600' };
      default:
        return { icon: '📋', label: 'Task', color: 'text-gray-600' };
    }
  };

  const typeDisplay = getTypeDisplay();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-[#F8FAFB]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('text-lg', typeDisplay.color)}>{typeDisplay.icon}</span>
            <span className="text-sm text-gray-500">{typeDisplay.label}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="px-4 pb-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.title || ''}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full text-lg font-semibold text-gray-900 border border-[#1A67A3] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1A67A3]"
            />
          ) : (
            <h2 className="text-lg font-semibold text-gray-900 truncate">{task.title}</h2>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1">
          {(['overview', 'activity', 'time', 'relations'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-t transition-colors',
                activeTab === tab
                  ? 'bg-white text-[#1A67A3] border-t border-l border-r border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {activeTab === 'overview' && (
          <div className="p-4 space-y-6">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Status
              </label>
              {isEditing ? (
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as TaskStatus })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A67A3] focus:border-[#1A67A3]"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={cn('w-3 h-3 rounded-full', statusOptions.find(s => s.value === task.status)?.color || 'bg-gray-400')} />
                  <span className="text-sm text-gray-700">
                    {statusOptions.find(s => s.value === task.status)?.label || task.status}
                  </span>
                </div>
              )}
            </div>

            {/* Progress */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Progress
              </label>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editData.progress || 0}
                    onChange={(e) => setEditData({ ...editData, progress: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A67A3]"
                  />
                  <span className="text-sm font-medium text-gray-700 w-12 text-right">
                    {editData.progress || 0}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        task.progress >= 100 ? 'bg-green-500' : 'bg-[#1A67A3]'
                      )}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-12 text-right">
                    {task.progress}%
                  </span>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Start date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.startDate || ''}
                    onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A67A3] focus:border-[#1A67A3]"
                  />
                ) : (
                  <p className="text-sm text-gray-700">{task.startDate ? formatDate(task.startDate) : '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Finish date
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.endDate || ''}
                    onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A67A3] focus:border-[#1A67A3]"
                  />
                ) : (
                  <p className="text-sm text-gray-700">{task.endDate ? formatDate(task.endDate) : '-'}</p>
                )}
              </div>
            </div>

            {/* Work estimate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Estimated work
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editData.estimatePd || ''}
                    onChange={(e) => setEditData({ ...editData, estimatePd: parseFloat(e.target.value) || undefined })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A67A3] focus:border-[#1A67A3]"
                    placeholder="Person days"
                  />
                ) : (
                  <p className="text-sm text-gray-700">{task.estimatePd ? `${task.estimatePd} pd` : '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Spent time
                </label>
                <p className="text-sm text-gray-700">{task.actualPd ? `${task.actualPd} pd` : '-'}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A67A3] focus:border-[#1A67A3] resize-none"
                  placeholder="Add a description..."
                />
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {task.description || <span className="text-gray-400 italic">No description</span>}
                </p>
              )}
            </div>

            {/* Schedule Warnings */}
            {task.hasScheduleWarning && task.scheduleWarnings && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Schedule warnings</p>
                    <ul className="mt-1 text-sm text-amber-700">
                      {task.scheduleWarnings.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-4">
            {/* Add comment */}
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1A67A3] focus:border-[#1A67A3] resize-none"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="mt-2 px-4 py-1.5 bg-[#1A67A3] text-white text-sm font-medium rounded hover:bg-[#155a8a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comment
              </button>
            </div>

            {/* Activity feed */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A67A3]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Comments */}
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-[#1A67A3] rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      U
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{comment.body}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Change history */}
                {history.map((change) => (
                  <div key={change.id} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">{change.field}</span> changed
                        {change.before && <span className="text-gray-400"> from {change.before}</span>}
                        {change.after && <span> to <span className="font-medium">{change.after}</span></span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(change.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && history.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No activity yet</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'time' && (
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A67A3]"></div>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total logged</span>
                    <span className="text-lg font-semibold text-[#1A67A3]">
                      {timeLogs.reduce((sum, l) => sum + l.pd, 0).toFixed(1)} pd
                    </span>
                  </div>
                </div>

                {/* Time log list */}
                {timeLogs.length > 0 ? (
                  <div className="space-y-2">
                    {timeLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {formatDate(log.workDate)}
                          </p>
                          {log.note && (
                            <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-[#1A67A3]">
                          {log.pd} pd
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8">No time logged yet</p>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'relations' && (
          <div className="p-4">
            <p className="text-center text-gray-400 py-8">
              Relations feature coming soon
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-[#F8FAFB] px-4 py-3">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-[#1A67A3] text-white text-sm font-medium rounded hover:bg-[#155a8a] disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditData({
                  title: task.title,
                  description: task.description,
                  startDate: task.startDate,
                  endDate: task.endDate,
                  progress: task.progress,
                  status: task.status,
                  estimatePd: task.estimatePd,
                });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full px-4 py-2 bg-[#1A67A3] text-white text-sm font-medium rounded hover:bg-[#155a8a]"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
