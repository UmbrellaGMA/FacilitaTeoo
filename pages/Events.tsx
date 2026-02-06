import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Event {
    id: string;
    title: string;
    location: string;
    event_date: string;
    event_time: string;
    guests: number;
    status: 'CONFIRMADO' | 'PENDENTE' | 'RASCUNHO' | 'ORÇAMENTO' | 'FINALIZADO';
    event_type: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    notes?: string;
    created_at: string;
}

const Events: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'ORÇAMENTO' | 'CONFIRMADO' | 'RASCUNHO' | 'FINALIZADO'>('ORÇAMENTO');

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    const fetchEvents = async () => {
        setLoading(true);
        // Fetch ALL events (no server-side filtering by status) to ensure stats are correct
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: true });

        if (error) {
            console.error('Error fetching events:', error);
        } else {
            // Apply Global Logic: Filter out drafts older than 24 hours
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const allValidEvents = (data || []).filter(event => {
                if (event.status === 'RASCUNHO') {
                    const createdAt = new Date(event.created_at);
                    return createdAt > oneDayAgo;
                }
                return true;
            });

            setEvents(allValidEvents);
        }
        setLoading(false);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'CONFIRMADO': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
            'PENDENTE': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
            'ORÇAMENTO': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
            'RASCUNHO': 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
            'FINALIZADO': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        };
        return styles[status] || styles['RASCUNHO'];
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '--:--';
        return timeStr.substring(0, 5);
    };

    const updateEventStatus = async (eventId: string, newStatus: string) => {
        const { error } = await supabase
            .from('events')
            .update({ status: newStatus })
            .eq('id', eventId);

        if (error) {
            console.error('Error updating event:', error);
        } else {
            fetchEvents();
        }
    };

    // Helper: Filter events for the list display
    const getFilteredEvents = () => {
        if (filter === 'all') return events;
        return events.filter(e => {
            if (filter === 'ORÇAMENTO') return e.status === 'ORÇAMENTO' || e.status === 'PENDENTE'; // Handle legacy
            return e.status === filter;
        });
    };

    // Helper: Get counts for cards (Global)
    const getCount = (status: string) => {
        if (status === 'ORÇAMENTO') return events.filter(e => e.status === 'ORÇAMENTO' || e.status === 'PENDENTE').length;
        return events.filter(e => e.status === status).length;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Eventos</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Gerencie todos os seus eventos e acompanhe o status de cada um
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap bg-slate-100 dark:bg-white/5 rounded-xl p-1 gap-1">
                    {(['ORÇAMENTO', 'CONFIRMADO', 'RASCUNHO', 'FINALIZADO', 'all'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                                ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-sm font-medium">Orçamentos</p>
                            <p className="text-3xl font-bold mt-1">
                                {getCount('ORÇAMENTO')}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">request_quote</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Confirmados</p>
                            <p className="text-3xl font-bold mt-1">
                                {getCount('CONFIRMADO')}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">check_circle</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-300 text-sm font-medium">Rascunhos</p>
                            <p className="text-3xl font-bold mt-1">
                                {getCount('RASCUNHO')}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">draft</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events List */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                        <p className="text-slate-500 dark:text-slate-400 mt-4">Carregando eventos...</p>
                    </div>
                ) : getFilteredEvents().length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">event_busy</span>
                        <p className="text-slate-500 dark:text-slate-400 mt-4">Nenhum evento encontrado nesta categoria</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {getFilteredEvents().map((event) => (
                            <div
                                key={event.id}
                                className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Event Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-primary uppercase">
                                                {new Date(event.event_date).toLocaleDateString('pt-BR', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold text-primary">
                                                {new Date(event.event_date).getDate()}
                                            </span>
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                                {event.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-base">schedule</span>
                                                    {formatTime(event.event_time)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-base">location_on</span>
                                                    {event.location || 'Local não definido'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-base">group</span>
                                                    {event.guests || 0} convidados
                                                </span>
                                            </div>
                                            {event.client_name && (
                                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                                    <span className="font-medium">Cliente:</span> {event.client_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex items-center gap-3 md:flex-shrink-0">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(event.status)}`}>
                                            {event.status === 'PENDENTE' ? 'ORÇAMENTO' : event.status}
                                        </span>

                                        {(event.status === 'PENDENTE' || event.status === 'ORÇAMENTO') && (
                                            <button
                                                onClick={() => updateEventStatus(event.id, 'CONFIRMADO')}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">check</span>
                                                Confirmar
                                            </button>
                                        )}

                                        {event.status === 'CONFIRMADO' && (
                                            <button
                                                onClick={() => updateEventStatus(event.id, 'FINALIZADO')}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">task_alt</span>
                                                Finalizar
                                            </button>
                                        )}

                                        {event.status === 'RASCUNHO' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateEventStatus(event.id, 'ORÇAMENTO')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-base">request_quote</span>
                                                    Orçamento
                                                </button>
                                                <button
                                                    onClick={() => updateEventStatus(event.id, 'CONFIRMADO')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-base">check</span>
                                                    Confirmar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Events;
