import React, { useState } from 'react';
import { CheckSquare, Plus, Calendar, Clock, AlertCircle, Trash2, CheckCircle2, User as UserIcon } from 'lucide-react';
import { useCrm } from '../context/CrmContext';

interface TasksViewProps {
  onOpenCreateTask: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenCreateTask }) => {
  const { tasks, toggleTaskStatus, softDeleteTask, globalSearch } = useCrm();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'PENDING' && t.status === 'COMPLETED') return false;
    if (filter === 'COMPLETED' && t.status !== 'COMPLETED') return false;
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.dealTitle && t.dealTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const priorityColors = {
    URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    MEDIUM: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    LOW: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Sales Tasks & Action Items
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {tasks.filter(t => t.status !== 'COMPLETED').length} pending
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Follow-ups, RFP deadlines, contract reviews, and scheduled client meetings
          </p>
        </div>

        <button
          onClick={onOpenCreateTask}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {(['ALL', 'PENDING', 'COMPLETED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              filter === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40">
            No tasks match your current filter.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isOverdue = !isCompleted && new Date(task.dueDate) < new Date();

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                  isCompleted 
                    ? 'border-slate-800/60 bg-slate-950/40 opacity-70' 
                    : isOverdue 
                    ? 'border-rose-900/40 bg-rose-950/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                      isCompleted 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'border-slate-700 hover:border-indigo-400 bg-slate-950'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <h3 className={`text-xs font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-400">
                      <span className={`px-2 py-0.5 rounded border font-mono font-bold ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>

                      <span className={`flex items-center gap-1 font-mono ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        <span>Due {task.dueDate}</span>
                        {isOverdue && <span className="text-rose-400">(Overdue)</span>}
                      </span>

                      <span className="text-slate-500">
                        Assigned to: <strong className="text-slate-300">{task.assignedAgentName}</strong>
                      </span>

                      {task.dealTitle && (
                        <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {task.dealTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => softDeleteTask(task.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                  title="Soft delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
