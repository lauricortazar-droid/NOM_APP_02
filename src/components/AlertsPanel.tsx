import React, { useState } from 'react';
import { Task } from '../types';

export function calculateOverdueInfo(dueDateStr: string, status: string, referenceTime = Date.now()) {
  if (status === 'completada') {
    return { isOverdue: false, isCriticalOverdue: false, overdueHours: 0, overdueDays: 0 };
  }
  // Consider due date end of day
  const dueTime = new Date(`${dueDateStr}T23:59:59`).getTime();
  const diffMs = referenceTime - dueTime;
  const overdueHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const overdueDays = Math.floor(overdueHours / 24);

  // Critical delay threshold: greater than 48 hours
  const isCriticalOverdue = overdueHours >= 48;
  const isOverdue = overdueHours > 0 || status === 'vencida';

  return {
    isOverdue,
    isCriticalOverdue,
    overdueHours,
    overdueDays,
  };
}

interface AlertsPanelProps {
  tasks: Task[];
  onCompleteTask: (task: Task) => void;
  onScrollToTask?: (taskId: string) => void;
  onGenerateTestDelayedTask?: () => void;
}

export default function AlertsPanel({
  tasks,
  onCompleteTask,
  onScrollToTask,
  onGenerateTestDelayedTask,
}: AlertsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter tasks with critical delay (> 48h)
  const criticalTasks = tasks
    .filter(t => t.status !== 'completada')
    .map(t => ({
      task: t,
      overdue: calculateOverdueInfo(t.dueDate, t.status),
    }))
    .filter(item => item.overdue.isCriticalOverdue);

  if (criticalTasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 transition">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            ✓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Panel de Alertas Operativas
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                0 Alertas Críticas
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Todas las tareas se encuentran al corriente o dentro del margen preventivo de 48 horas.
            </p>
          </div>
        </div>

        {onGenerateTestDelayedTask && (
          <button
            onClick={onGenerateTestDelayedTask}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition"
            title="Genera una tarea de prueba con fecha límite vencida hace más de 48h"
          >
            + Simular Tarea Vencida (+48h)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl shadow-md overflow-hidden transition-all duration-300">
      {/* Encabezado del Panel de Alertas */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-rose-300 opacity-75"></span>
            <div className="relative w-8 h-8 rounded-full bg-white text-rose-700 flex items-center justify-center font-black shadow text-sm">
              !
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm uppercase tracking-wide">
                Panel de Alertas Críticas &middot; Retraso Superior a 48 Horas
              </h3>
              <span className="bg-white text-rose-700 text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm">
                {criticalTasks.length} {criticalTasks.length === 1 ? 'tarea urgente' : 'tareas urgentes'}
              </span>
            </div>
            <p className="text-rose-100 text-xs mt-0.5 font-medium">
              Atención inmediata requerida: las siguientes tareas han superado el plazo normativo por más de 2 días.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGenerateTestDelayedTask && (
            <button
              onClick={onGenerateTestDelayedTask}
              className="text-[10px] bg-rose-800/80 hover:bg-rose-900 text-rose-100 font-semibold px-2.5 py-1.5 rounded-lg border border-rose-400/50 transition hidden sm:inline-block"
            >
              + Simular otra tarea (+48h)
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-lg transition"
          >
            {isCollapsed ? 'Desplegar Detalle ▼' : 'Plegar ▲'}
          </button>
        </div>
      </div>

      {/* Contenido Desplegable de Tareas Afectadas */}
      {!isCollapsed && (
        <div className="p-4 space-y-3 bg-white/60 divide-y divide-rose-200">
          {criticalTasks.map(({ task, overdue }) => (
            <div
              key={task.id}
              className="pt-3 first:pt-0 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                    Retraso +{overdue.overdueHours}h ({overdue.overdueDays} días)
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {task.title}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  Depto: <strong className="text-slate-800">{task.department}</strong> &middot; Responsable: <strong className="text-slate-800">{task.assigneeName || task.assigneeRole}</strong> &middot; Fecha límite: <span className="font-mono text-rose-700 font-bold">{task.dueDate}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onScrollToTask && (
                  <button
                    onClick={() => onScrollToTask(task.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
                  >
                    Ubicar en Tablero ↓
                  </button>
                )}
                <button
                  onClick={() => onCompleteTask(task)}
                  className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow transition"
                >
                  Marcar como Atendida
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
