import { clsx, type ClassValue } from 'clsx';
import { Task, TreeNode } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Build tree structure from flat task list
export function buildTaskTree(tasks: Task[]): TreeNode[] {
  const taskMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // First pass: create all nodes
  tasks.forEach((task) => {
    taskMap.set(task.id, {
      ...task,
      children: [],
      level: 0,
      isExpanded: true,
    });
  });

  // Second pass: build tree structure
  tasks.forEach((task) => {
    const node = taskMap.get(task.id)!;
    if (task.parentId) {
      const parent = taskMap.get(task.parentId);
      if (parent) {
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort children by orderIndex
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.orderIndex - b.orderIndex);
    nodes.forEach((node) => sortChildren(node.children));
  };
  sortChildren(roots);

  return roots;
}

// Flatten tree to array with correct order
export function flattenTree(nodes: TreeNode[], expandedIds: Set<string>): TreeNode[] {
  const result: TreeNode[] = [];

  const traverse = (node: TreeNode) => {
    result.push(node);
    if (expandedIds.has(node.id) && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  };

  nodes.forEach(traverse);
  return result;
}

// Format date for display
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// Format date for input
export function formatDateForInput(dateString: string | null): string {
  if (!dateString) return '';
  return dateString.split('T')[0];
}

// Calculate days between two dates
export function daysBetween(startDate: string | null, endDate: string | null): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'NotStarted':
      return 'bg-gray-100 text-gray-700';
    case 'InProgress':
      return 'bg-blue-100 text-blue-700';
    case 'Blocked':
      return 'bg-red-100 text-red-700';
    case 'Done':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// Get task type icon
export function getTaskTypeIcon(type: string): string {
  switch (type) {
    case 'summary':
      return '📁';
    case 'milestone':
      return '🏁';
    default:
      return '📋';
  }
}

// Calculate WBS code
export function calculateWbsCode(task: Task, tasks: Task[]): string {
  const path: number[] = [];
  let current: Task | undefined = task;

  while (current) {
    const siblings = tasks.filter((t) => t.parentId === current!.parentId);
    siblings.sort((a, b) => a.orderIndex - b.orderIndex);
    const index = siblings.findIndex((t) => t.id === current!.id);
    path.unshift(index + 1);

    if (current.parentId) {
      current = tasks.find((t) => t.id === current!.parentId);
    } else {
      current = undefined;
    }
  }

  return path.join('.');
}
