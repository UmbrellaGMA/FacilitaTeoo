import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import EquipmentView from './pages/Equipment';
import ContractsView from './pages/Contracts';
import MapView from './pages/Map';
import CalendarView from './pages/Calendar';
import EventsView from './pages/Events';
import SettingsView from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Auth from './pages/Auth';
import { ViewType } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard onViewChange={setActiveView} />;
      case 'clients': return <Clients />;
      case 'equipment': return <EquipmentView />;
      case 'contracts': return <ContractsView />;
      case 'map': return <MapView />;
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
    </div>
  );
};

export default App;
