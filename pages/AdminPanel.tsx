import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlatformSettings } from '../types';
import { formatCurrency, parseCurrencyToNumber } from '../lib/formatters';


type AdminTab = 'users' | 'settings' | 'plans' | 'contacts' | 'notifications' | 'tutorials';

interface HelpContact {
    id: string;
    type: 'email' | 'whatsapp' | 'phone' | 'link';
    label: string;
    description?: string;
    value: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'update';
    is_active: boolean;
    created_at: string;
}

interface Tutorial {
    id: string;
    title: string;
    description?: string;
    video_url?: string;
    thumbnail_url?: string;
    category: string;
    sort_order: number;
    is_active: boolean;
}

interface SubscriptionPlan {
    id: string;
    name: string;
    description?: string;
    price: number;
    interval: string;
    features: string[];
    is_active: boolean;
}

// Interface matching the RPC return structure
interface AdminUserData {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    cpf: string | null;
    role: string;
    status: string;
    is_deletable: boolean;
    created_at: string;
    events_count: number;
    contracts_count: number;
    subscription_status: string | null;
    plan_name: string | null;
}

const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [users, setUsers] = useState<AdminUserData[]>([]);
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [helpContacts, setHelpContacts] = useState<HelpContact[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Search and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // New plan form
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [newPlan, setNewPlan] = useState({ name: '', description: '', price: 0, interval: 'monthly' });
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    // Edit User Modal State
    const [editingUser, setEditingUser] = useState<AdminUserData | null>(null);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [editFormData, setEditFormData] = useState({ email: '', password: '' });

    // Activation Modal State
    const [showActivationModal, setShowActivationModal] = useState(false);
    const [activationData, setActivationData] = useState({ userId: '', planId: '', durationDays: 30 });

    // New contact/notification/tutorial forms
    const [showContactForm, setShowContactForm] = useState(false);
    const [newContact, setNewContact] = useState({ type: 'email' as HelpContact['type'], label: '', description: '', value: '', icon: 'support_agent', sort_order: 0 });
    const [showNotifForm, setShowNotifForm] = useState(false);
    const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'info' as Notification['type'] });
    const [showTutorialForm, setShowTutorialForm] = useState(false);
    const [newTutorial, setNewTutorial] = useState({ title: '', description: '', video_url: '', category: 'geral', sort_order: 0 });

    useEffect(() => {
        fetchCurrentUser();
        fetchData();
    }, []);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserEmail(user?.email || null);
    };

    const fetchData = async () => {
        setLoading(true);

        try {
            // Fetch users via RPC
            const { data: usersData, error: usersError } = await supabase.rpc('get_admin_users_data');

            if (usersError) throw usersError;
            if (usersData) setUsers(usersData);

            // Fetch settings
            const { data: settingsData } = await supabase
                .from('platform_settings')
                .select('*')
                .single();
            if (settingsData) setSettings(settingsData);

            // Fetch plans
            const { data: plansData } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price', { ascending: true });
            if (plansData) setPlans(plansData);

            // Fetch help contacts
            const { data: contactsData } = await supabase
                .from('help_contacts')
                .select('*')
                .order('sort_order', { ascending: true });
            if (contactsData) setHelpContacts(contactsData);

            // Fetch notifications
            const { data: notifsData } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });
            if (notifsData) setNotifications(notifsData);

            // Fetch tutorials
            const { data: tutorialsData } = await supabase
                .from('tutorials')
                .select('*')
                .order('sort_order', { ascending: true });
            if (tutorialsData) setTutorials(tutorialsData);

        } catch (error) {
            console.error('Error fetching admin data:', error);
            showMessage('error', 'Erro ao carregar dados do painel.');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    // Edge Function Call for Sensitive Actions
    const callAdminAction = async (action: string, payload: any) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { error: 'No session' };

        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, userId: editingUser?.id, payload }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro na requisição');
            return { data };
        } catch (error: any) {
            return { error: error.message };
        }
    };

    // User Management
    const updateUserStatus = async (userId: string, status: string) => {
        const { error } = await supabase
            .from('user_profiles')
            .update({ status })
            .eq('id', userId);

        if (error) {
            showMessage('error', 'Erro ao atualizar status');
        } else {
            showMessage('success', 'Status atualizado');
            fetchData();
        }
    };

    const handleEditUserSave = async () => {
        if (!editingUser) return;
        setSaving(true);

        try {
            if (editFormData.email && editFormData.email !== editingUser.email) {
                const { error } = await callAdminAction('update_user_auth_email', { email: editFormData.email });
                if (error) throw new Error(error);

                // Update profile as well
                await supabase.from('user_profiles').update({ email: editFormData.email }).eq('id', editingUser.id);
            }

            if (editFormData.password) {
                const { error } = await callAdminAction('update_user_auth_password', { password: editFormData.password });
                if (error) throw new Error(error);
            }

            showMessage('success', 'Dados do usuário atualizados');
            setShowEditUserModal(false);
            setEditFormData({ email: '', password: '' });
            fetchData();
        } catch (error: any) {
            console.error(error);
            showMessage('error', `Erro: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const toggleSubscription = async (user: AdminUserData) => {
        if (user.subscription_status === 'active' || user.subscription_status === 'trialing') {
            if (!confirm(`Deseja cancelar a assinatura ${user.subscription_status === 'trialing' ? 'de avaliação ' : ''}deste usuário?`)) return;

            const { error } = await supabase
                .from('user_subscriptions')
                .update({ status: 'canceled' })
                .eq('user_id', user.id);

            if (error) showMessage('error', 'Erro ao cancelar assinatura');
            else {
                showMessage('success', 'Assinatura cancelada');
                fetchData();
            }
        } else {
            // Open Activation Modal
            if (plans.length === 0) {
                showMessage('error', 'Crie um plano antes de ativar assinaturas manualmente.');
                return;
            }
            setActivationData({
                userId: user.id,
                planId: plans[0].id,
                durationDays: 30
            });
            setShowActivationModal(true);
        }
    };

    const activateSubscription = async () => {
        if (!activationData.userId || !activationData.planId) return;

        setSaving(true);
        try {
            // Check if subscription record exists
            const { data: existingSub } = await supabase
                .from('user_subscriptions')
                .select('id')
                .eq('user_id', activationData.userId)
                .single();

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + parseInt(activationData.durationDays.toString()));

            let error;
            if (existingSub) {
                const res = await supabase.from('user_subscriptions').update({
                    status: 'active',
                    plan_id: activationData.planId,
                    starts_at: startDate.toISOString(),
                    expires_at: endDate.toISOString()
                }).eq('user_id', activationData.userId);
                error = res.error;
            } else {
                const res = await supabase.from('user_subscriptions').insert({
                    user_id: activationData.userId,
                    plan_id: activationData.planId,
                    status: 'active',
                    starts_at: startDate.toISOString(),
                    expires_at: endDate.toISOString()
                });
                error = res.error;
            }

            if (error) throw error;

            showMessage('success', 'Assinatura ativada com sucesso');
            setShowActivationModal(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            showMessage('error', 'Erro ao ativar assinatura: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteUser = async (user: AdminUserData) => {
        if (!user.is_deletable) {
            showMessage('error', 'Este usuário não pode ser excluído');
            return;
        }

        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showMessage('error', 'Sessão expirada. Faça login novamente.');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'delete_user', userId: user.id, payload: {} }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao excluir usuário');

            showMessage('success', 'Usuário excluído com sucesso');
            fetchData();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            showMessage('error', error.message || 'Erro ao excluir usuário');
        }
    };

    // Settings Management
    const saveSettings = async () => {
        if (!settings) return;
        setSaving(true);

        const { error } = await supabase
            .from('platform_settings')
            .update({
                ...settings,
                updated_at: new Date().toISOString()
            })
            .eq('id', settings.id);

        setSaving(false);
        if (error) {
            showMessage('error', 'Erro ao salvar configurações');
        } else {
            showMessage('success', 'Configurações salvas');
        }
    };

    // Plans Management
    const createPlan = async () => {
        const { error } = await supabase
            .from('subscription_plans')
            .insert({
                name: newPlan.name,
                description: newPlan.description,
                price: newPlan.price,
                interval: newPlan.interval
            });

        if (error) {
            showMessage('error', 'Erro ao criar plano');
        } else {
            showMessage('success', 'Plano criado');
            setShowPlanForm(false);
            setNewPlan({ name: '', description: '', price: 0, interval: 'monthly' });
            fetchData();
        }
    };

    const togglePlanStatus = async (planId: string, isActive: boolean) => {
        const { error } = await supabase
            .from('subscription_plans')
            .update({ is_active: !isActive })
            .eq('id', planId);

        if (!error) fetchData();
    };

    const deletePlan = async (planId: string) => {
        const { error } = await supabase
            .from('subscription_plans')
            .delete()
            .eq('id', planId);

        if (!error) {
            showMessage('success', 'Plano excluído');
            fetchData();
        }
    };

    // Help contacts CRUD
    const createContact = async () => {
        const { error } = await supabase.from('help_contacts').insert({ ...newContact, is_active: true });
        if (error) { showMessage('error', 'Erro ao criar contato'); } else {
            showMessage('success', 'Contato criado'); setShowContactForm(false);
            setNewContact({ type: 'email', label: '', description: '', value: '', icon: 'support_agent', sort_order: 0 });
            fetchData();
        }
    };
    const deleteContact = async (id: string) => {
        const { error } = await supabase.from('help_contacts').delete().eq('id', id);
        if (!error) { showMessage('success', 'Contato excluído'); fetchData(); }
    };

    // Notifications CRUD
    const createNotification = async () => {
        const { error } = await supabase.from('notifications').insert({ ...newNotif, is_active: true });
        if (error) { showMessage('error', 'Erro ao criar notificação'); } else {
            showMessage('success', 'Notificação criada'); setShowNotifForm(false);
            setNewNotif({ title: '', message: '', type: 'info' }); fetchData();
        }
    };
    const toggleNotification = async (id: string, isActive: boolean) => {
        await supabase.from('notifications').update({ is_active: !isActive }).eq('id', id);
        fetchData();
    };
    const deleteNotification = async (id: string) => {
        const { error } = await supabase.from('notifications').delete().eq('id', id);
        if (!error) { showMessage('success', 'Notificação excluída'); fetchData(); }
    };

    // Tutorials CRUD
    const createTutorial = async () => {
        const { error } = await supabase.from('tutorials').insert({ ...newTutorial, is_active: true });
        if (error) { showMessage('error', 'Erro ao criar tutorial'); } else {
            showMessage('success', 'Tutorial criado'); setShowTutorialForm(false);
            setNewTutorial({ title: '', description: '', video_url: '', category: 'geral', sort_order: 0 }); fetchData();
        }
    };
    const toggleTutorial = async (id: string, isActive: boolean) => {
        await supabase.from('tutorials').update({ is_active: !isActive }).eq('id', id);
        fetchData();
    };
    const deleteTutorial = async (id: string) => {
        const { error } = await supabase.from('tutorials').delete().eq('id', id);
        if (!error) { showMessage('success', 'Tutorial excluído'); fetchData(); }
    };

    const tabs = [
        { id: 'users', label: 'Usuários', icon: 'group' },
        { id: 'notifications', label: 'Notificações', icon: 'notifications' },
        { id: 'contacts', label: 'Central de Ajuda', icon: 'help' },
        { id: 'tutorials', label: 'Tutoriais', icon: 'school' },
        { id: 'settings', label: 'Configurações', icon: 'settings' },
        { id: 'plans', label: 'Planos', icon: 'loyalty' },
    ];

    // Filter and Pagination Logic
    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats Calculation
    const totalUsers = users.length;
    const activeSubscriptions = users.filter(u => u.subscription_status === 'active').length;
    // We don't have price in the RPC, so revenue calc needs to be adjusted or we rely on plan data. 
    // Simplified for now: count active subs * avg price or similar, or fetch sub details.
    // For specific revenue, the RPC could be improved, but let's estimate or skip for now to save complexity
    const monthlyRevenue = 0; // Placeholder as RPC logic for revenue is more complex

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-[#161118] dark:text-white tracking-tight">Painel Admin Master</h1>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                    <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                    {message.text}
                </div>
            )}

            {/* Stats Cards (Only visible on Users tab) */}
            {activeTab === 'users' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">group_add</span>
                        </div>
                        <div>
                            <p className="text-[#7c6189] font-medium text-sm">Total de Usuários</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-[#161118] dark:text-white">{totalUsers.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">card_membership</span>
                        </div>
                        <div>
                            <p className="text-[#7c6189] font-medium text-sm">Assinaturas Ativas</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-[#161118] dark:text-white">{activeSubscriptions.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 flex items-center gap-4 shadow-sm opacity-50">
                        <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">payments</span>
                        </div>
                        <div>
                            <p className="text-[#7c6189] font-medium text-sm">Preço Futuro</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-[#161118] dark:text-white">R$ 15,00/mês</h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar / Tabs */}
                <div className="col-span-12 md:col-span-3">
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-2 flex flex-col gap-1 sticky top-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as AdminTab)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-[#7c6189] hover:bg-[#f3f0f4] dark:hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="col-span-12 md:col-span-9">
                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-[#161118] dark:text-white">Gestão de Usuários</h2>
                                    <p className="text-sm text-[#7c6189]">Lista completa de usuários registrados no sistema</p>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7c6189]">search</span>
                                        <input
                                            type="text"
                                            placeholder="Buscar usuários..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-white/5 border-b border-[#e2dbe6] dark:border-[#31253a]">
                                                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#7c6189]">Usuário</th>
                                                <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-[#7c6189]">Dados</th>
                                                <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-[#7c6189]">Assinatura</th>
                                                <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-widest text-[#7c6189]">Status</th>
                                                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#7c6189]">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#e2dbe6] dark:divide-[#31253a]">
                                            {paginatedUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-[#f3f0f4] dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                                                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[#161118] dark:text-white text-sm">{user.full_name || 'Sem nome'}</p>
                                                                <p className="text-xs text-[#7c6189]">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300">
                                                                {user.events_count} Eventos
                                                            </span>
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                                                                {user.contracts_count} Contratos
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => toggleSubscription(user)}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${user.subscription_status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700'
                                                                : user.subscription_status === 'trialing'
                                                                    ? 'bg-amber-100 text-amber-700 hover:bg-red-100 hover:text-red-700'
                                                                    : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'
                                                                }`}
                                                        >
                                                            {user.subscription_status === 'active'
                                                                ? (user.plan_name || 'Ativo')
                                                                : user.subscription_status === 'trialing'
                                                                    ? 'Período de Avaliação'
                                                                    : 'Ativar Manualmente'
                                                            }
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                                                            disabled={!user.is_deletable}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                                : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                                                }`}
                                                        >
                                                            {user.status === 'active' ? 'ATIVO' : 'SUSPENSO'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingUser(user);
                                                                    setEditFormData({ email: user.email, password: '' });
                                                                    setShowEditUserModal(true);
                                                                }}
                                                                title="Editar Email/Senha"
                                                                className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-[#7c6189] hover:text-primary transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">key</span>
                                                            </button>
                                                            {user.is_deletable && (
                                                                <button onClick={() => deleteUser(user)} title="Excluir" className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[#7c6189] hover:text-red-500 transition-all">
                                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Footer */}
                                <div className="p-4 border-t border-[#e2dbe6] dark:border-[#31253a] flex items-center justify-between">
                                    <p className="text-sm text-[#7c6189]">
                                        Mostrando <span className="font-bold">{paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="font-bold">{filteredUsers.length}</span> usuários
                                    </p>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2dbe6] dark:border-[#31253a] text-[#7c6189] hover:bg-[#f3f0f4] dark:hover:bg-white/5 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold ${currentPage === page
                                                    ? 'bg-primary text-white'
                                                    : 'border border-[#e2dbe6] dark:border-[#31253a] text-[#7c6189] hover:bg-[#f3f0f4] dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2dbe6] dark:border-[#31253a] text-[#7c6189] hover:bg-[#f3f0f4] dark:hover:bg-white/5 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && settings && (
                        <div className="space-y-6">
                            {/* Site Info */}
                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6">
                                <h2 className="text-lg font-bold text-[#161118] dark:text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">language</span>
                                    Informações do Site
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Nome do Site</label>
                                        <input
                                            type="text"
                                            value={settings.site_name}
                                            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">URL do Logo</label>
                                        <input
                                            type="text"
                                            value={settings.site_logo_url || ''}
                                            onChange={(e) => setSettings({ ...settings, site_logo_url: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Descrição do Site</label>
                                        <textarea
                                            value={settings.site_description || ''}
                                            onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SEO */}
                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6">
                                <h2 className="text-lg font-bold text-[#161118] dark:text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">search</span>
                                    Configurações de SEO
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Título SEO</label>
                                        <input
                                            type="text"
                                            value={settings.seo_title || ''}
                                            onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Descrição SEO</label>
                                        <textarea
                                            value={settings.seo_description || ''}
                                            onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Palavras-chave</label>
                                        <input
                                            type="text"
                                            value={settings.seo_keywords || ''}
                                            onChange={(e) => setSettings({ ...settings, seo_keywords: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                            placeholder="evento, gestão, contratos..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Support */}
                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6">
                                <h2 className="text-lg font-bold text-[#161118] dark:text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">support_agent</span>
                                    Suporte
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Email de Suporte</label>
                                        <input
                                            type="email"
                                            value={settings.support_email || ''}
                                            onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Telefone de Suporte</label>
                                        <input
                                            type="text"
                                            value={settings.support_phone || ''}
                                            onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-symbols-outlined">save</span>
                                    )}
                                    Salvar Configurações
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Plans Tab */}
                    {activeTab === 'plans' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowPlanForm(!showPlanForm)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary-hover transition-all"
                                >
                                    <span className="material-symbols-outlined">{showPlanForm ? 'close' : 'add'}</span>
                                    {showPlanForm ? 'Cancelar' : 'Criar Plano'}
                                </button>
                            </div>

                            {/* New Plan Form */}
                            {showPlanForm && (
                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 animate-in fade-in">
                                    <h3 className="font-bold text-[#161118] dark:text-white mb-4">Novo Plano</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <input
                                            type="text"
                                            placeholder="Nome do Plano"
                                            value={newPlan.name}
                                            onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                                            className="px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Descrição"
                                            value={newPlan.description}
                                            onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                                            className="px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Preço (R$)"
                                            value={formatCurrency(newPlan.price)}
                                            onChange={(e) => setNewPlan({ ...newPlan, price: parseCurrencyToNumber(e.target.value) })}
                                            className="px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                        />

                                        <button
                                            onClick={createPlan}
                                            className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all"
                                        >
                                            Criar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Plans List */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {plans.map((plan) => (
                                    <div key={plan.id} className={`bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 ${!plan.is_active ? 'opacity-60' : ''}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-[#161118] dark:text-white">{plan.name}</h3>
                                                <p className="text-xs text-[#7c6189]">{plan.description}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                                                    className={`p-2 rounded-lg transition-all ${plan.is_active ? 'hover:bg-amber-50 text-emerald-500 hover:text-amber-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-500'}`}
                                                >
                                                    <span className="material-symbols-outlined">{plan.is_active ? 'toggle_on' : 'toggle_off'}</span>
                                                </button>
                                                <button
                                                    onClick={() => deletePlan(plan.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-primary">{formatCurrency(plan.price)}</span>
                                            <span className="text-xs text-[#7c6189]">/{plan.interval === 'monthly' ? 'mês' : plan.interval}</span>
                                        </div>

                                    </div>
                                ))}

                                {plans.length === 0 && (
                                    <div className="col-span-3 text-center py-12">
                                        <span className="material-symbols-outlined text-6xl text-[#7c6189]/30 mb-4">loyalty</span>
                                        <h3 className="font-bold text-[#161118] dark:text-white mb-2">Nenhum plano criado</h3>
                                        <p className="text-sm text-[#7c6189]">Crie seu primeiro plano de assinatura.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-[#161118] dark:text-white">Notificações do Sistema</h2>
                                    <p className="text-sm text-[#7c6189]">Envie avisos e comunicados para todos os usuários</p>
                                </div>
                                <button onClick={() => setShowNotifForm(!showNotifForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Nova Notificação
                                </button>
                            </div>

                            {showNotifForm && (
                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Título</label>
                                        <input value={newNotif.title} onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm" placeholder="Ex: Atualização do sistema" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Mensagem</label>
                                        <textarea value={newNotif.message} onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm min-h-[80px]" placeholder="Descrição da notificação..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Tipo</label>
                                        <select value={newNotif.type} onChange={(e) => setNewNotif({ ...newNotif, type: e.target.value as Notification['type'] })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm">
                                            <option value="info">ℹ️ Informação</option>
                                            <option value="update">🔄 Atualização</option>
                                            <option value="success">✅ Novidade</option>
                                            <option value="warning">⚠️ Aviso Importante</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowNotifForm(false)} className="px-4 py-2 text-sm text-[#7c6189]">Cancelar</button>
                                        <button onClick={createNotification} disabled={!newNotif.title || !newNotif.message} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">Publicar</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`bg-white dark:bg-white/5 rounded-xl border border-[#e2dbe6] dark:border-[#31253a] p-5 ${!notif.is_active ? 'opacity-50' : ''}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.type === 'warning' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                                                        notif.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' :
                                                            notif.type === 'update' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' :
                                                                'bg-purple-100 dark:bg-purple-500/20 text-purple-600'}`}>
                                                    <span className="material-symbols-outlined text-sm">{notif.type === 'warning' ? 'warning' : notif.type === 'success' ? 'celebration' : notif.type === 'update' ? 'update' : 'info'}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{notif.title}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                                                    <p className="text-[10px] text-slate-400 mt-2">{new Date(notif.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => toggleNotification(notif.id, notif.is_active)} className={`p-2 rounded-lg transition-colors ${notif.is_active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                    <span className="material-symbols-outlined text-sm">{notif.is_active ? 'visibility' : 'visibility_off'}</span>
                                                </button>
                                                <button onClick={() => deleteNotification(notif.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {notifications.length === 0 && (
                                    <div className="text-center py-12">
                                        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">notifications_off</span>
                                        <p className="text-sm text-[#7c6189] mt-3">Nenhuma notificação enviada</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contacts Tab */}
                    {activeTab === 'contacts' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-[#161118] dark:text-white">Central de Ajuda - Contatos</h2>
                                    <p className="text-sm text-[#7c6189]">Configure os contatos que aparecem na Central de Ajuda para os usuários</p>
                                </div>
                                <button onClick={() => setShowContactForm(!showContactForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Novo Contato
                                </button>
                            </div>

                            {showContactForm && (
                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Tipo</label>
                                            <select value={newContact.type} onChange={(e) => setNewContact({ ...newContact, type: e.target.value as HelpContact['type'] })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm">
                                                <option value="email">📧 Email</option>
                                                <option value="whatsapp">💬 WhatsApp</option>
                                                <option value="phone">📞 Telefone</option>
                                                <option value="link">🔗 Link</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Ícone (Material Symbol)</label>
                                            <input value={newContact.icon} onChange={(e) => setNewContact({ ...newContact, icon: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm" placeholder="Ex: support_agent" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Título</label>
                                        <input value={newContact.label} onChange={(e) => setNewContact({ ...newContact, label: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm" placeholder="Ex: Suporte Técnico" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Descrição</label>
                                        <input value={newContact.description} onChange={(e) => setNewContact({ ...newContact, description: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm" placeholder="Ex: Entre em contato para dúvidas" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Valor (email/telefone/link)</label>
                                        <input value={newContact.value} onChange={(e) => setNewContact({ ...newContact, value: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm" placeholder="Ex: suporte@empresa.com" />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowContactForm(false)} className="px-4 py-2 text-sm text-[#7c6189]">Cancelar</button>
                                        <button onClick={createContact} disabled={!newContact.label || !newContact.value} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">Salvar</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {helpContacts.map(contact => (
                                    <div key={contact.id} className="bg-white dark:bg-white/5 rounded-xl border border-[#e2dbe6] dark:border-[#31253a] p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${contact.type === 'email' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' :
                                                        contact.type === 'whatsapp' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' :
                                                            contact.type === 'phone' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                                                                'bg-purple-100 dark:bg-purple-500/20 text-purple-600'}`}>
                                                    <span className="material-symbols-outlined">{contact.icon}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 dark:text-white">{contact.label}</h4>
                                                        <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-white/10 text-slate-500 px-2 py-0.5 rounded-full">{contact.type}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{contact.description}</p>
                                                    <p className="text-sm text-primary font-medium mt-1">{contact.value}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => deleteContact(contact.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {helpContacts.length === 0 && (
                                    <div className="text-center py-12">
                                        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">contacts</span>
                                        <p className="text-sm text-[#7c6189] mt-3">Nenhum contato cadastrado</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tutorials Tab */}
                    {activeTab === 'tutorials' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-[#161118] dark:text-white">Tutoriais</h2>
                                    <p className="text-sm text-[#7c6189]">Gerencie vídeos e guias de ajuda para os usuários</p>
                                </div>
                                <button onClick={() => setShowTutorialForm(!showTutorialForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Novo Tutorial
                                </button>
                            </div>

                            {showTutorialForm && (
                                <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Título</label>
                                        <input value={newTutorial.title} onChange={(e) => setNewTutorial({ ...newTutorial, title: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm" placeholder="Ex: Como criar um evento" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Descrição</label>
                                        <textarea value={newTutorial.description} onChange={(e) => setNewTutorial({ ...newTutorial, description: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm min-h-[60px]" placeholder="Breve descrição do tutorial" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">URL do Vídeo (YouTube)</label>
                                            <input value={newTutorial.video_url} onChange={(e) => setNewTutorial({ ...newTutorial, video_url: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm" placeholder="https://youtube.com/..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Categoria</label>
                                            <select value={newTutorial.category} onChange={(e) => setNewTutorial({ ...newTutorial, category: e.target.value })} className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm">
                                                <option value="geral">Geral</option>
                                                <option value="eventos">Eventos</option>
                                                <option value="contratos">Contratos</option>
                                                <option value="equipamentos">Equipamentos</option>
                                                <option value="financeiro">Financeiro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowTutorialForm(false)} className="px-4 py-2 text-sm text-[#7c6189]">Cancelar</button>
                                        <button onClick={createTutorial} disabled={!newTutorial.title} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">Salvar</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tutorials.map(tutorial => (
                                    <div key={tutorial.id} className={`bg-white dark:bg-white/5 rounded-xl border border-[#e2dbe6] dark:border-[#31253a] overflow-hidden ${!tutorial.is_active ? 'opacity-50' : ''}`}>
                                        {tutorial.video_url && (
                                            <div className="aspect-video bg-slate-100 dark:bg-white/5 flex items-center justify-center relative">
                                                <iframe
                                                    src={tutorial.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                    title={tutorial.title}
                                                />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tutorial.category}</span>
                                                    <h4 className="font-bold text-slate-900 dark:text-white mt-2">{tutorial.title}</h4>
                                                    {tutorial.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tutorial.description}</p>}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => toggleTutorial(tutorial.id, tutorial.is_active)} className={`p-1.5 rounded-lg ${tutorial.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        <span className="material-symbols-outlined text-sm">{tutorial.is_active ? 'visibility' : 'visibility_off'}</span>
                                                    </button>
                                                    <button onClick={() => deleteTutorial(tutorial.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {tutorials.length === 0 && (
                                <div className="text-center py-12">
                                    <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">school</span>
                                    <p className="text-sm text-[#7c6189] mt-3">Nenhum tutorial cadastrado</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit User Modal */}
            {showEditUserModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditUserModal(false)} />
                    <div className="relative bg-white dark:bg-[#1a141f] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-[#161118] dark:text-white">Editar Credenciais</h3>
                            <button onClick={() => setShowEditUserModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Email</label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                    placeholder="Novo email..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-[#7c6189] mb-2 block">Nova Senha</label>
                                <input
                                    type="password"
                                    value={editFormData.password}
                                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm"
                                    placeholder="Deixe em branco para não alterar..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowEditUserModal(false)}
                                    className="px-4 py-2 text-sm font-bold text-[#7c6189] hover:text-[#161118] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEditUserSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Activation Modal */}
            {showActivationModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowActivationModal(false)} />
                    <div className="relative bg-white dark:bg-[#1a141f] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-[#161118] dark:text-white">Ativar Assinatura Manualmente</h3>
                            <button onClick={() => setShowActivationModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Plano</label>
                                <select
                                    value={activationData.planId}
                                    onChange={(e) => setActivationData({ ...activationData, planId: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 text-[#161118] dark:text-white"
                                >
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id} className="text-black">{plan.name} - R$ {plan.price}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-2 block">Duração (Dias)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={activationData.durationDays || ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        setActivationData({ ...activationData, durationDays: raw ? parseInt(raw, 10) : 0 });
                                    }}
                                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 text-[#161118] dark:text-white"
                                />

                            </div>

                            <button
                                onClick={activateSubscription}
                                disabled={saving}
                                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors mt-4 shadow-lg shadow-emerald-500/25"
                            >
                                {saving ? 'Ativando...' : 'Confirmar Ativação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
