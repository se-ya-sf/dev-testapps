'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus, Comment, TimeLog, ChangeLog } from '@/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { formatDate, formatDateForInput, getStatusColor, cn } from '@/lib/utils';

interface TaskDetailPanelProps {
  task: Task;
  projectId: string;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => Promise<void>;
}

type Tab = 'details' | 'timelogs' | 'comments' | 'history';

export function TaskDetailPanel({
  task,
  projectId,
  onClose,
  onUpdate,
}: TaskDetailPanelProps) {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Task>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [history, setHistory] = useState<ChangeLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditData({
      title: task.title,
      description: task.description,
      startDate: task.startDate,
      endDate: task.endDate,
      progress: task.progress,
      status: task.status,
      estimatePd: task.estimatePd,
      priority: task.priority,
    });
  }, [task]);

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    } else if (activeTab === 'timelogs') {
      fetchTimeLogs();
    } else if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, task.id]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${task.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(response.data.items);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const fetchTimeLogs = async () => {
    try {
      const response = await api.get(`/tasks/${task.id}/time-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeLogs(response.data.items);
    } catch (err) {
      console.error('Failed to fetch time logs:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get(`/tasks/${task.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data.items);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await api.post(
        `/tasks/${task.id}/comments`,
        { body: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'timelogs', label: 'Time Logs' },
    { id: 'comments', label: 'Comments' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  getStatusColor(task.status)
                )}
              >
                {task.status}
              </span>
              <span className="text-sm text-gray-500 capitalize">{task.type}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Edit/View Mode Toggle */}
            <div className="flex justify-end">
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.description || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-800">
                    {task.description || '-'}
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Start Date
                  </label>
                  {isEditing && task.type !== 'summary' ? (
                    <input
                      type="date"
                      value={formatDateForInput(editData.startDate || null)}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          startDate: e.target.value || null,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {formatDate(task.startDate)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    End Date
                  </label>
                  {isEditing && task.type !== 'summary' ? (
                    <input
                      type="date"
                      value={formatDateForInput(editData.endDate || null)}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          endDate: e.target.value || null,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {formatDate(task.endDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Progress
                </label>
                {isEditing && task.type !== 'summary' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editData.progress || 0}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          progress: parseInt(e.target.value),
                        }))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{editData.progress}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-sm w-12">{task.progress}%</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Status
                </label>
                {isEditing ? (
                  <select
                    value={editData.status}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        status: e.target.value as TaskStatus,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="NotStarted">Not Started</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Done">Done</option>
                  </select>
                ) : (
                  <span
                    className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      getStatusColor(task.status)
                    )}
                  >
                    {task.status}
                  </span>
                )}
              </div>

              {/* Estimate PD */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Estimate (PD)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editData.estimatePd || ''}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          estimatePd: e.target.value
                            ? parseFloat(e.target.value)
                            : null,
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-800">
                      {task.estimatePd ?? '-'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Actual (PD)
                  </label>
                  <p className="text-sm text-gray-800">{task.actualPd ?? '-'}</p>
                </div>
              </div>

              {/* Warnings */}
              {task.hasScheduleWarning && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <span>⚠️</span>
                    <span className="text-sm font-medium">Schedule Warning</span>
                  </div>
                  <ul className="mt-1 text-sm text-yellow-700">
                    {task.scheduleWarnings?.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timelogs' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Total: {timeLogs.reduce((sum, log) => sum + log.pd, 0)} PD
            </div>
            {timeLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No time logs recorded.</p>
            ) : (
              <div className="space-y-2">
                {timeLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-gray-50 rounded-md text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{log.workDate}</span>
                      <span className="text-primary-600">{log.pd} PD</span>
                    </div>
                    {log.note && (
                      <p className="text-gray-600 mt-1">{log.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* Add comment */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment... (use @email to mention)"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50"
              >
                Post
              </button>
            </div>

            {/* Comments list */}
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500">No comments yet.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>User {comment.userId.slice(0, 8)}...</span>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {comment.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No history available.</p>
            ) : (
              history.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-gray-50 rounded-md text-sm"
                >
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="font-medium">{log.field}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-red-600 line-through">
                      {log.before || '(empty)'}
                    </span>
                    <span>→</span>
                    <span className="text-green-600">
                      {log.after || '(empty)'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
