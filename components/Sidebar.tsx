
import React, { useState, useEffect } from 'react';
import { ViewType, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import NewEventModal from './NewEventModal';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  [key: string]: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, onClose }) => {
  const [showEventModal, setShowEventModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserProfile({ ...data, email: user.email || data.email });
      } else {
        setUserProfile({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
          role: (user.user_metadata?.role as UserRole) || 'USER'
        });
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleEventCreated = () => {
    setShowEventModal(false);
  };

  // Only include admin panel for MASTER users
  const baseMenuItems: { id: ViewType; label: string; icon: string; special?: boolean; masterOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'calendar', label: 'Calendário', icon: 'calendar_month' },
    { id: 'clients', label: 'Clientes', icon: 'group' },
    { id: 'equipment', label: 'Equipamentos', icon: 'inventory_2' },
    { id: 'contracts', label: 'Contratos', icon: 'description' },
    { id: 'events', label: 'Eventos', icon: 'event_note' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
    { id: 'admin', label: 'Painel Master', icon: 'admin_panel_settings', special: true, masterOnly: true },
  ];

  // Filter out masterOnly items if user is not MASTER
  const menuItems = baseMenuItems.filter(item => {
    if (item.masterOnly && userProfile?.role !== 'MASTER') {
      return false;
    }
    return true;
  });

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role?: UserRole) => {
    const labels: Record<UserRole, string> = {
      MASTER: 'MASTER',
      ADMIN: 'ADMIN',
      USER: 'USUÁRIO',
    };
    return labels[role || 'USER'];
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-[#e2dbe6] dark:border-[#31253a] 
        bg-white dark:bg-background-dark flex flex-col justify-between p-4 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          {/* Logo */}
          <div className="flex items-center justify-center px-4 py-2">
            <img src="/logo.png" alt="Facilita Teoo" className="w-full max-w-[180px] h-auto object-contain" />
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <React.Fragment key={item.id}>
                {item.special && <div className="my-2 border-t border-[#e2dbe6] dark:border-[#31253a]"></div>}
                <button
                  onClick={() => {
                    onViewChange(item.id);
                    onClose();
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${item.special
                      ? activeView === item.id
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-l-4 border-purple-500'
                        : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10'
                      : activeView === item.id
                        ? 'bg-primary/10 text-primary border-l-4 border-primary'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-[#f3f0f4] dark:hover:bg-white/5 hover:text-[#161118] dark:hover:text-white'}
                  `}
                >
                  <span className={`material-symbols-outlined text-[24px] ${activeView === item.id ? 'material-symbols-fill' : ''}`}>
                    {item.icon}
                  </span>
                  <span className={`text-sm ${activeView === item.id ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Bottom Action */}
        <div className="flex flex-col gap-4">
          {userProfile?.role === 'MASTER' && (
            <button
              onClick={() => {
                onViewChange('admin');
                onClose();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all"
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span className="text-sm">Acessar Painel</span>
            </button>
          )}

          <button
            onClick={() => setShowEventModal(true)}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:bg-primary-hover transition-all active:scale-95 group"
          >
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add_circle</span>
            <span className="text-sm">Novo Evento</span>
          </button>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${userProfile?.role === 'MASTER' ? 'bg-purple-500' : 'bg-primary'}`}>
                {loading ? '...' : getInitials(userProfile?.full_name || userProfile?.email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Carregando...'}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-tighter ${userProfile?.role === 'MASTER' ? 'text-purple-500' : 'text-slate-400'}`}>
                  {getRoleBadge(userProfile?.role)}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold text-sm"
            >
              <span className="material-symbols-outlined">logout</span>
              Sair da conta
            </button>
          </div>
        </div>
      </aside>

      {/* New Event Modal */}
      <NewEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onEventCreated={handleEventCreated}
      />
    </>
  );
};

export default Sidebar;
