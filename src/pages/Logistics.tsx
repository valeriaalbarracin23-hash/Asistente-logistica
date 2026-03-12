import React, { useState } from 'react';
import { useFirestoreCollection, addDocument, updateDocument, deleteDocument } from '../hooks/useFirestore';
import { Truck, Plus, Trash2, Edit2, Package, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export function Logistics() {
  const { data: logistics, loading } = useFirestoreCollection<any>('logistics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');

  const openModal = (job?: any) => {
    if (job) {
      setEditingJob(job);
      setTitle(job.title);
      setStatus(job.status);
      setNotes(job.notes || '');
    } else {
      setEditingJob(null);
      setTitle('');
      setStatus('pending');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const jobData = {
      title,
      status,
      notes,
    };

    if (editingJob) {
      await updateDocument('logistics', editingJob.id, jobData);
    } else {
      await addDocument('logistics', jobData);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar registro logístico?')) {
      await deleteDocument('logistics', id);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await updateDocument('logistics', id, { status: newStatus });
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;

  const pendingJobs = logistics.filter(l => l.status === 'pending');
  const inProgressJobs = logistics.filter(l => l.status === 'in-progress');
  const deliveredJobs = logistics.filter(l => l.status === 'delivered');

  const renderJobCard = (job: any) => (
    <motion.div
      key={job.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 group hover:border-zinc-300 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-zinc-900 text-sm">{job.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => openModal(job)} className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDelete(job.id)} className="p-1 text-zinc-400 hover:text-red-600 rounded-lg transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {job.notes && <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{job.notes}</p>}
      <div className="flex justify-between items-center mt-4">
        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
          {job.createdAt && format(job.createdAt.toDate(), "dd MMM", { locale: es })}
        </span>
        <select
          value={job.status}
          onChange={(e) => updateStatus(job.id, e.target.value)}
          className={`text-xs font-bold uppercase tracking-wider rounded-lg px-2 py-1 outline-none appearance-none cursor-pointer border-none ${
            job.status === 'pending' ? 'bg-orange-50 text-orange-700' :
            job.status === 'in-progress' ? 'bg-blue-50 text-blue-700' :
            'bg-green-50 text-green-700'
          }`}
        >
          <option value="pending">Pendiente</option>
          <option value="in-progress">En Progreso</option>
          <option value="delivered">Entregado</option>
        </select>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Logística</h1>
          <p className="text-zinc-500 mt-1">Seguimiento de pedidos y entregas.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-sm shadow-orange-600/20"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nuevo Registro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Pendientes */}
        <div className="bg-zinc-50/50 rounded-3xl p-4 border border-zinc-100">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Package size={18} className="text-orange-600" />
            <h2 className="font-bold text-zinc-900">Pendientes</h2>
            <span className="bg-zinc-200 text-zinc-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{pendingJobs.length}</span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            <AnimatePresence>
              {pendingJobs.map(renderJobCard)}
            </AnimatePresence>
          </div>
        </div>

        {/* Columna En Progreso */}
        <div className="bg-zinc-50/50 rounded-3xl p-4 border border-zinc-100">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Truck size={18} className="text-blue-600" />
            <h2 className="font-bold text-zinc-900">En Progreso</h2>
            <span className="bg-zinc-200 text-zinc-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{inProgressJobs.length}</span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            <AnimatePresence>
              {inProgressJobs.map(renderJobCard)}
            </AnimatePresence>
          </div>
        </div>

        {/* Columna Entregados */}
        <div className="bg-zinc-50/50 rounded-3xl p-4 border border-zinc-100">
          <div className="flex items-center gap-2 mb-4 px-2">
            <CheckCircle2 size={18} className="text-green-600" />
            <h2 className="font-bold text-zinc-900">Entregados</h2>
            <span className="bg-zinc-200 text-zinc-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{deliveredJobs.length}</span>
          </div>
          <div className="space-y-3 min-h-[200px]">
            <AnimatePresence>
              {deliveredJobs.map(renderJobCard)}
            </AnimatePresence>
          </div>
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
                <h2 className="text-xl font-bold text-zinc-900">{editingJob ? 'Editar Registro' : 'Nuevo Registro'}</h2>
                <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="logistics-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Título / Pedido</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      placeholder="Ej. Entrega a Cliente A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Estado</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'pending', label: 'Pendiente', color: 'orange' },
                        { value: 'in-progress', label: 'En Progreso', color: 'blue' },
                        { value: 'delivered', label: 'Entregado', color: 'green' }
                      ].map((s) => (
                        <label key={s.value} className={`flex-1 cursor-pointer border rounded-xl py-2 px-1 text-center text-xs sm:text-sm font-medium transition-all ${
                          status === s.value 
                            ? `bg-${s.color}-50 border-${s.color}-200 text-${s.color}-700`
                            : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                        }`}>
                          <input
                            type="radio"
                            name="status"
                            value={s.value}
                            checked={status === s.value}
                            onChange={(e) => setStatus(e.target.value)}
                            className="sr-only"
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Notas rápidas (opcional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                      placeholder="Detalles de la entrega, dirección, etc..."
                    />
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
                  form="logistics-form"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors shadow-sm shadow-orange-600/20"
                >
                  {editingJob ? 'Guardar Cambios' : 'Crear Registro'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
