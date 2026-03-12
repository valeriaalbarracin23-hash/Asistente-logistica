import React, { useState } from 'react';
import { useFirestoreCollection, addDocument, updateDocument, deleteDocument } from '../hooks/useFirestore';
import { CheckSquare, Plus, Trash2, Edit2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Timestamp } from 'firebase/firestore';

export function Tasks() {
  const { data: tasks, loading } = useFirestoreCollection<any>('tasks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  const openModal = (task?: any) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      if (task.dueDate) {
        const dateObj = task.dueDate.toDate();
        setDueDate(format(dateObj, 'yyyy-MM-dd'));
        setDueTime(format(dateObj, 'HH:mm'));
      } else {
        setDueDate('');
        setDueTime('');
      }
    } else {
      setEditingTask(null);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setDueTime('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let dateTimestamp = null;
    if (dueDate && dueTime) {
      const dateString = `${dueDate}T${dueTime}:00`;
      dateTimestamp = Timestamp.fromDate(new Date(dateString));
    }

    const taskData = {
      title,
      description,
      priority,
      dueDate: dateTimestamp,
      completed: editingTask ? editingTask.completed : false,
    };

    if (editingTask) {
      await updateDocument('tasks', editingTask.id, taskData);
    } else {
      await addDocument('tasks', taskData);
    }
    closeModal();
  };

  const toggleComplete = async (task: any) => {
    await updateDocument('tasks', task.id, { completed: !task.completed });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar tarea?')) {
      await deleteDocument('tasks', id);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Tareas</h1>
          <p className="text-zinc-500 mt-1">Gestiona tus pendientes logísticos.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm shadow-red-600/20"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nueva Tarea</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-4 sm:p-6">
          <ul className="space-y-3">
            <AnimatePresence>
              {tasks.length === 0 ? (
                <p className="text-center text-zinc-500 py-12">No tienes tareas pendientes. ¡Buen trabajo!</p>
              ) : (
                tasks.map((task: any) => (
                  <motion.li
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                      task.completed ? 'bg-zinc-50 border-zinc-100 opacity-60' : 'bg-white border-zinc-200 hover:border-red-200 hover:shadow-sm'
                    }`}
                  >
                    <button onClick={() => toggleComplete(task)} className="mt-1 flex-shrink-0 text-zinc-400 hover:text-red-600 transition-colors">
                      {task.completed ? <CheckCircle2 size={24} className="text-green-500" /> : <Circle size={24} />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium text-sm sm:text-base ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-900'}`}>
                          {task.title}
                        </h3>
                        {!task.completed && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-zinc-500 text-sm mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-2 font-medium">
                          <Clock size={12} />
                          {format(task.dueDate.toDate(), "dd MMM, HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                      <button onClick={() => openModal(task)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(task.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.li>
                ))
              )}
            </AnimatePresence>
          </ul>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900">{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                  <Trash2 size={20} className="hidden" /> {/* Placeholder for alignment */}
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Título</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                      placeholder="Ej. Revisar inventario de almacén"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción (opcional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                      placeholder="Detalles de la tarea..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha límite</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Hora límite</label>
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Prioridad</label>
                    <div className="flex gap-3">
                      {['low', 'medium', 'high'].map((p) => (
                        <label key={p} className={`flex-1 cursor-pointer border rounded-xl py-2 px-3 text-center text-sm font-medium transition-all ${
                          priority === p 
                            ? p === 'high' ? 'bg-red-50 border-red-200 text-red-700' : p === 'medium' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                        }`}>
                          <input
                            type="radio"
                            name="priority"
                            value={p}
                            checked={priority === p}
                            onChange={(e) => setPriority(e.target.value)}
                            className="sr-only"
                          />
                          {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                        </label>
                      ))}
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="task-form"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
                >
                  {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
