import React, { useState, useEffect } from 'react';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { formatCurrency, parseCurrencyToNumber } from '../lib/formatters';


interface Lead {
    id: string;
    name: string;
    interest?: string;
    email?: string;
    phone?: string;
}

interface NewEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEventCreated: () => void;
}

const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose, onEventCreated }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(false);
    const [showNewLeadForm, setShowNewLeadForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        guests: 0,
        type: 'casamento',
        lead_id: '',
        value: 0,
    });

    const [newLeadData, setNewLeadData] = useState({
        name: '',
        email: '',
        phone: '',
        interest: '',
    });

    // Equipment Logic
    interface Equipment {
        id: string;
        name: string;
        total: number;
        in_use: number;
    }

    interface SelectedEquipment {
        id: string;
        name: string;
        quantity: number;
    }

    const [showEquipmentModal, setShowEquipmentModal] = useState(false);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchLeads();
            fetchEquipment();
        }
    }, [isOpen]);

    const fetchEquipment = async () => {
        const { data } = await supabase
            .from('equipment')
            .select('*')
            .order('name', { ascending: true });
        if (data) setEquipmentList(data);
    };

    const addEquipment = (equip: Equipment) => {
        setSelectedEquipment(prev => {
            if (prev.find(i => i.id === equip.id)) return prev;
            return [...prev, { id: equip.id, name: equip.name, quantity: 1 }];
        });
    };

    const removeEquipment = (id: string) => {
        setSelectedEquipment(prev => prev.filter(i => i.id !== id));
    };

    const updateEquipmentQuantity = (id: string, delta: number) => {
        setSelectedEquipment(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                // Check availability if adding
                if (delta > 0) {
                    const equip = equipmentList.find(e => e.id === id);
                    if (equip && newQty > (equip.total - equip.in_use)) return item; // limit to available
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const fetchLeads = async () => {
        const { data } = await supabase
            .from('leads')
            .select('*')
            .order('name', { ascending: true });
        if (data) setLeads(data);
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const createLead = async () => {
        if (!newLeadData.name.trim()) return;

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        // Check if a lead with the same name already exists
        const { data: existingLeads } = await supabase
            .from('leads')
            .select('*')
            .ilike('name', newLeadData.name.trim())
            .limit(1);

        if (existingLeads && existingLeads.length > 0) {
            // Reuse the existing lead
            const existing = existingLeads[0];
            setLeads([...leads, existing]);
            setEventData({ ...eventData, lead_id: existing.id });
            setNewLeadData({ name: '', email: '', phone: '', interest: '' });
            setShowNewLeadForm(false);
            return;
        }

        // No existing lead found, create a new one
        const { data, error } = await supabase
            .from('leads')
            .insert({
                name: newLeadData.name,
                email: newLeadData.email,
                phone: newLeadData.phone,
                interest: newLeadData.interest || eventData.type,
                status: 'qualified',
                user_id: user?.id,
            })
            .select()
            .single();

        if (!error && data) {
            setLeads([...leads, data]);
            setEventData({ ...eventData, lead_id: data.id });
            setNewLeadData({ name: '', email: '', phone: '', interest: '' });
            setShowNewLeadForm(false);
        }
    };


    const createEvent = async (status: 'RASCUNHO' | 'ORÇAMENTO' | 'CONFIRMADO') => {
        if (!eventData.title.trim() || !eventData.event_date) return;

        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        const { data: insertedData, error } = await supabase.from('events').insert({
            title: eventData.title,
            description: eventData.description,
            event_date: eventData.event_date,
            event_time: eventData.event_time,
            location: eventData.location,
            guests: eventData.guests,
            type: eventData.type,
            lead_id: eventData.lead_id || null,
            value: eventData.value,
            status: status,
            user_id: user?.id,
            selected_equipment: selectedEquipment.length > 0 ? selectedEquipment : [],
        }).select('id').single();


        setLoading(false);
        if (!error && insertedData) {
            // Auto-sync to Google Calendar in background (non-blocking)
            (async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;

                    await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ action: 'sync', eventId: insertedData.id }),
                    });
                } catch (e) {
                    console.log('Google Calendar sync skipped:', e);
                }
            })();

            onEventCreated();
            onClose();
            setEventData({
                title: '',
                description: '',
                event_date: '',
                event_time: '',
                location: '',
                guests: 0,
                type: 'casamento',
                lead_id: '',
                value: 0,
            });
        }
    };

    const eventTypes = [
        { value: 'casamento', label: 'Casamento' },
        { value: 'aniversario', label: 'Aniversário' },
        { value: 'corporativo', label: 'Corporativo' },
        { value: 'formatura', label: 'Formatura' },
        { value: 'debutante', label: 'Debutante' },
        { value: 'outro', label: 'Outro' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1a141f] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-[#e2dbe6] dark:border-[#31253a] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">add_circle</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#161118] dark:text-white">Novo Evento</h2>
                            <p className="text-xs text-[#7c6189]">Preencha os dados do evento</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="space-y-6">
                        {/* Event Info */}
                        <div>
                            <h3 className="text-sm font-bold text-[#161118] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg">event</span>
                                Informações do Evento
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Título do Evento *</label>
                                    <input
                                        type="text"
                                        value={eventData.title}
                                        onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                                        placeholder="Ex: Casamento Silva & Costa"
                                        className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Tipo de Evento</label>
                                    <select
                                        value={eventData.type}
                                        onChange={(e) => setEventData({ ...eventData, type: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                    >
                                        {eventTypes.map((type) => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Número de Convidados</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={eventData.guests || ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '');
                                            setEventData({ ...eventData, guests: raw ? parseInt(raw, 10) : 0 });
                                        }}
                                        className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                    />

                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Data do Evento *</label>
                                    <input
                                        type="date"
                                        value={eventData.event_date}
                                        onChange={(e) => setEventData({ ...eventData, event_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Horário</label>
                                    <input
                                        type="time"
                                        value={eventData.event_time}
                                        onChange={(e) => setEventData({ ...eventData, event_time: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Local</label>
                                    <input
                                        type="text"
                                        value={eventData.location}
                                        onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                                        placeholder="Ex: Salão de Festas Primavera"
                                        className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Valor (R$)</label>
                                    <input
                                        type="text"
                                        value={formatCurrency(eventData.value)}
                                        onChange={(e) => setEventData({ ...eventData, value: parseCurrencyToNumber(e.target.value) })}
                                        className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                    />

                                </div>
                            </div>
                        </div>

                        {/* Client Selection */}
                        <div>
                            <h3 className="text-sm font-bold text-[#161118] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg">person</span>
                                Cliente
                            </h3>

                            {!showNewLeadForm ? (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7c6189]">search</span>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Buscar cliente em leads..."
                                            className="w-full pl-10 pr-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>

                                    {leads.length === 0 ? (
                                        <div className="text-center py-6 bg-[#f3f0f4] dark:bg-white/5 rounded-xl">
                                            <span className="material-symbols-outlined text-4xl text-[#7c6189]/30 mb-2">person_off</span>
                                            <p className="text-sm text-[#7c6189] mb-3">Nenhum cliente cadastrado</p>
                                            <button
                                                onClick={() => setShowNewLeadForm(true)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold"
                                            >
                                                <span className="material-symbols-outlined text-lg">person_add</span>
                                                Cadastrar Cliente
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="max-h-40 overflow-y-auto space-y-2">
                                                {filteredLeads.map((lead) => (
                                                    <button
                                                        key={lead.id}
                                                        onClick={() => setEventData({ ...eventData, lead_id: lead.id })}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${eventData.lead_id === lead.id
                                                            ? 'bg-primary/10 border-2 border-primary'
                                                            : 'bg-[#f3f0f4] dark:bg-white/5 hover:bg-[#e2dbe6] dark:hover:bg-white/10'
                                                            }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                                            {lead.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-[#161118] dark:text-white">{lead.name}</p>
                                                            <p className="text-xs text-[#7c6189]">{lead.interest || 'Lead'}</p>
                                                        </div>
                                                        {eventData.lead_id === lead.id && (
                                                            <span className="material-symbols-outlined text-primary">check_circle</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setShowNewLeadForm(true)}
                                                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#e2dbe6] dark:border-[#31253a] rounded-xl text-sm font-bold text-[#7c6189] hover:border-primary hover:text-primary transition-all"
                                            >
                                                <span className="material-symbols-outlined">person_add</span>
                                                Cadastrar Novo Cliente
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 p-4 bg-[#f3f0f4] dark:bg-white/5 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-[#161118] dark:text-white">Novo Cliente</h4>
                                        <button onClick={() => setShowNewLeadForm(false)} className="text-[#7c6189] hover:text-primary">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <input
                                                type="text"
                                                value={newLeadData.name}
                                                onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                                                placeholder="Nome completo *"
                                                className="w-full px-4 py-3 bg-white dark:bg-white/10 border-none rounded-xl text-sm"
                                            />
                                        </div>
                                        <input
                                            type="email"
                                            value={newLeadData.email}
                                            onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                                            placeholder="Email"
                                            className="w-full px-4 py-3 bg-white dark:bg-white/10 border-none rounded-xl text-sm"
                                        />
                                        <input
                                            type="tel"
                                            value={newLeadData.phone}
                                            onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                                            placeholder="Telefone"
                                            className="w-full px-4 py-3 bg-white dark:bg-white/10 border-none rounded-xl text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={createLead}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all"
                                    >
                                        <span className="material-symbols-outlined">check</span>
                                        Cadastrar e Selecionar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Equipment Selection */}
                        <div>
                            <h3 className="text-sm font-bold text-[#161118] dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg">speaker</span>
                                Equipamentos
                            </h3>

                            <div className="bg-[#f3f0f4] dark:bg-white/5 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-[#7c6189]">Selecione os equipamentos para este evento</p>
                                    <button
                                        onClick={() => setShowEquipmentModal(true)}
                                        className="text-primary text-sm font-bold hover:underline"
                                    >
                                        + Adicionar
                                    </button>
                                </div>

                                {selectedEquipment.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedEquipment.map(item => (
                                            <div key={item.id} className="flex items-center justify-between bg-white dark:bg-white/5 p-3 rounded-lg">
                                                <span className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-slate-500">{item.quantity}x</span>
                                                    <button
                                                        onClick={() => removeEquipment(item.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <span className="material-symbols-outlined text-base">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-4 border-2 border-dashed border-[#e2dbe6] dark:border-[#31253a] rounded-xl">
                                        <p className="text-xs text-[#7c6189]">Nenhum equipamento selecionado</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Descrição/Observações</label>
                            <textarea
                                value={eventData.description}
                                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                rows={3}
                                placeholder="Detalhes adicionais do evento..."
                                className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Equipment Picker Modal (Nested) */}
                {showEquipmentModal && (
                    <div className="absolute inset-0 z-[60] bg-white dark:bg-[#1a141f] flex flex-col animate-in slide-in-from-bottom">
                        <div className="p-6 border-b border-[#e2dbe6] dark:border-[#31253a] flex items-center justify-between">
                            <h3 className="font-bold text-lg text-[#161118] dark:text-white">Selecionar Equipamentos</h3>
                            <button onClick={() => setShowEquipmentModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {equipmentList.map(equip => {
                                const isSelected = selectedEquipment.find(s => s.id === equip.id);
                                return (
                                    <div key={equip.id} className="flex items-center justify-between p-3 border border-[#e2dbe6] dark:border-[#31253a] rounded-xl hover:bg-slate-50 dark:hover:bg-white/5">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{equip.name}</p>
                                            <p className="text-xs text-[#7c6189]">Disp: {equip.total - equip.in_use}</p>
                                        </div>
                                        {isSelected ? (
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => updateEquipmentQuantity(equip.id, -1)} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-300">-</button>
                                                <span className="font-bold w-4 text-center">{isSelected.quantity}</span>
                                                <button onClick={() => updateEquipmentQuantity(equip.id, 1)} className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold hover:bg-primary-hover">+</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => addEquipment(equip)}
                                                className="px-4 py-2 bg-primary/10 text-primary font-bold text-sm rounded-lg hover:bg-primary/20"
                                            >
                                                Adicionar
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 border-t border-[#e2dbe6] dark:border-[#31253a]">
                            <button onClick={() => setShowEquipmentModal(false)} className="w-full py-3 bg-primary text-white font-bold rounded-xl">Concluir Seleção</button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-[#e2dbe6] dark:border-[#31253a]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                        <button onClick={onClose} className="px-3 py-3 text-sm font-bold text-[#7c6189] hover:text-[#161118] transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 col-span-2 sm:col-span-1 order-last sm:order-first">
                            Cancelar
                        </button>

                        <button
                            onClick={() => createEvent('RASCUNHO')}
                            disabled={loading || !eventData.title || !eventData.event_date}
                            className="flex items-center justify-center gap-1.5 px-3 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 rounded-xl text-xs md:text-sm font-bold transition-all disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-base md:text-lg">edit_note</span>
                            Rascunho
                        </button>

                        <button
                            onClick={() => createEvent('ORÇAMENTO')}
                            disabled={loading || !eventData.title || !eventData.event_date}
                            className="flex items-center justify-center gap-1.5 px-3 py-3 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl text-xs md:text-sm font-bold transition-all disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-base md:text-lg">request_quote</span>
                            Orçamento
                        </button>

                        <button
                            onClick={() => createEvent('CONFIRMADO')}
                            disabled={loading || !eventData.title || !eventData.event_date}
                            className="flex items-center justify-center gap-1.5 px-3 py-3 bg-primary text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span className="material-symbols-outlined text-base md:text-lg">check_circle</span>
                            )}
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default NewEventModal;
