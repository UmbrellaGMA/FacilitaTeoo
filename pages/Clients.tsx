import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    interest: string | null;
    status: string | null;
    created_at: string;
    total_value?: number;
    events_count?: number;
}

interface Event {
    id: string;
    title: string;
    event_date: string;
    value: number;
    status: string;
    type: string;
}

interface Contract {
    id: string;
    client_name: string;
    type: string;
    value: number;
    status: string;
    created_at: string;
    share_token?: string;
    signature_data?: string;
    signed_at?: string;
}

const Clients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientEvents, setClientEvents] = useState<Event[]>([]);
    const [clientContracts, setClientContracts] = useState<Contract[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        phone: '',
        interest: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);

        // Buscar clientes com agregação de eventos
        const { data: clientsData, error } = await supabase
            .from('leads')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching clients:', error);
            setLoading(false);
            return;
        }

        // Para cada cliente, buscar o total de eventos e valores
        const clientsWithStats = await Promise.all(
            (clientsData || []).map(async (client) => {
                const { data: eventsData } = await supabase
                    .from('events')
                    .select('value')
                    .eq('lead_id', client.id);

                const totalValue = eventsData?.reduce((sum, e) => sum + (e.value || 0), 0) || 0;
                const eventsCount = eventsData?.length || 0;

                return {
                    ...client,
                    total_value: totalValue,
                    events_count: eventsCount
                };
            })
        );

        setClients(clientsWithStats);
        setLoading(false);
    };

    const fetchClientDetails = async (client: Client) => {
        setLoadingDetails(true);
        setSelectedClient(client);
        setShowModal(true);

        // Buscar eventos do cliente
        const { data: events } = await supabase
            .from('events')
            .select('id, title, event_date, value, status, type')
            .eq('lead_id', client.id)
            .order('event_date', { ascending: false });

        setClientEvents(events || []);

        // Buscar contratos vinculados ao cliente por lead_id
        const { data: contracts } = await supabase
            .from('contracts')
            .select('id, client_name, type, value, status, created_at, share_token, signature_data, signed_at')
            .eq('lead_id', client.id)
            .order('created_at', { ascending: false });

        setClientContracts(contracts || []);
        setLoadingDetails(false);
    };

    const handleAddClient = async () => {
        if (!newClient.name.trim()) return;

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        setSaving(true);
        const { error } = await supabase
            .from('leads')
            .insert({
                name: newClient.name,
                email: newClient.email || null,
                phone: newClient.phone || null,
                interest: newClient.interest || null,
                status: 'active',
                user_id: user?.id,
            });

        if (!error) {
            setNewClient({ name: '', email: '', phone: '', interest: '' });
            setShowAddModal(false);
            fetchClients();
        }
        setSaving(false);
    };

    const handleDeleteClient = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (!error) {
            setShowModal(false);
            fetchClients();
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.includes(searchQuery)
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'confirmado':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'pending':
            case 'pendente':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            case 'cancelled':
            case 'cancelado':
                return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400';
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Estatísticas gerais
    const totalClients = clients.length;
    const totalRevenue = clients.reduce((sum, c) => sum + (c.total_value || 0), 0);
    const totalEvents = clients.reduce((sum, c) => sum + (c.events_count || 0), 0);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#161118] dark:text-white tracking-tight">Clientes</h1>
                    <p className="text-[#7c6189] dark:text-purple-200/70 text-sm md:text-base mt-1">
                        Gerencie seus clientes e acompanhe o histórico de aluguéis.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-white font-bold px-4 md:px-6 py-2.5 md:py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm md:text-base w-full md:w-auto justify-center"
                >
                    <span className="material-symbols-outlined text-lg md:text-xl">person_add</span>
                    <span className="hidden sm:inline">Novo</span> Cliente
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">group</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalClients}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total de Clientes</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">payments</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Receita Total</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">event</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalEvents}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total de Eventos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome, email ou telefone..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
            </div>

            {/* Clients Table */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">person_off</span>
                        <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium">
                            {searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-4 text-primary font-bold hover:underline"
                            >
                                Adicionar primeiro cliente
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contato</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Eventos</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Alugado</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Desde</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => fetchClientDetails(client)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm">
                                                    {getInitials(client.name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{client.name}</p>
                                                    {client.interest && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{client.interest}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {client.email && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">mail</span>
                                                        {client.email}
                                                    </p>
                                                )}
                                                {client.phone && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">phone</span>
                                                        {client.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full text-sm font-bold">
                                                <span className="material-symbols-outlined text-sm">event</span>
                                                {client.events_count || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(client.total_value || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                            {formatDate(client.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fetchClientDetails(client);
                                                }}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-slate-500">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Client Details Modal */}
            {showModal && selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white dark:bg-[#1a141f] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-xl">
                                    {getInitials(selectedClient.name)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedClient.name}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Cliente desde {formatDate(selectedClient.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDeleteClient(selectedClient.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Excluir cliente"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                            {loadingDetails ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Client Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Email</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {selectedClient.email || 'Não informado'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Telefone</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {selectedClient.phone || 'Não informado'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Interesse</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {selectedClient.interest || 'Não informado'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold mb-1">Total Alugado</p>
                                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                                {formatCurrency(selectedClient.total_value || 0)}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-200 dark:border-blue-500/20">
                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-1">Total de Eventos</p>
                                            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
                                                {selectedClient.events_count || 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Events History */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">event</span>
                                            Histórico de Eventos
                                        </h3>
                                        {clientEvents.length === 0 ? (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 bg-slate-50 dark:bg-white/5 rounded-xl">
                                                Nenhum evento registrado
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {clientEvents.map((event) => (
                                                    <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-primary">celebration</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white">{event.title}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {event.type} • {formatDate(event.event_date)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(event.value || 0)}</p>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getStatusColor(event.status)}`}>
                                                                {event.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Contracts */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">description</span>
                                            Contratos
                                        </h3>
                                        {clientContracts.length === 0 ? (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 bg-slate-50 dark:bg-white/5 rounded-xl">
                                                Nenhum contrato vinculado
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {clientContracts.map((contract) => (
                                                    <div key={contract.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${contract.status === 'signed'
                                                                    ? 'bg-emerald-100 dark:bg-emerald-500/20'
                                                                    : 'bg-purple-100 dark:bg-purple-500/20'
                                                                    }`}>
                                                                    <span className={`material-symbols-outlined ${contract.status === 'signed'
                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                        : 'text-purple-600 dark:text-purple-400'
                                                                        }`}>
                                                                        {contract.status === 'signed' ? 'verified' : 'description'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 dark:text-white">{contract.type || 'Contrato'}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                        Criado em {formatDate(contract.created_at)}
                                                                        {contract.signed_at && ` • Assinado em ${formatDate(contract.signed_at)}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(contract.value || 0)}</p>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${contract.status === 'signed'
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                                    : contract.status === 'pending'
                                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400'
                                                                    }`}>
                                                                    {contract.status === 'signed' ? 'ASSINADO' : contract.status === 'pending' ? 'PENDENTE' : contract.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Action buttons */}
                                                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                                                            {contract.share_token && contract.status !== 'signed' && (
                                                                <button
                                                                    onClick={() => {
                                                                        const link = `${window.location.origin}/assinar/${contract.share_token}`;
                                                                        navigator.clipboard.writeText(link);
                                                                        alert('Link de assinatura copiado!');
                                                                    }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">link</span>
                                                                    Copiar Link de Assinatura
                                                                </button>
                                                            )}
                                                            {contract.status === 'signed' && contract.signature_data && (
                                                                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                                                    <span className="material-symbols-outlined text-sm">verified</span>
                                                                    Contrato assinado eletronicamente
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white dark:bg-[#1a141f] rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
                        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person_add</span>
                                Novo Cliente
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Nome *</label>
                                <input
                                    type="text"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                    placeholder="Nome completo"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Email</label>
                                <input
                                    type="email"
                                    value={newClient.email}
                                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                    placeholder="email@exemplo.com"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Telefone</label>
                                <input
                                    type="tel"
                                    value={newClient.phone}
                                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                    placeholder="(11) 99999-9999"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 block">Interesse</label>
                                <select
                                    value={newClient.interest}
                                    onChange={(e) => setNewClient({ ...newClient, interest: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Casamento">Casamento</option>
                                    <option value="Aniversário">Aniversário</option>
                                    <option value="Corporativo">Corporativo</option>
                                    <option value="Formatura">Formatura</option>
                                    <option value="Debutante">Debutante</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddClient}
                                disabled={saving || !newClient.name.trim()}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-sm">check</span>
                                )}
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
