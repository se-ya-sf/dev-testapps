'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Task, Dependency } from '@/types';
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
  isWeekend,
  getDay,
} from 'date-fns';

interface GanttChartProps {
  tasks: Task[];
  dependencies?: Dependency[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}

type ZoomLevel = 'day' | 'week' | 'month';

const CELL_WIDTH = {
  day: 36,
  week: 120,
  month: 180,
};

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 56;

export function GanttChart({
  tasks,
  dependencies = [],
  selectedTaskId,
  onSelectTask,
}: GanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
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
        start: startOfWeek(addDays(today, -7), { weekStartsOn: 1 }),
        end: endOfWeek(addDays(today, 60), { weekStartsOn: 1 }),
      };
    }

    const dates = ganttTasks.flatMap((t) => [
      new Date(t.startDate!),
      new Date(t.endDate!),
    ]);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    return {
      start: startOfWeek(addDays(minDate, -14), { weekStartsOn: 1 }),
      end: endOfWeek(addDays(maxDate, 30), { weekStartsOn: 1 }),
    };
  }, [ganttTasks]);

  // Generate all days in range
  const allDays = useMemo(
    () => eachDayOfInterval(dateRange),
    [dateRange]
  );

  // Generate weeks in range
  const weeks = useMemo(
    () => eachWeekOfInterval(dateRange, { weekStartsOn: 1 }),
    [dateRange]
  );

  // Generate months for header
  const months = useMemo(() => {
    const monthsMap = new Map<string, { date: Date; days: number }>();
    allDays.forEach((day) => {
      const key = format(day, 'yyyy-MM');
      const existing = monthsMap.get(key);
      if (existing) {
        existing.days++;
      } else {
        monthsMap.set(key, { date: day, days: 1 });
      }
    });
    return Array.from(monthsMap.values());
  }, [allDays]);

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
    const width = Math.max((duration / multiplier) * cellWidth, 8);

    return { left, width };
  };

  // Get bar color based on task type and status
  const getBarColor = (task: Task) => {
    if (task.type === 'milestone') return 'bg-[#4CAF50]'; // Green diamond
    if (task.type === 'summary') return 'bg-[#1A67A3]'; // Blue for phases
    if (task.status === 'Done') return 'bg-[#4CAF50]';
    if (task.status === 'Blocked') return 'bg-[#E53935]';
    if (task.status === 'InProgress') return 'bg-[#1976D2]';
    return 'bg-[#90CAF9]'; // Light blue for not started
  };

  // Scroll to today on mount
  useEffect(() => {
    if (containerRef.current) {
      const today = new Date();
      const dayOffset = differenceInDays(today, dateRange.start);
      const multiplier = zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30;
      const scrollTo = (dayOffset / multiplier) * CELL_WIDTH[zoomLevel] - 300;
      containerRef.current.scrollLeft = Math.max(0, scrollTo);
    }
  }, [dateRange, zoomLevel]);

  const totalWidth = zoomLevel === 'day' 
    ? allDays.length * CELL_WIDTH.day
    : zoomLevel === 'week'
    ? weeks.length * CELL_WIDTH.week
    : months.length * CELL_WIDTH.month;
  
  const totalHeight = flatTasks.length * ROW_HEIGHT;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar - OpenProject style */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-[#F8FAFB]">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Gantt chart</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center bg-white border border-gray-300 rounded overflow-hidden">
              {(['day', 'week', 'month'] as ZoomLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setZoomLevel(level)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium capitalize transition-colors',
                    zoomLevel === level
                      ? 'bg-[#1A67A3] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {level === 'day' ? 'Days' : level === 'week' ? 'Weeks' : 'Months'}
                </button>
              ))}
            </div>

            {/* Today button */}
            <button
              onClick={() => {
                if (containerRef.current) {
                  const today = new Date();
                  const dayOffset = differenceInDays(today, dateRange.start);
                  const multiplier = zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30;
                  const scrollTo = (dayOffset / multiplier) * CELL_WIDTH[zoomLevel] - 300;
                  containerRef.current.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
                }
              }}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Task Names Column - Left Panel */}
        <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          {/* Header */}
          <div 
            className="border-b border-gray-200 bg-[#F3F6F8] flex items-center px-3 font-medium text-xs text-gray-600 uppercase tracking-wider"
            style={{ height: HEADER_HEIGHT }}
          >
            Work packages
          </div>
          
          {/* Task list */}
          <div className="flex-1 overflow-y-auto">
            {flatTasks.map((task) => {
              const isSelected = task.id === selectedTaskId;
              const hasChildren = tasks.some((t) => t.parentId === task.id);
              const isExpanded = expandedIds.has(task.id);

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className={cn(
                    'flex items-center border-b border-gray-100 cursor-pointer transition-colors',
                    isSelected ? 'bg-[#E8F4FD]' : 'hover:bg-gray-50'
                  )}
                  style={{ 
                    height: ROW_HEIGHT,
                    paddingLeft: `${task.level * 16 + 8}px` 
                  }}
                >
                  {/* Expand/collapse */}
                  {hasChildren ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newExpanded = new Set(expandedIds);
                        if (isExpanded) {
                          newExpanded.delete(task.id);
                        } else {
                          newExpanded.add(task.id);
                        }
                        setExpandedIds(newExpanded);
                      }}
                      className="w-4 h-4 mr-1 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      <svg className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-90')} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ) : (
                    <span className="w-4 mr-1" />
                  )}

                  {/* Type icon */}
                  <span className="mr-2 text-xs">
                    {task.type === 'summary' ? '📁' : task.type === 'milestone' ? '◆' : '📋'}
                  </span>

                  {/* Title */}
                  <span className={cn(
                    'text-sm truncate flex-1',
                    task.type === 'summary' && 'font-medium text-[#1A67A3]'
                  )}>
                    {task.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gantt Chart Area - Right Panel */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto"
          onScroll={(e) => setScrollLeft((e.target as HTMLDivElement).scrollLeft)}
        >
          {/* Timeline Header */}
          <div
            className="sticky top-0 z-20 bg-[#F3F6F8] border-b border-gray-200"
            style={{ width: totalWidth, height: HEADER_HEIGHT }}
          >
            {zoomLevel === 'day' && (
              <>
                {/* Month row */}
                <div className="flex h-7 border-b border-gray-200">
                  {months.map((month, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center text-xs font-medium text-gray-700 border-r border-gray-200"
                      style={{ width: month.days * CELL_WIDTH.day }}
                    >
                      {format(month.date, 'MMMM yyyy')}
                    </div>
                  ))}
                </div>
                {/* Day row */}
                <div className="flex h-7">
                  {allDays.map((day, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center justify-center text-xs border-r border-gray-200',
                        isToday(day) && 'bg-blue-100 font-semibold text-blue-700',
                        isWeekend(day) && !isToday(day) && 'bg-gray-100 text-gray-400'
                      )}
                      style={{ width: CELL_WIDTH.day }}
                    >
                      {format(day, 'd')}
                    </div>
                  ))}
                </div>
              </>
            )}

            {zoomLevel === 'week' && (
              <>
                {/* Month row */}
                <div className="flex h-7 border-b border-gray-200">
                  {months.map((month, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center text-xs font-medium text-gray-700 border-r border-gray-200"
                      style={{ width: (month.days / 7) * CELL_WIDTH.week }}
                    >
                      {format(month.date, 'MMMM yyyy')}
                    </div>
                  ))}
                </div>
                {/* Week row */}
                <div className="flex h-7">
                  {weeks.map((week, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center text-xs text-gray-600 border-r border-gray-200"
                      style={{ width: CELL_WIDTH.week }}
                    >
                      W{format(week, 'w')}
                    </div>
                  ))}
                </div>
              </>
            )}

            {zoomLevel === 'month' && (
              <div className="flex h-full">
                {months.map((month, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center text-xs font-medium text-gray-700 border-r border-gray-200"
                    style={{ width: CELL_WIDTH.month }}
                  >
                    {format(month.date, 'MMM yyyy')}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart Body */}
          <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
            {/* Grid lines and backgrounds */}
            <div className="absolute inset-0">
              {zoomLevel === 'day' && allDays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'absolute top-0 bottom-0 border-r border-gray-100',
                    isWeekend(day) && 'bg-gray-50/50'
                  )}
                  style={{ left: i * CELL_WIDTH.day, width: CELL_WIDTH.day }}
                />
              ))}
              {zoomLevel === 'week' && weeks.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-gray-100"
                  style={{ left: i * CELL_WIDTH.week, width: CELL_WIDTH.week }}
                />
              ))}
              {zoomLevel === 'month' && months.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-gray-100"
                  style={{ left: i * CELL_WIDTH.month, width: CELL_WIDTH.month }}
                />
              ))}
            </div>

            {/* Row backgrounds */}
            {flatTasks.map((task, i) => (
              <div
                key={task.id}
                className={cn(
                  'absolute w-full border-b border-gray-100',
                  selectedTaskId === task.id && 'bg-[#E8F4FD]/50'
                )}
                style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
              />
            ))}

            {/* Today line */}
            {(() => {
              const today = new Date();
              if (today >= dateRange.start && today <= dateRange.end) {
                const dayOffset = differenceInDays(today, dateRange.start);
                const multiplier = zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30;
                const left = (dayOffset / multiplier) * CELL_WIDTH[zoomLevel];
                return (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
                    style={{ left }}
                  >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                );
              }
              return null;
            })()}

            {/* Task Bars */}
            {flatTasks.map((task, i) => {
              const barStyle = getBarStyle(task);
              if (!barStyle) return null;

              const isSelected = task.id === selectedTaskId;

              // Milestone - diamond shape
              if (task.type === 'milestone') {
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={cn(
                      'absolute cursor-pointer z-10 group',
                      isSelected && 'z-20'
                    )}
                    style={{
                      top: i * ROW_HEIGHT + ROW_HEIGHT / 2 - 8,
                      left: barStyle.left - 8,
                    }}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 transform rotate-45',
                        getBarColor(task),
                        isSelected && 'ring-2 ring-blue-400 ring-offset-1'
                      )}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {task.title}
                    </div>
                  </div>
                );
              }

              // Summary - bracket style
              if (task.type === 'summary') {
                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={cn(
                      'absolute cursor-pointer z-10 group',
                      isSelected && 'z-20'
                    )}
                    style={{
                      top: i * ROW_HEIGHT + 8,
                      left: barStyle.left,
                      width: barStyle.width,
                      height: 20,
                    }}
                  >
                    <div
                      className={cn(
                        'h-2 rounded-sm',
                        getBarColor(task),
                        isSelected && 'ring-2 ring-blue-400'
                      )}
                    />
                    {/* Start bracket */}
                    <div className={cn('absolute left-0 top-0 w-1 h-full', getBarColor(task))} />
                    {/* End bracket */}
                    <div className={cn('absolute right-0 top-0 w-1 h-full', getBarColor(task))} />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {task.title} ({task.progress}%)
                    </div>
                  </div>
                );
              }

              // Regular task - bar
              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task.id)}
                  className={cn(
                    'absolute cursor-pointer z-10 group',
                    isSelected && 'z-20'
                  )}
                  style={{
                    top: i * ROW_HEIGHT + 8,
                    left: barStyle.left,
                    width: barStyle.width,
                    height: 20,
                  }}
                >
                  <div
                    className={cn(
                      'h-full rounded-sm relative overflow-hidden',
                      getBarColor(task),
                      isSelected && 'ring-2 ring-blue-400'
                    )}
                  >
                    {/* Progress fill */}
                    {task.progress > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-black/20"
                        style={{ width: `${task.progress}%` }}
                      />
                    )}
                    
                    {/* Bar text */}
                    {barStyle.width > 60 && (
                      <span className="absolute inset-0 flex items-center px-2 text-white text-xs font-medium truncate">
                        {task.title}
                      </span>
                    )}
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-gray-300">
                      {task.startDate} → {task.endDate}
                    </div>
                    <div className="text-gray-300">Progress: {task.progress}%</div>
                  </div>
                </div>
              );
            })}

            {/* Dependency Lines */}
            <svg
              className="absolute inset-0 pointer-events-none z-5"
              style={{ width: totalWidth, height: totalHeight }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="6"
                  markerHeight="5"
                  refX="5"
                  refY="2.5"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2.5, 0 5" fill="#6B7280" />
                </marker>
                <marker
                  id="arrowhead-highlight"
                  markerWidth="6"
                  markerHeight="5"
                  refX="5"
                  refY="2.5"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2.5, 0 5" fill="#1A67A3" />
                </marker>
              </defs>
              {dependencies.map((dep) => {
                const predTask = flatTasks.find((t) => t.id === dep.predecessorTaskId);
                const succTask = flatTasks.find((t) => t.id === dep.successorTaskId);

                if (!predTask || !succTask) return null;

                const predBar = getBarStyle(predTask);
                const succBar = getBarStyle(succTask);

                if (!predBar || !succBar) return null;

                const predIndex = flatTasks.findIndex((t) => t.id === dep.predecessorTaskId);
                const succIndex = flatTasks.findIndex((t) => t.id === dep.successorTaskId);

                const isHighlighted = predTask.id === selectedTaskId || succTask.id === selectedTaskId;

                // Calculate connection points (FS - Finish to Start)
                const startX = predBar.left + predBar.width;
                const startY = predIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                const endX = succBar.left;
                const endY = succIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

                // Path with smooth corners
                const gap = 8;
                let path: string;

                if (endX > startX + gap * 2) {
                  const midX = startX + (endX - startX) / 2;
                  path = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX - 4} ${endY}`;
                } else {
                  const wrapY = Math.max(startY, endY) + ROW_HEIGHT * 0.6;
                  path = `M ${startX} ${startY} L ${startX + gap} ${startY} L ${startX + gap} ${wrapY} L ${endX - gap} ${wrapY} L ${endX - gap} ${endY} L ${endX - 4} ${endY}`;
                }

                return (
                  <path
                    key={dep.id}
                    d={path}
                    fill="none"
                    stroke={isHighlighted ? '#1A67A3' : '#9CA3AF'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                    style={{ opacity: isHighlighted ? 1 : 0.6 }}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 bg-[#F8FAFB] text-xs text-gray-500 flex justify-between">
        <span>{flatTasks.length} work packages</span>
        <span>
          {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
        </span>
      </div>
    </div>
  );
}
