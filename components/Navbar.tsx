
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

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'update';
  created_at: string;
  is_read?: boolean;
}

interface HelpContactItem {
  id: string;
  type: 'email' | 'whatsapp' | 'phone' | 'link';
  label: string;
  description?: string;
  value: string;
  icon: string;
}

interface TutorialItem {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  category: string;
}

const Navbar: React.FC<NavbarProps> = ({ activeView, session, onViewChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Data from database
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());
  const [helpContacts, setHelpContacts] = useState<HelpContactItem[]>([]);
  const [tutorials, setTutorials] = useState<TutorialItem[]>([]);
  const [showTutorialsSection, setShowTutorialsSection] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchUserRole();
      fetchNotifications();
      fetchHelpContacts();
      fetchTutorials();
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

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);

    // Fetch read status
    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', session?.user?.id || '');
    if (reads) {
      setReadNotifIds(new Set(reads.map((r: any) => r.notification_id)));
    }
  };

  const fetchHelpContacts = async () => {
    const { data } = await supabase
      .from('help_contacts')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (data) setHelpContacts(data);
  };

  const fetchTutorials = async () => {
    const { data } = await supabase
      .from('tutorials')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (data) setTutorials(data);
  };

  const markNotificationAsRead = async (notifId: string) => {
    if (readNotifIds.has(notifId)) return;
    await supabase.from('notification_reads').insert({
      notification_id: notifId,
      user_id: session?.user?.id
    });
    setReadNotifIds(prev => new Set([...prev, notifId]));
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !readNotifIds.has(n.id));
    if (unread.length === 0) return;
    const inserts = unread.map(n => ({
      notification_id: n.id,
      user_id: session?.user?.id
    }));
    await supabase.from('notification_reads').insert(inserts);
    setReadNotifIds(new Set(notifications.map(n => n.id)));
  };

  const unreadCount = notifications.filter(n => !readNotifIds.has(n.id)).length;

  const viewLabels: Record<ViewType, string> = {
    dashboard: 'Painel Principal',
    clients: 'Gestão de Clientes',
    equipment: 'Gestão de Equipamentos',
    contracts: 'Gestão de Contratos',
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
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifPanel(false);
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

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'warning': return 'warning';
      case 'success': return 'celebration';
      case 'update': return 'update';
      default: return 'info';
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600';
      case 'success': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600';
      case 'update': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600';
      default: return 'bg-purple-100 dark:bg-purple-500/20 text-purple-600';
    }
  };

  const getContactColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
      case 'whatsapp': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
      case 'phone': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400';
      default: return 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400';
    }
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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
          {/* Notifications Button */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className="p-2.5 rounded-xl bg-[#f3f0f4] dark:bg-white/5 relative hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-400">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white dark:border-background-dark">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifPanel && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">notifications</span>
                      Notificações
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-slate-50 dark:divide-white/5">
                        {notifications.map(notif => {
                          const isRead = readNotifIds.has(notif.id);
                          return (
                            <div
                              key={notif.id}
                              onClick={() => markNotificationAsRead(notif.id)}
                              className={`p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${!isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotifColor(notif.type)}`}>
                                  <span className="material-symbols-outlined text-sm">{getNotifIcon(notif.type)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium text-slate-900 dark:text-white truncate ${!isRead ? 'font-bold' : ''}`}>{notif.title}</p>
                                    {!isRead && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.created_at)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">notifications_off</span>
                        <p className="text-sm text-slate-500 mt-2">Nenhuma notificação</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Help Button */}
          <button
            onClick={() => { setShowHelpModal(true); setShowTutorialsSection(false); }}
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
              onClick={() => setShowHelpModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto animate-in zoom-in-95 fade-in duration-200 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
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

                <div className="overflow-y-auto flex-1 px-6 pb-6">
                  {/* Tab toggle: Contacts / Tutorials */}
                  <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1 mb-4">
                    <button
                      onClick={() => setShowTutorialsSection(false)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!showTutorialsSection ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                    >
                      <span className="material-symbols-outlined text-sm align-middle mr-1">support_agent</span>
                      Contatos
                    </button>
                    <button
                      onClick={() => setShowTutorialsSection(true)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${showTutorialsSection ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                    >
                      <span className="material-symbols-outlined text-sm align-middle mr-1">school</span>
                      Tutoriais
                    </button>
                  </div>

                  {/* Contacts Section */}
                  {!showTutorialsSection && (
                    <div className="space-y-3">
                      {helpContacts.length > 0 ? (
                        helpContacts.map(contact => (
                          <div key={contact.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getContactColor(contact.type)}`}>
                              <span className="material-symbols-outlined">{contact.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900 dark:text-white">{contact.label}</h4>
                              {contact.description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{contact.description}</p>
                              )}
                              {contact.type === 'whatsapp' ? (
                                <a
                                  href={`https://wa.me/${contact.value.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary font-medium mt-2 inline-block hover:underline"
                                >
                                  {contact.value}
                                </a>
                              ) : contact.type === 'email' ? (
                                <a
                                  href={`mailto:${contact.value}`}
                                  className="text-sm text-primary font-medium mt-2 inline-block hover:underline"
                                >
                                  {contact.value}
                                </a>
                              ) : contact.type === 'link' ? (
                                <a
                                  href={contact.value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary font-medium mt-2 inline-block hover:underline"
                                >
                                  {contact.value}
                                </a>
                              ) : (
                                <p className="text-sm text-primary font-medium mt-2">{contact.value}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">contacts</span>
                          <p className="text-sm text-slate-500 mt-2">Nenhum contato disponível</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tutorials Section */}
                  {showTutorialsSection && (
                    <div className="space-y-3">
                      {tutorials.length > 0 ? (
                        tutorials.map(tutorial => (
                          <div key={tutorial.id} className="bg-slate-50 dark:bg-white/5 rounded-xl overflow-hidden hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                            {tutorial.video_url && (
                              <div className="aspect-video">
                                <iframe
                                  src={tutorial.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                  className="w-full h-full"
                                  allowFullScreen
                                  title={tutorial.title}
                                />
                              </div>
                            )}
                            <div className="p-4">
                              <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tutorial.category}</span>
                              <h4 className="font-bold text-slate-900 dark:text-white mt-2">{tutorial.title}</h4>
                              {tutorial.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tutorial.description}</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">school</span>
                          <p className="text-sm text-slate-500 mt-2">Nenhum tutorial disponível ainda</p>
                          <p className="text-xs text-slate-400 mt-1">Em breve teremos tutoriais para te ajudar!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-white/10 flex-shrink-0">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </>
        )
      }
    </>
  );
};

export default Navbar;
