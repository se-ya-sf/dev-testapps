import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

interface WbsRow {
  wbsCode: string;
  title: string;
  type: string;
  assignees: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  estimatePd: number | null;
  actualPd: number;
  ganttVisible: boolean;
  scheduleWarning: string;
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportProjectToExcel(projectId: string): Promise<Buffer> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // Get all tasks with assignees
    const tasks = await this.prisma.task.findMany({
      where: { projectId, deletedAt: null },
      include: {
        assignees: {
          include: {
            user: {
              select: { displayName: true },
            },
          },
        },
      },
      orderBy: [{ parentId: 'asc' }, { orderIndex: 'asc' }],
    });

    // Get time logs for actual PD calculation
    const taskIds = tasks.map((t) => t.id);
    const timeLogSums = await this.prisma.timeLog.groupBy({
      by: ['taskId'],
      where: { taskId: { in: taskIds } },
      _sum: { pd: true },
    });
    const actualPdMap = new Map(timeLogSums.map((t) => [t.taskId, t._sum.pd || 0]));

    // Get dependencies for schedule warnings
    const dependencies = await this.prisma.dependency.findMany({
      where: { projectId },
    });

    // Build WBS hierarchy
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const rootTasks = tasks.filter((t) => !t.parentId);
    const wbsRows: WbsRow[] = [];

    const buildWbsRows = (parentTasks: typeof tasks, prefix: string = '') => {
      parentTasks.forEach((task, index) => {
        const wbsCode = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        const children = tasks.filter((t) => t.parentId === task.id);
        const assigneeNames = task.assignees
          .map((a) => a.user.displayName)
          .join(', ');

        // Check gantt visibility
        const ganttVisible = !!(task.startDate && task.endDate);

        // Check schedule warnings
        let scheduleWarning = '';
        const asSuccessor = dependencies.filter((d) => d.successorTaskId === task.id);
        for (const dep of asSuccessor) {
          const pred = taskMap.get(dep.predecessorTaskId);
          if (!task.startDate || !task.endDate) {
            scheduleWarning = 'SCHEDULE_MISSING_DATES';
            break;
          }
          if (pred?.endDate && task.startDate) {
            const minStart = new Date(
              pred.endDate.getTime() + dep.lagDays * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000,
            );
            if (task.startDate < minStart) {
              scheduleWarning = 'SCHEDULE_VIOLATION';
              break;
            }
          }
        }

        wbsRows.push({
          wbsCode,
          title: task.title,
          type: task.type,
          assignees: assigneeNames,
          startDate: task.startDate?.toISOString().split('T')[0] || '',
          endDate: task.endDate?.toISOString().split('T')[0] || '',
          progress: task.progress,
          status: task.status,
          estimatePd: task.estimatePd,
          actualPd: actualPdMap.get(task.id) || 0,
          ganttVisible,
          scheduleWarning,
        });

        if (children.length > 0) {
          buildWbsRows(children, wbsCode);
        }
      });
    };

    buildWbsRows(rootTasks);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WBS Progress Management';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('WBS');

    // Define columns
    worksheet.columns = [
      { header: 'WBS', key: 'wbsCode', width: 10 },
      { header: 'タイトル', key: 'title', width: 40 },
      { header: 'タイプ', key: 'type', width: 12 },
      { header: '担当者', key: 'assignees', width: 25 },
      { header: '開始日', key: 'startDate', width: 12 },
      { header: '終了日', key: 'endDate', width: 12 },
      { header: '進捗(%)', key: 'progress', width: 10 },
      { header: 'ステータス', key: 'status', width: 14 },
      { header: '見積PD', key: 'estimatePd', width: 10 },
      { header: '実績PD', key: 'actualPd', width: 10 },
      { header: 'ガント表示', key: 'ganttVisible', width: 12 },
      { header: '警告', key: 'scheduleWarning', width: 25 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    wbsRows.forEach((row) => {
      const excelRow = worksheet.addRow({
        ...row,
        ganttVisible: row.ganttVisible ? '○' : '×',
      });

      // Highlight overdue or warning rows
      if (row.scheduleWarning) {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' },
        };
      }

      // Highlight completed tasks
      if (row.status === 'Done') {
        excelRow.font = { color: { argb: 'FF008000' } };
      }
    });

    // Add project info as header
    worksheet.insertRow(1, [`プロジェクト: ${project.name}`]);
    worksheet.mergeCells('A1:L1');
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.insertRow(2, [`出力日時: ${new Date().toLocaleString('ja-JP')}`]);
    worksheet.mergeCells('A2:L2');
    worksheet.insertRow(3, []);

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + wbsRows.length, column: 12 },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
