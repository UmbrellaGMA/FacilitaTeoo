
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ViewType } from '../types';
import { maskCPF, maskPhone } from '../lib/formatters';
import GoogleCalendarButton from '../components/GoogleCalendarButton';


interface SettingsViewProps {
  session: Session | null;
  onViewChange?: (view: ViewType) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ session, onViewChange }) => {
  // Profile fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [eventsCount, setEventsCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Subscription states
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Load user data from session
  useEffect(() => {
    if (session?.user) {
      const metadata = session.user.user_metadata || {};
      setFullName(metadata.full_name || session.user.email?.split('@')[0] || '');
      setPhone(metadata.phone || '');
      setCpf(metadata.cpf || '');

      // Fetch events count
      fetchEventsCount();
      // Fetch user role
      fetchUserRole();
      // Fetch subscription data
      fetchSubscriptionData();
    }
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      setMessage({ type: 'success', text: 'Pagamento realizado com sucesso! Sua assinatura será ativada em breve.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'failure') {
      setMessage({ type: 'error', text: 'Pagamento falhou. Tente novamente.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoadingSubscription(true);

      // Fetch user subscription
      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', session?.user?.id)
        .single();

      if (sub) setSubscription(sub);

      // Fetch active plans (excluding free plans from the list)
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .gt('price', 0)
        .order('price');

      if (plansData) setPlans(plansData);

    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleSubscribe = async (plan: any) => {
    try {
      setMessage({ type: 'success', text: 'Processando pagamento...' });

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-mp-preference`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan,
          userEmail: currentSession.user.email,
          userId: currentSession.user.id,
          origin: window.location.origin
        }),
      });

      const data = await response.json();
      console.log('MP Response:', data); // Debug log

      if (response.ok && data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || 'Erro ao gerar link de pagamento. Verifique o console.');
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao processar assinatura' });
    }
  };

  const fetchUserRole = async () => {
    try {
      console.log('Session User ID:', session?.user?.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*') // Select all to debug
        .eq('id', session?.user?.id)
        .single();

      console.log('User Profile Fetch Result:', { data, error });

      if (data) {
        console.log('Role found:', data.role);
        setUserRole(data.role);
      } else {
        console.log('No profile found for this user.');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchEventsCount = async () => {
    try {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      setEventsCount(count || 0);
    } catch (error) {
      console.error('Error fetching events count:', error);
    }
  };

  // Update profile
  const updateProfile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
          cpf: cpf,
        }
      });
      if (authError) throw authError;

      // 2. Update Public Profile Table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName,
          phone: phone,
          cpf: cpf,
          updated_at: new Date().toISOString()
        })
        .eq('id', session?.user?.id);

      if (profileError) throw profileError;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil' });
    } finally {
      setSaving(false);
    }
  };

  // Update password
  const updatePassword = async () => {
    setMessage(null);

    // Validations
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 8 caracteres' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    setSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha' });
    } finally {
      setSavingPassword(false);
    }
  };

  // Format date for "member since"
  const formatMemberSince = () => {
    if (!session?.user?.created_at) return 'N/A';
    const date = new Date(session.user.created_at);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const userEmail = session?.user?.email || '';

  // Helper to calculate time remaining
  const getTimeRemaining = (expiryDate: string) => {
    if (!expiryDate) return '';
    const total = Date.parse(expiryDate) - Date.now();

    if (total <= 0) return 'Expirado';

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);

    if (days > 0) {
      return `${days}d ${hours}h restantes`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    } else {
      return `${minutes}m restantes`;
    }
  };

  const isPlanActive = (subscription?.status === 'active' || subscription?.status === 'trialing') &&
    (subscription?.expires_at ? new Date(subscription.expires_at) > new Date() : true);

  const canSubscribe = (planId: string) => {
    // If no subscription at all, can subscribe
    if (!subscription) return true;

    // If current plan is the same, can't subscribe (already active)
    if (subscription.plan_id === planId && isPlanActive) return false;

    // If current plan is "Plano Free" (id handled by name or checked if price is 0), allow upgrading
    if (subscription.plan?.price == 0 || subscription.status === 'trialing') return true;

    // If current plan is active and paid, disable others for now (simple logic)
    if (isPlanActive) return false;

    return true;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Configurações</h1>
        <p className="text-[#7c6189] dark:text-purple-200/70 text-sm md:text-lg mt-1">Gerencie as preferências da sua conta e da sua empresa.</p>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
          : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
          }`}>
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-medium">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card */}
        <div className="lg:col-span-4 bg-white dark:bg-white/5 rounded-3xl border border-[#e2dbe6] dark:border-white/10 p-8 flex flex-col items-center gap-6 shadow-sm">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-5xl font-bold border-4 border-white dark:border-slate-800 shadow-xl">
              {getInitials(fullName || 'U')}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{fullName || 'Usuário'}</h2>
            <p className="text-[#7c6189] dark:text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">
              {userRole === 'MASTER' ? 'Administrador Master' : (session?.user?.user_metadata?.role || 'Organizador de Eventos')}
            </p>
          </div>
          <div className="w-full pt-6 border-t border-[#e2dbe6] dark:border-white/10 flex flex-col gap-3">
            <div className="flex justify-between text-xs">
              <span className="text-[#7c6189] font-bold">Membro desde</span>
              <span className="text-slate-900 dark:text-white font-black">{formatMemberSince()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#7c6189] font-bold">Eventos Criados</span>
              <span className="text-slate-900 dark:text-white font-black">{eventsCount}</span>
            </div>
          </div>

          {/* Admin Panel Button - Visible only for MASTER users */}
          {userRole === 'MASTER' && onViewChange && (
            <button
              onClick={() => onViewChange('admin')}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] transition-all"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              Painel Master
            </button>
          )}
        </div>

        {/* Forms */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white dark:bg-white/5 rounded-3xl border border-[#e2dbe6] dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e2dbe6] dark:border-white/10 bg-slate-50/50 dark:bg-transparent">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Informações Pessoais</h3>
              <p className="text-sm text-[#7c6189]">Dados de contato e identificação.</p>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7c6189]">Nome Completo</label>
                <input
                  className="w-full rounded-xl py-3 px-4 border border-[#e2dbe6] dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7c6189]">E-mail</label>
                <input
                  className="w-full rounded-xl py-3 px-4 border border-[#e2dbe6] dark:border-white/10 bg-slate-100 dark:bg-white/3 text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  type="email"
                  value={userEmail}
                  disabled
                />
                <p className="text-[10px] text-[#7c6189]">O email não pode ser alterado</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7c6189]">Telefone</label>
                <input
                  className="w-full rounded-xl py-3 px-4 border border-[#e2dbe6] dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  maxLength={15}

                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7c6189]">CPF</label>
                <input
                  className="w-full rounded-xl py-3 px-4 border border-[#e2dbe6] dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}

                  disabled={saving}
                />
              </div>
            </div>
            <div className="px-8 pb-8 flex justify-end">
              <button
                onClick={updateProfile}
                disabled={saving}
                className="bg-primary text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-primary/25 hover:bg-primary-hover hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Salvar Perfil
                  </>
                )}
              </button>
            </div>
          </section>



          {/* Subscription Section */}
          <section className="bg-white dark:bg-white/5 rounded-3xl border border-[#e2dbe6] dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e2dbe6] dark:border-white/10 bg-slate-50/50 dark:bg-transparent">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Assinatura</h3>
              <p className="text-sm text-[#7c6189]">Gerencie seu plano e cobrança.</p>
            </div>
            <div className="p-8 space-y-6">
              {/* Current Plan Status */}
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-[#e2dbe6] dark:border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#7c6189] mb-1">Status Atual</p>
                    <div className="flex items-center gap-3">
                      {subscription?.status === 'active' || subscription?.status === 'trialing' ? (
                        <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 rounded-full text-sm">
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                          {subscription.status === 'trialing' ? 'Período de Teste' : 'Ativo'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-500/10 px-3 py-1 rounded-full text-sm">
                          <span className="material-symbols-outlined text-lg">error</span>
                          Inativo
                        </span>
                      )}
                      {subscription?.plan?.name && (
                        <span className="text-slate-900 dark:text-white font-bold text-lg">
                          Plano {subscription.plan.name}
                        </span>
                      )}
                    </div>
                    {subscription?.expires_at && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-[#7c6189]">
                          {subscription.status === 'trialing' ? 'Teste expira em: ' : 'Renova em: '}
                          <span className="font-bold">
                            {new Date(subscription.expires_at).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="text-xs font-bold text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">timer</span>
                          {getTimeRemaining(subscription.expires_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Available Plans */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Planos Disponíveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border rounded-2xl p-6 flex flex-col transition-all ${isPlanActive
                        ? 'border-[#e2dbe6] dark:border-white/10 opacity-75'
                        : 'border-[#e2dbe6] dark:border-white/10 hover:border-primary cursor-pointer'
                        }`}
                      onClick={() => !isPlanActive && handleSubscribe(plan)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-lg text-slate-900 dark:text-white">{plan.name}</h5>
                        {subscription?.plan_id === plan.id && (
                          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">Atual</span>
                        )}
                      </div>
                      <p className="text-sm text-[#7c6189] mb-4 flex-1">{plan.description}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-baseline">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {plan.price}</span>
                          <span className="text-sm text-[#7c6189]">/{plan.interval === 'monthly' ? 'mês' : plan.interval}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (canSubscribe(plan.id)) handleSubscribe(plan); }}
                          disabled={!canSubscribe(plan.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!canSubscribe(plan.id)
                            ? 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 hover:scale-[1.02]'
                            }`}
                        >
                          {subscription?.plan_id === plan.id && isPlanActive ? 'Plano Ativo' : 'Assinar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Integrations Section */}
          <section className="bg-white dark:bg-white/5 rounded-3xl border border-[#e2dbe6] dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e2dbe6] dark:border-white/10 bg-slate-50/50 dark:bg-transparent">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Integrações</h3>
              <p className="text-sm text-[#7c6189]">Conecte serviços externos à sua conta.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-[#e2dbe6] dark:border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-white/10">
                      <svg className="w-7 h-7" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Google Calendar</h4>
                      <p className="text-xs text-[#7c6189]">Sincronize seus eventos automaticamente com o Google Agenda.</p>
                    </div>
                  </div>
                  <GoogleCalendarButton />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-white/5 rounded-3xl border border-[#e2dbe6] dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e2dbe6] dark:border-white/10 bg-slate-50/50 dark:bg-transparent">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Segurança</h3>
              <p className="text-sm text-[#7c6189]">Mantenha sua conta protegida.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#7c6189]">Nova Senha</label>
                  <input
                    className="w-full rounded-xl py-3 px-4 border border-[#e2dbe6] dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={savingPassword}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#7c6189]">Confirmar Senha</label>
                  <input
                    className="w-full rounded-xl py-3 px-4 border border-[#e2dbe6] dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={savingPassword}
                  />
                </div>
              </div>
            </div>
            <div className="px-8 pb-8 flex justify-end">
              <button
                onClick={updatePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="bg-slate-700 text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-slate-500/25 hover:bg-slate-800 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingPassword ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Alterando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">lock</span>
                    Alterar Senha
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div >
  );
};

export default SettingsView;
