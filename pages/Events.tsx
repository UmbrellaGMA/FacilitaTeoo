import React, { useState, useEffect } from 'react';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { formatCurrency } from '../lib/formatters';
import NewEventModal from '../components/NewEventModal';

interface EventEquipment {
    id: string;
    name: string;
    quantity: number;
}

interface Event {
    id: string;
    title: string;
    description?: string;
    location: string;
    event_date: string;
    event_time: string;
    guests: number;
    value: number;
    status: 'CONFIRMADO' | 'PENDENTE' | 'RASCUNHO' | 'ORÇAMENTO' | 'FINALIZADO';
    type: string;
    event_type: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    lead_id?: string;
    notes?: string;
    created_at: string;
    leads?: { name: string; email?: string; phone?: string; interest?: string };
    selected_equipment?: EventEquipment[];
}

const Events: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'ORÇAMENTO' | 'CONFIRMADO' | 'RASCUNHO' | 'FINALIZADO'>('ORÇAMENTO');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*, leads(name, email, phone, interest)')
            .order('event_date', { ascending: true });

        if (error) {
            console.error('Error fetching events:', error);
        } else {
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CONFIRMADO': return 'check_circle';
            case 'ORÇAMENTO': case 'PENDENTE': return 'request_quote';
            case 'RASCUNHO': return 'draft';
            case 'FINALIZADO': return 'task_alt';
            default: return 'event';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMADO': return 'from-emerald-500 to-teal-600';
            case 'ORÇAMENTO': case 'PENDENTE': return 'from-amber-500 to-orange-600';
            case 'RASCUNHO': return 'from-slate-500 to-slate-600';
            case 'FINALIZADO': return 'from-blue-500 to-indigo-600';
            default: return 'from-primary to-primary-hover';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatFullDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '--:--';
        return timeStr.substring(0, 5);
    };

    const getEventTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            'casamento': '💒 Casamento',
            'aniversario': '🎂 Aniversário',
            'corporativo': '🏢 Corporativo',
            'formatura': '🎓 Formatura',
            'debutante': '👑 Debutante',
            'batizado': '⛪ Batizado',
            'cha_bebe': '🍼 Chá de Bebê',
            'cha_revelacao': '🎀 Chá Revelação',
            'outro': '🎉 Outro',
        };
        return types[type] || type || 'Evento';
    };

    const syncEventToGoogle = async (eventId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'sync', eventId }),
            });
        } catch (e) {
            console.log('Google Calendar sync skipped:', e);
        }
    };

    const deleteEventFromGoogle = async (eventId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'delete', eventId }),
            });
        } catch (e) {
            console.log('Google Calendar delete skipped:', e);
        }
    };

    const updateEventStatus = async (eventId: string, newStatus: string) => {
        const { error } = await supabase
            .from('events')
            .update({ status: newStatus })
            .eq('id', eventId);

        if (error) {
            console.error('Error updating event:', error);
        } else {
            // Sync event status change to Google Calendar
            syncEventToGoogle(eventId);
            fetchEvents();
            if (selectedEvent?.id === eventId) {
                setSelectedEvent({ ...selectedEvent, status: newStatus as any });
            }
        }
    };

    const deleteEvent = async (eventId: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) return;
        setDeleting(true);
        // Delete from Google Calendar first
        await deleteEventFromGoogle(eventId);
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (!error) {
            setShowModal(false);
            setSelectedEvent(null);
            fetchEvents();
        }
        setDeleting(false);
    };

    const openEventDetails = (event: Event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const getFilteredEvents = () => {
        if (filter === 'all') return events;
        return events.filter(e => {
            if (filter === 'ORÇAMENTO') return e.status === 'ORÇAMENTO' || e.status === 'PENDENTE';
            return e.status === filter;
        });
    };

    const getCount = (status: string) => {
        if (status === 'ORÇAMENTO') return events.filter(e => e.status === 'ORÇAMENTO' || e.status === 'PENDENTE').length;
        return events.filter(e => e.status === status).length;
    };

    const getDaysUntilEvent = (dateStr: string) => {
        const eventDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Hoje';
        if (diff === 1) return 'Amanhã';
        if (diff < 0) return `${Math.abs(diff)} dias atrás`;
        return `Em ${diff} dias`;
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
                                className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => openEventDetails(event)}
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
                                            {(event.leads?.name || event.client_name) && (
                                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                                    <span className="font-medium">Cliente:</span> {event.leads?.name || event.client_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status & Actions */}
                                    <div className="flex items-center gap-3 md:flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

            {/* Event Detail Modal */}
            {showModal && selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white dark:bg-[#1a141f] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">

                        {/* Header with gradient */}
                        <div className={`bg-gradient-to-r ${getStatusColor(selectedEvent.status)} p-6 text-white relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

                            <div className="relative flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-white/80">{getStatusIcon(selectedEvent.status)}</span>
                                        <span className="text-sm font-bold text-white/80 uppercase">
                                            {selectedEvent.status === 'PENDENTE' ? 'Orçamento' : selectedEvent.status}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black truncate">{selectedEvent.title}</h2>
                                    <p className="text-white/80 text-sm mt-1">{getEventTypeLabel(selectedEvent.type || selectedEvent.event_type)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                                        title="Editar Evento"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
                                        title="Fechar"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>

                            {/* Countdown badge */}
                            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold">
                                <span className="material-symbols-outlined text-base">calendar_today</span>
                                {getDaysUntilEvent(selectedEvent.event_date)}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
                            <div className="space-y-6">

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl text-center">
                                        <span className="material-symbols-outlined text-primary text-2xl mb-1 block">calendar_month</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Data</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {new Date(selectedEvent.event_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl text-center">
                                        <span className="material-symbols-outlined text-primary text-2xl mb-1 block">schedule</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Horário</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{formatTime(selectedEvent.event_time)}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl text-center">
                                        <span className="material-symbols-outlined text-primary text-2xl mb-1 block">group</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Convidados</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedEvent.guests || 0}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl text-center">
                                        <span className="material-symbols-outlined text-primary text-2xl mb-1 block">payments</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Valor</p>
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedEvent.value || 0)}</p>
                                    </div>
                                </div>

                                {/* Location */}
                                {selectedEvent.location && (
                                    <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-primary">location_on</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Local</p>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedEvent.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Full Date */}
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-primary">event</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Data Completa</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                                                {formatFullDate(selectedEvent.event_date)}
                                                {selectedEvent.event_time && ` às ${formatTime(selectedEvent.event_time)}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Client Info */}
                                {(selectedEvent.leads?.name || selectedEvent.client_name) && (
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">person</span>
                                            Dados do Cliente
                                        </h4>
                                        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm">
                                                    {(selectedEvent.leads?.name || selectedEvent.client_name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{selectedEvent.leads?.name || selectedEvent.client_name}</p>
                                                    {selectedEvent.leads?.interest && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedEvent.leads.interest}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {(selectedEvent.leads?.email || selectedEvent.client_email) && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <span className="material-symbols-outlined text-base text-slate-400">mail</span>
                                                    {selectedEvent.leads?.email || selectedEvent.client_email}
                                                </div>
                                            )}
                                            {(selectedEvent.leads?.phone || selectedEvent.client_phone) && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <span className="material-symbols-outlined text-base text-slate-400">phone</span>
                                                    {selectedEvent.leads?.phone || selectedEvent.client_phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {selectedEvent.description && (
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">description</span>
                                            Descrição / Observações
                                        </h4>
                                        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                {selectedEvent.description}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Equipment */}
                                {selectedEvent.selected_equipment && selectedEvent.selected_equipment.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">inventory_2</span>
                                            Equipamentos ({selectedEvent.selected_equipment.length})
                                        </h4>
                                        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4">
                                            <div className="space-y-2">
                                                {selectedEvent.selected_equipment.map((equip, index) => (
                                                    <div key={equip.id || index} className="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <span className="material-symbols-outlined text-primary text-sm">construction</span>
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-900 dark:text-white">{equip.name}</span>
                                                        </div>
                                                        <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                                                            {equip.quantity}x
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Created date */}
                                <div className="text-center pt-2 border-t border-slate-100 dark:border-white/10">
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Criado em {new Date(selectedEvent.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5">
                            <button
                                onClick={() => deleteEvent(selectedEvent.id)}
                                disabled={deleting}
                                className="flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-base">delete</span>
                                Excluir
                            </button>

                            <div className="flex items-center gap-2">
                                {(selectedEvent.status === 'PENDENTE' || selectedEvent.status === 'ORÇAMENTO') && (
                                    <button
                                        onClick={() => { updateEventStatus(selectedEvent.id, 'CONFIRMADO'); }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
                                    >
                                        <span className="material-symbols-outlined text-base">check</span>
                                        Confirmar
                                    </button>
                                )}
                                {selectedEvent.status === 'CONFIRMADO' && (
                                    <button
                                        onClick={() => { updateEventStatus(selectedEvent.id, 'FINALIZADO'); }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/25"
                                    >
                                        <span className="material-symbols-outlined text-base">task_alt</span>
                                        Finalizar
                                    </button>
                                )}
                                {selectedEvent.status === 'RASCUNHO' && (
                                    <>
                                        <button
                                            onClick={() => { updateEventStatus(selectedEvent.id, 'ORÇAMENTO'); }}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-base">request_quote</span>
                                            Orçamento
                                        </button>
                                        <button
                                            onClick={() => { updateEventStatus(selectedEvent.id, 'CONFIRMADO'); }}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
                                        >
                                            <span className="material-symbols-outlined text-base">check</span>
                                            Confirmar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Edit Event Modal */}
            <NewEventModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onEventCreated={() => {
                    fetchEvents();
                    setShowEditModal(false);
                    // Also update selectedEvent if it's the one being edited
                    if (selectedEvent) {
                        // We might need to re-fetch the specific event or just close the details modal
                        // For simplicity, let's close the details modal too or re-fetch it.
                        // Actually fetchEvents refreshes the list in background. 
                        // Ideally we should update selectedEvent with new data.
                        // But for now let's just close the edit modal.
                        // A better UX would be to re-fetch.
                        // Let's close the details modal to avoid stale data display
                        setShowModal(false);
                    }
                }}
                eventToEdit={selectedEvent}
            />
        </div >
    );
};

export default Events;
