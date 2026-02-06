import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, PlatformSettings } from '../types';

type AdminTab = 'users' | 'settings' | 'plans';

interface SubscriptionPlan {
    id: string;
    name: string;
    description?: string;
    price: number;
    interval: string;
    features: string[];
    is_active: boolean;
}

const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // New plan form
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [newPlan, setNewPlan] = useState({ name: '', description: '', price: 0, interval: 'monthly' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        // Fetch users
        const { data: usersData } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });
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

        setLoading(false);
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    // User Management
    const updateUserRole = async (userId: string, role: string) => {
        const { error } = await supabase
            .from('user_profiles')
            .update({ role })
            .eq('id', userId);

        if (error) {
            showMessage('error', 'Erro ao atualizar papel do usuário');
        } else {
            showMessage('success', 'Papel atualizado com sucesso');
            fetchData();
        }
    };

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

    const deleteUser = async (user: UserProfile) => {
        if (!user.is_deletable) {
            showMessage('error', 'Este usuário não pode ser excluído');
            return;
        }

        const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', user.id);

        if (error) {
            showMessage('error', 'Erro ao excluir usuário');
        } else {
            showMessage('success', 'Usuário excluído');
            fetchData();
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

    const tabs = [
        { id: 'users', label: 'Usuários', icon: 'group' },
        { id: 'settings', label: 'Configurações', icon: 'settings' },
        { id: 'plans', label: 'Planos', icon: 'loyalty' },
    ];

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
                    <span className="material-symbols-outlined text-3xl text-primary">admin_panel_settings</span>
                    <h1 className="text-4xl font-black text-[#161118] dark:text-white tracking-tight">Painel Master</h1>
                </div>
                <p className="text-[#7c6189] dark:text-purple-200/70 text-lg">Gerencie usuários, configurações globais e planos da plataforma.</p>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                    <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] p-2 flex gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AdminTab)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-[#7c6189] hover:bg-[#f3f0f4] dark:hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] overflow-hidden">
                    <div className="p-6 border-b border-[#e2dbe6] dark:border-[#31253a]">
                        <h2 className="text-lg font-bold text-[#161118] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">group</span>
                            Gerenciar Usuários
                        </h2>
                        <p className="text-sm text-[#7c6189] mt-1">{users.length} usuários cadastrados</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/5 border-b border-[#e2dbe6] dark:border-[#31253a]">
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#7c6189]">Usuário</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#7c6189]">Papel</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#7c6189]">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[#7c6189]">Cadastro</th>
                                    <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-[#7c6189]">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e2dbe6] dark:divide-[#31253a]">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-[#f3f0f4] dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#161118] dark:text-white">{user.full_name || 'Sem nome'}</p>
                                                    <p className="text-xs text-[#7c6189]">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                disabled={!user.is_deletable}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 ${user.role === 'MASTER' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                                                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                                            'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                                                    }`}
                                            >
                                                <option value="MASTER">MASTER</option>
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="USER">USUÁRIO</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                                                disabled={!user.is_deletable}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                                    }`}
                                            >
                                                {user.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#7c6189]">
                                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {user.is_deletable ? (
                                                <button onClick={() => deleteUser(user)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-[#7c6189] hover:text-red-500 transition-all">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            ) : (
                                                <span className="text-xs text-[#7c6189] italic">Protegido</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                    type="number"
                                    placeholder="Preço (R$)"
                                    value={newPlan.price}
                                    onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) || 0 })}
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
                                    <span className="text-3xl font-black text-primary">R$ {plan.price.toFixed(2)}</span>
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
        </div>
    );
};

export default AdminPanel;
