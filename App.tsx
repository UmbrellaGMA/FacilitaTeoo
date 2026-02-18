import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import EquipmentView from './pages/Equipment';
import ContractsView from './pages/Contracts';
import CalendarView from './pages/Calendar';
import EventsView from './pages/Events';
import SettingsView from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Auth from './pages/Auth';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { ViewType } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkSubscription(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkSubscription(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSubscription = async (userId: string) => {
    try {
      // 1. Check User Role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, created_at')
        .eq('id', userId)
        .single();

      const master = profile?.role === 'MASTER';
      setIsMaster(master);

      if (master) {
        setSubscriptionStatus('active');
        return;
      }

      // 2. Check Subscription
      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('status, expires_at')
        .eq('user_id', userId)
        .single();

      if (sub) {
        setSubscriptionStatus(sub.status);
        setSubscriptionExpiry(sub.expires_at);
      } else {
        // No subscription found - check if within free 30-day trial period
        // Use profile created_at or auth user created_at as fallback
        const { data: { user } } = await supabase.auth.getUser();
        const createdAtStr = profile?.created_at || user?.created_at;
        const createdAt = createdAtStr ? new Date(createdAtStr) : null;

        if (createdAt) {
          const trialEnd = new Date(createdAt);
          trialEnd.setDate(trialEnd.getDate() + 30);
          if (new Date() < trialEnd) {
            setSubscriptionStatus('trialing');
            setSubscriptionExpiry(trialEnd.toISOString());
          } else {
            setSubscriptionStatus('inactive');
          }
        } else {
          // Cannot determine creation date, grant trial access
          setSubscriptionStatus('trialing');
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAccessBlocked = () => {
    if (isMaster) return false;

    // Statuses that are considered "good"
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
      // Check if actually expired but status not updated (safety check)
      if (subscriptionExpiry && new Date(subscriptionExpiry) < new Date()) {
        return true;
      }
      return false;
    }

    return true; // Block anything else (inactive, suspended, expired, canceled)
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard onViewChange={setActiveView} />;
      case 'clients': return <Clients />;
      case 'equipment': return <EquipmentView />;
      case 'contracts': return <ContractsView />;
      case 'calendar': return <CalendarView />;
      case 'events': return <EventsView />;
      case 'settings': return <SettingsView session={session} onViewChange={setActiveView} />;
      case 'admin': return <AdminPanel />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Public pages (accessible without login)
  const pathname = window.location.pathname;
  if (pathname === '/privacidade') {
    return <PrivacyPolicy />;
  }
  if (pathname === '/termos') {
    return <TermsOfService />;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden font-display">
      {/* Mobile Toggle Button (Visible only on small screens) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-primary text-white p-4 rounded-full shadow-2xl"
      >
        <span className="material-symbols-outlined">
          {isSidebarOpen ? 'close' : 'menu'}
        </span>
      </button>

      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar activeView={activeView} session={session} onViewChange={setActiveView} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Payment Blocking Blocking Overlay */}
      {isAccessBlocked() && activeView !== 'settings' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 max-w-lg w-full text-center border border-white/20 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <span className="material-symbols-outlined text-red-500 text-5xl">lock_open</span>
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Acesso Suspenso</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed">
              Sua assinatura expirou ou está suspensa. Para continuar utilizando todos os recursos do <strong>Facilita Teoo</strong>, por favor regularize o pagamento.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setActiveView('settings')}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-hover hover:-translate-y-0.5 transition-all text-lg"
              >
                Pagar Pendências
              </button>

              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-sm"
              >
                Sair da Conta
              </button>
            </div>

            <p className="mt-8 text-slate-400 text-xs flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">support_agent</span>
              Dúvidas? Entre em contato com nosso suporte
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
