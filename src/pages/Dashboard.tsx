import React from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { CheckSquare, Calendar, Truck, Clock, AlertCircle } from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'motion/react';

export function Dashboard() {
  const { data: tasks, loading: loadingTasks } = useFirestoreCollection<any>('tasks');
  const { data: meetings, loading: loadingMeetings } = useFirestoreCollection<any>('meetings');
  const { data: logistics, loading: loadingLogistics } = useFirestoreCollection<any>('logistics');

  const todayTasks = tasks.filter(t => !t.completed && t.dueDate && isToday(t.dueDate.toDate()));
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && isPast(t.dueDate.toDate()) && !isToday(t.dueDate.toDate()));
  const todayMeetings = meetings.filter(m => m.date && isToday(m.date.toDate()));
  const pendingLogistics = logistics.filter(l => l.status === 'pending' || l.status === 'in-progress');

  if (loadingTasks || loadingMeetings || loadingLogistics) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Hola Lucas 👋</h1>
        <p className="text-zinc-500 mt-1">Aquí tienes el resumen de tu día logístico.</p>
      </header>

      {overdueTasks.length > 0 && (
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-red-900 text-sm">Tienes {overdueTasks.length} {overdueTasks.length === 1 ? 'tarea atrasada' : 'tareas atrasadas'}</h3>
            <p className="text-red-700 text-xs mt-1">Revisa la sección de tareas para ponerte al día.</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Tareas Hoy</p>
            <p className="text-2xl font-bold text-zinc-900">{todayTasks.length}</p>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-900">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Reuniones</p>
            <p className="text-2xl font-bold text-zinc-900">{todayMeetings.length}</p>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Logística Pendiente</p>
            <p className="text-2xl font-bold text-zinc-900">{pendingLogistics.length}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Tareas del día */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <CheckSquare size={20} className="text-red-600" />
              Tareas Prioritarias
            </h2>
          </div>
          <div className="p-4">
            {todayTasks.length === 0 ? (
              <p className="text-zinc-500 text-center py-8 text-sm">No hay tareas para hoy.</p>
            ) : (
              <ul className="space-y-3">
                {todayTasks.slice(0, 5).map((task: any) => (
                  <li key={task.id} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="font-medium text-zinc-900 text-sm">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                          <Clock size={12} />
                          {format(task.dueDate.toDate(), "HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Reuniones */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Calendar size={20} className="text-zinc-900" />
              Próximas Reuniones
            </h2>
          </div>
          <div className="p-4">
            {todayMeetings.length === 0 ? (
              <p className="text-zinc-500 text-center py-8 text-sm">No hay reuniones programadas.</p>
            ) : (
              <ul className="space-y-3">
                {todayMeetings.slice(0, 5).map((meeting: any) => (
                  <li key={meeting.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                    <div className="bg-zinc-100 text-zinc-900 px-3 py-2 rounded-xl text-center min-w-[60px]">
                      <p className="text-xs font-medium uppercase">{format(meeting.date.toDate(), "MMM", { locale: es })}</p>
                      <p className="text-lg font-bold leading-none mt-1">{format(meeting.date.toDate(), "dd")}</p>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 text-sm">{meeting.title}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        {format(meeting.date.toDate(), "HH:mm", { locale: es })}
                        {meeting.location && ` • ${meeting.location}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
