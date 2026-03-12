import React, { useState } from 'react';
import { useFirestoreCollection, addDocument, updateDocument, deleteDocument } from '../hooks/useFirestore';
import { Calendar, Plus, Trash2, Edit2, MapPin, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Timestamp } from 'firebase/firestore';

export function Meetings() {
  const { data: meetings, loading } = useFirestoreCollection<any>('meetings');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const openModal = (meeting?: any) => {
    if (meeting) {
      setEditingMeeting(meeting);
      setTitle(meeting.title);
      setLocation(meeting.location || '');
      setNotes(meeting.notes || '');
      if (meeting.date) {
        const dateObj = meeting.date.toDate();
        setDate(format(dateObj, 'yyyy-MM-dd'));
        setTime(format(dateObj, 'HH:mm'));
      } else {
        setDate('');
        setTime('');
      }
    } else {
      setEditingMeeting(null);
      setTitle('');
      setLocation('');
      setNotes('');
      setDate('');
      setTime('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMeeting(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let dateTimestamp = null;
    if (date && time) {
      const dateString = `${date}T${time}:00`;
      dateTimestamp = Timestamp.fromDate(new Date(dateString));
    } else {
      alert('La fecha y hora son obligatorias');
      return;
    }

    const meetingData = {
      title,
      location,
      notes,
      date: dateTimestamp,
    };

    if (editingMeeting) {
      await updateDocument('meetings', editingMeeting.id, meetingData);
    } else {
      await addDocument('meetings', meetingData);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar reunión?')) {
      await deleteDocument('meetings', id);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Reuniones</h1>
          <p className="text-zinc-500 mt-1">Tu agenda de compromisos.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm shadow-zinc-900/20"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Nueva Reunión</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {meetings.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-zinc-100">
              <Calendar size={48} className="mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">No tienes reuniones programadas.</p>
            </div>
          ) : (
            meetings.map((meeting: any) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-sm border border-zinc-100 p-6 hover:shadow-md transition-shadow relative group"
              >
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(meeting)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(meeting.id)} className="p-2 text-zinc-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-zinc-50 text-zinc-900 p-3 rounded-2xl text-center min-w-[70px] border border-zinc-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-600">{format(meeting.date.toDate(), "MMM", { locale: es })}</p>
                    <p className="text-2xl font-black leading-none mt-1">{format(meeting.date.toDate(), "dd")}</p>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-bold text-zinc-900 truncate pr-16">{meeting.title}</h3>
                    
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-zinc-600 flex items-center gap-2">
                        <Clock size={16} className="text-zinc-400" />
                        {format(meeting.date.toDate(), "HH:mm", { locale: es })} hrs
                      </p>
                      {meeting.location && (
                        <p className="text-sm text-zinc-600 flex items-center gap-2">
                          <MapPin size={16} className="text-zinc-400" />
                          <span className="truncate">{meeting.location}</span>
                        </p>
                      )}
                      {meeting.notes && (
                        <p className="text-sm text-zinc-600 flex items-start gap-2">
                          <FileText size={16} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{meeting.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
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
                <h2 className="text-xl font-bold text-zinc-900">{editingMeeting ? 'Editar Reunión' : 'Nueva Reunión'}</h2>
                <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <form id="meeting-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Título</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all"
                      placeholder="Ej. Revisión de rutas"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Hora</label>
                      <input
                        type="time"
                        required
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Ubicación (opcional)</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all"
                      placeholder="Ej. Sala de juntas A / Enlace de Meet"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Notas (opcional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all resize-none"
                      placeholder="Temas a tratar..."
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
                  form="meeting-form"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-zinc-800 transition-colors shadow-sm shadow-zinc-900/20"
                >
                  {editingMeeting ? 'Guardar Cambios' : 'Agendar Reunión'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
