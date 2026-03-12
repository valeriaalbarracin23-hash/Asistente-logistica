import React, { useState, useRef, useEffect } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { askAssistant } from '../services/geminiService';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function Assistant() {
  const { data: tasks, loading: loadingTasks } = useFirestoreCollection<any>('tasks');
  const { data: meetings, loading: loadingMeetings } = useFirestoreCollection<any>('meetings');
  const { data: logistics, loading: loadingLogistics } = useFirestoreCollection<any>('logistics');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateContext = () => {
    const todayTasks = tasks.filter(t => !t.completed && t.dueDate && isToday(t.dueDate.toDate()));
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && isPast(t.dueDate.toDate()) && !isToday(t.dueDate.toDate()));
    const todayMeetings = meetings.filter(m => m.date && isToday(m.date.toDate()));
    const pendingLogistics = logistics.filter(l => l.status === 'pending' || l.status === 'in-progress');

    let context = `Fecha actual: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}\n\n`;
    
    if (overdueTasks.length > 0) {
      context += `¡ATENCIÓN! Tareas ATRASADAS (${overdueTasks.length}):\n`;
      overdueTasks.forEach(t => {
        context += `- ${t.title} (Venció: ${format(t.dueDate.toDate(), "dd MMM")})\n`;
      });
      context += `\n`;
    }

    context += `Tareas pendientes para hoy (${todayTasks.length}):\n`;
    todayTasks.forEach(t => {
      context += `- ${t.title} (Prioridad: ${t.priority})\n`;
    });

    context += `\nReuniones para hoy (${todayMeetings.length}):\n`;
    todayMeetings.forEach(m => {
      context += `- ${m.title} a las ${format(m.date.toDate(), "HH:mm")}\n`;
    });

    context += `\nTrabajos logísticos pendientes o en progreso (${pendingLogistics.length}):\n`;
    pendingLogistics.forEach(l => {
      context += `- ${l.title} (Estado: ${l.status})\n`;
    });

    return context;
  };

  useEffect(() => {
    if (!loadingTasks && !loadingMeetings && !loadingLogistics && !hasInitialized) {
      setHasInitialized(true);
      const initGreeting = async () => {
        setIsLoading(true);
        const context = generateContext();
        const prompt = "Acabo de abrir la aplicación. Por favor, dame un saludo inicial corto. Si tengo tareas atrasadas, menciónalas de inmediato para que no las olvide. Si no tengo tareas atrasadas, solo dame un resumen rápido de mi día.";
        const response = await askAssistant(prompt, context);
        
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          content: response
        }]);
        setIsLoading(false);
      };
      initGreeting();
    }
  }, [loadingTasks, loadingMeetings, loadingLogistics, hasInitialized, tasks, meetings, logistics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const context = generateContext();
    const response = await askAssistant(userMessage.content, context);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Asistente IA</h1>
        <p className="text-zinc-500 mt-1">Chat inteligente para organizar tu día.</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'assistant' ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm sm:text-base ${
                  msg.role === 'user' 
                    ? 'bg-zinc-900 text-white rounded-tr-sm' 
                    : 'bg-zinc-50 text-zinc-800 border border-zinc-100 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 max-w-[85%]"
              >
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-red-600" />
                  <span className="text-sm text-zinc-500">Lucas está escribiendo...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-zinc-100">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a Lucas sobre tu día..."
              className="w-full pl-4 pr-14 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm sm:text-base"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
