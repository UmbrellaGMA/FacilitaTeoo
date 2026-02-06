
import React, { useState, useEffect, useRef } from 'react';
import { ViewType } from '../types';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  activeView: ViewType;
  session: Session | null;
  onViewChange: (view: ViewType) => void;
}

interface SearchResult {
  id: string;
  type: 'event' | 'client' | 'equipment' | 'contract';
  title: string;
  subtitle?: string;
  view: ViewType;
}

const Navbar: React.FC<NavbarProps> = ({ activeView, session, onViewChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserRole();
    }
  }, [session]);

  const fetchUserRole = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session?.user?.id)
        .single();
      setUserRole(data?.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const viewLabels: Record<ViewType, string> = {
    dashboard: 'Painel Principal',
    clients: 'Gestão de Clientes',
    equipment: 'Gestão de Equipamentos',
    contracts: 'Gestão de Contratos',
    map: 'Logística & Mapa',
    calendar: 'Calendário de Eventos',
    events: 'Eventos',
    settings: 'Ajustes da Conta',
    admin: 'Painel Master',
  };

  const icons: Record<ViewType, string> = {
    dashboard: 'space_dashboard',
    clients: 'groups',
    equipment: 'inventory_2',
    contracts: 'description',
    map: 'map',
    calendar: 'calendar_month',
    events: 'event',
    settings: 'settings',
    admin: 'admin_panel_settings',
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search functionality with debounce
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const results: SearchResult[] = [];

      try {
        // Search events
        const { data: events } = await supabase
          .from('events')
          .select('id, title, client_name')
          .or(`title.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%`)
          .limit(3);

        events?.forEach(e => results.push({
          id: e.id,
          type: 'event',
          title: e.title,
          subtitle: e.client_name || 'Evento',
          view: 'events'
        }));

        // Search leads
        const { data: leads } = await supabase
          .from('leads')
          .select('id, name, email')
          .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(3);

        leads?.forEach(l => results.push({
          id: l.id,
          type: 'client',
          title: l.name,
          subtitle: l.email || 'Cliente',
          view: 'clients'
        }));

        // Search equipment
        const { data: equipment } = await supabase
          .from('equipment')
          .select('id, name, category')
          .ilike('name', `%${searchQuery}%`)
          .limit(3);

        equipment?.forEach(eq => results.push({
          id: eq.id,
          type: 'equipment',
          title: eq.name,
          subtitle: eq.category || 'Equipamento',
          view: 'equipment'
        }));

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearchResultClick = (result: SearchResult) => {
    onViewChange(result.view);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'event': return 'event';
      case 'client': return 'person';
      case 'equipment': return 'inventory_2';
      case 'contract': return 'description';
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'event': return 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      case 'client': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'equipment': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'contract': return 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
    }
  };

  // Get user info from session
  const userName = session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'Usuário';
  const userEmail = session?.user?.email || '';

  // Generate avatar initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <header className="h-16 border-b border-[#e2dbe6] dark:border-[#31253a] bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined font-bold">{icons[activeView]}</span>
            <h2 className="text-base md:text-lg font-bold text-[#161118] dark:text-white whitespace-nowrap hidden sm:block">{viewLabels[activeView]}</h2>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block max-w-md w-full relative" ref={searchRef}>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7c6189] text-xl">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Procurar eventos, clientes ou leads..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
            />

            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-slate-500 mt-2">Buscando...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(result.type)}`}>
                          <span className="material-symbols-outlined text-sm">{getTypeIcon(result.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{result.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{result.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">search_off</span>
                    <p className="text-sm text-slate-500 mt-2">Nenhum resultado encontrado</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="p-2.5 rounded-xl bg-[#f3f0f4] dark:bg-white/5 relative hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-400">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-background-dark animate-pulse"></span>
          </button>

          {/* Help Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="hidden sm:flex p-2.5 rounded-xl bg-[#f3f0f4] dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-400">help</span>
          </button>

          <div className="h-8 w-[1px] bg-[#e2dbe6] dark:bg-[#31253a] mx-1"></div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <div
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 p-1.5 rounded-xl cursor-pointer transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#161118] dark:text-white leading-none">{userName}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#7c6189] font-bold">{session?.user?.user_metadata?.role || 'Usuário'}</p>
              </div>
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-sm border-2 border-primary/20"
              >
                {getInitials(userName)}
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-lg">
                        {getInitials(userName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        onViewChange('settings');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">settings</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-white">Ajustes da Conta</span>
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left border-t border-slate-100 dark:border-white/10 mt-2 pt-2"
                    >
                      <span className="material-symbols-outlined text-red-500">logout</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Sair</span>
                    </button>

                    {userRole === 'MASTER' && (
                      <button
                        onClick={() => {
                          onViewChange('admin');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors text-left border-t border-slate-100 dark:border-white/10 mt-2 pt-2"
                      >
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">admin_panel_settings</span>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Painel Master</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header >

      {/* Help Modal */}
      {
        showHelpModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
              onClick={() => setShowHelpModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">help</span>
                    Central de Ajuda
                  </h3>
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-slate-500">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">support_agent</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Suporte Técnico</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Entre em contato com nossa equipe de suporte para dúvidas técnicas.</p>
                      <p className="text-sm text-primary font-medium mt-2">suporte@facilitapro.com.br</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">school</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Tutoriais</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acesse nossa base de conhecimento com guias e tutoriais.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">chat</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">WhatsApp</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Atendimento rápido pelo WhatsApp em horário comercial.</p>
                      <p className="text-sm text-primary font-medium mt-2">(11) 99999-9999</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-full mt-6 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </>
        )
      }
    </>
  );
};

export default Navbar;
