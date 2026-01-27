'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Task } from '@/types';
import { buildTaskTree, flattenTree, cn } from '@/lib/utils';
import {
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  differenceInDays,
  isToday,
  isSameDay,
} from 'date-fns';

interface GanttChartProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

const CELL_WIDTH = {
  day: 30,
  week: 100,
  month: 150,
};

const ROW_HEIGHT = 32;

export function GanttChart({
  tasks,
  selectedTaskId,
  onSelectTask,
}: GanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(tasks.map((t) => t.id))
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Build task tree and flatten
  const tree = useMemo(() => buildTaskTree(tasks), [tasks]);
  const flatTasks = useMemo(
    () => flattenTree(tree, expandedIds),
    [tree, expandedIds]
  );

  // Filter tasks with valid dates for gantt display
  const ganttTasks = useMemo(
    () => flatTasks.filter((t) => t.startDate && t.endDate),
    [flatTasks]
  );

  // Calculate date range
  const dateRange = useMemo(() => {
    if (ganttTasks.length === 0) {
      const today = new Date();
      return {
        start: startOfMonth(today),
        end: endOfMonth(addDays(today, 60)),
      };
    }

    const dates = ganttTasks.flatMap((t) => [
      new Date(t.startDate!),
      new Date(t.endDate!),
    ]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    return {
      start: startOfWeek(addDays(minDate, -7)),
      end: endOfWeek(addDays(maxDate, 14)),
    };
  }, [ganttTasks]);

  // Generate timeline headers
  const timelineHeaders = useMemo(() => {
    if (zoomLevel === 'day') {
      return eachDayOfInterval(dateRange).map((date) => ({
        date,
        label: format(date, 'M/d'),
        subLabel: format(date, 'EEE'),
      }));
    }
    if (zoomLevel === 'week') {
      return eachWeekOfInterval(dateRange).map((date) => ({
        date,
        label: format(date, 'M/d'),
        subLabel: `W${format(date, 'w')}`,
      }));
    }
    // Month
    const months: { date: Date; label: string; subLabel: string }[] = [];
    let current = startOfMonth(dateRange.start);
    while (current <= dateRange.end) {
      months.push({
        date: current,
        label: format(current, 'yyyy/MM'),
        subLabel: format(current, 'MMM'),
      });
      current = startOfMonth(addDays(endOfMonth(current), 1));
    }
    return months;
  }, [dateRange, zoomLevel]);

  // Calculate bar position and width
  const getBarStyle = (task: Task) => {
    if (!task.startDate || !task.endDate) return null;

    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const dayOffset = differenceInDays(start, dateRange.start);
    const duration = differenceInDays(end, start) + 1;

    const cellWidth = CELL_WIDTH[zoomLevel];
    const multiplier = zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30;

    const left = (dayOffset / multiplier) * cellWidth;
    const width = Math.max((duration / multiplier) * cellWidth, 4);

    return { left, width };
  };

  // Get bar color based on task type and status
  const getBarColor = (task: Task) => {
    if (task.type === 'milestone') return 'bg-purple-500';
    if (task.type === 'summary') return 'bg-gray-600';
    if (task.status === 'Done') return 'bg-green-500';
    if (task.status === 'Blocked') return 'bg-red-500';
    if (task.status === 'InProgress') return 'bg-blue-500';
    return 'bg-gray-400';
  };

  // Scroll to today
  useEffect(() => {
    if (containerRef.current) {
      const today = new Date();
      const dayOffset = differenceInDays(today, dateRange.start);
      const multiplier = zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30;
      const scrollTo = (dayOffset / multiplier) * CELL_WIDTH[zoomLevel] - 200;
      containerRef.current.scrollLeft = Math.max(0, scrollTo);
    }
  }, [dateRange, zoomLevel]);

  const totalWidth = timelineHeaders.length * CELL_WIDTH[zoomLevel];
  const totalHeight = flatTasks.length * ROW_HEIGHT;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex-shrink-0 p-2 border-b bg-gray-50 flex items-center gap-2">
        <span className="text-sm text-gray-600">Zoom:</span>
        <div className="flex bg-gray-200 rounded p-0.5">
          {(['day', 'week', 'month'] as ZoomLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setZoomLevel(level)}
              className={cn(
                'px-2 py-1 text-xs rounded capitalize',
                zoomLevel === level
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600'
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Task Names Column */}
        <div className="w-48 flex-shrink-0 border-r bg-white">
          {/* Header */}
          <div className="h-12 border-b bg-gray-100 flex items-center px-2">
            <span className="font-medium text-sm text-gray-600">Task</span>
          </div>
          {/* Task list */}
          <div className="overflow-y-auto" style={{ height: `calc(100% - 48px)` }}>
            {flatTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className={cn(
                  'h-8 flex items-center px-2 border-b cursor-pointer hover:bg-gray-50',
                  selectedTaskId === task.id && 'bg-blue-50'
                )}
                style={{ paddingLeft: `${task.level * 12 + 8}px` }}
              >
                <span className="text-sm truncate">
                  {task.type === 'summary' ? '📁' : task.type === 'milestone' ? '🏁' : '📋'}
                  {' '}
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt Chart Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto"
          onScroll={(e) => setScrollLeft((e.target as HTMLDivElement).scrollLeft)}
        >
          {/* Timeline Header */}
          <div
            className="h-12 border-b bg-gray-100 flex sticky top-0 z-10"
            style={{ width: totalWidth }}
          >
            {timelineHeaders.map((header, i) => (
              <div
                key={i}
                className="flex-shrink-0 border-r flex flex-col items-center justify-center"
                style={{ width: CELL_WIDTH[zoomLevel] }}
              >
                <span className="text-xs text-gray-600">{header.label}</span>
                <span className="text-xs text-gray-400">{header.subLabel}</span>
              </div>
            ))}
          </div>

          {/* Chart Body */}
          <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex">
              {timelineHeaders.map((header, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-shrink-0 border-r',
                    zoomLevel === 'day' && isToday(header.date)
                      ? 'bg-yellow-50'
                      : 'bg-white'
                  )}
                  style={{ width: CELL_WIDTH[zoomLevel], height: '100%' }}
                />
              ))}
            </div>

            {/* Row backgrounds */}
            {flatTasks.map((task, i) => (
              <div
                key={task.id}
                className={cn(
                  'absolute w-full border-b',
                  selectedTaskId === task.id ? 'bg-blue-50/50' : ''
                )}
                style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
              />
            ))}

            {/* Today line */}
            {(() => {
              const today = new Date();
              const dayOffset = differenceInDays(today, dateRange.start);
              const multiplier = zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30;
              const left = (dayOffset / multiplier) * CELL_WIDTH[zoomLevel];
              return (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                  style={{ left }}
                />
              );
            })()}

            {/* Task Bars */}
            {flatTasks.map((task, i) => {
              const barStyle = getBarStyle(task);
              if (!barStyle) return null;

              const isSelected = task.id === selectedTaskId;

              if (task.type === 'milestone') {
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={cn(
                      'absolute cursor-pointer',
                      isSelected && 'ring-2 ring-blue-400'
                    )}
                    style={{
                      top: i * ROW_HEIGHT + 8,
                      left: barStyle.left - 6,
                    }}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 gantt-milestone',
                        getBarColor(task)
                      )}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className={cn(
                    'absolute gantt-bar rounded cursor-pointer',
                    getBarColor(task),
                    isSelected && 'ring-2 ring-blue-400',
                    task.type === 'summary' && 'h-3'
                  )}
                  style={{
                    top: i * ROW_HEIGHT + (task.type === 'summary' ? 10 : 6),
                    left: barStyle.left,
                    width: barStyle.width,
                    height: task.type === 'summary' ? 12 : 20,
                  }}
                  title={`${task.title}\n${task.startDate} - ${task.endDate}\nProgress: ${task.progress}%`}
                >
                  {/* Progress indicator */}
                  {task.type !== 'summary' && task.progress > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 bg-black/20 rounded-l"
                      style={{ width: `${task.progress}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
