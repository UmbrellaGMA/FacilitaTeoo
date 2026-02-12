
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/formatters';


interface Event {
  id: string;
  title: string;
  location: string;
  event_date: string;
  event_time: string;
  guests: number;
  status: 'CONFIRMADO' | 'PENDENTE' | 'RASCUNHO' | 'ORÇAMENTO' | 'FINALIZADO';
  type: string;
  lead_id?: string;
  leads?: { name: string };
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  interest?: string;
  status?: string;
  created_at: string;
}

interface Contract {
  id: string;
  value: number;
  status: 'CONFIRMADO' | 'PENDENTE' | 'RASCUNHO' | 'ORÇAMENTO' | 'FINALIZADO';
  created_at: string;
}

import { ViewType } from '../types';

interface DashboardStats {
  orcamentos: number;
  confirmados: number;
  rascunhos: number;
  monthlyRevenue: number;
  totalLeads: number;
}

interface DashboardProps {
  onViewChange?: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    orcamentos: 0,
    confirmados: 0,
    rascunhos: 0,
    monthlyRevenue: 0,
    totalLeads: 0,
  });
  const [monthlyData, setMonthlyData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 1. Fetch Events for List (Next 7 days, Confirmed only for dashboard list?)
      // Actually standard dashboard view usually shows upcoming confirmed events.
      const { data: eventsData } = await supabase
        .from('events')
        .select('*, leads(name)')
        .gte('event_date', today)
        .lte('event_date', nextWeek)
        .order('event_date', { ascending: true })
        .limit(5);

      if (eventsData) setEvents(eventsData);

      // 2. Fetch Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (leadsData) setLeads(leadsData);

      // 3. Global Stats Counts
      const { data: allEvents } = await supabase
        .from('events')
        .select('id, status, value, created_at');

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      let orcamentosCount = 0;
      let confirmadosCount = 0;
      let rascunhosCount = 0;
      let totalRevenue = 0;

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      allEvents?.forEach(e => {
        // Status Counts
        if (e.status === 'CONFIRMADO') {
          confirmadosCount++;
          // Revenue Logic (Monthly)
          const d = new Date(e.created_at);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            totalRevenue += (e.value || 0);
          }
        } else if (e.status === 'ORÇAMENTO' || e.status === 'PENDENTE') {
          orcamentosCount++;
        } else if (e.status === 'RASCUNHO') {
          // 24h Filter
          const createdAt = new Date(e.created_at);
          if (createdAt > oneDayAgo) {
            rascunhosCount++;
          }
        }
      });

      // Total Leads
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      setStats({
        orcamentos: orcamentosCount,
        confirmados: confirmadosCount,
        rascunhos: rascunhosCount,
        monthlyRevenue: totalRevenue,
        totalLeads: leadsCount || 0,
      });

      // 4. Chart Data
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const chartData: { name: string; value: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.getMonth();
        const year = d.getFullYear();

        const monthTotal = allEvents?.filter(e => {
          const date = new Date(e.created_at);
          return e.status === 'CONFIRMADO' && date.getMonth() === month && date.getFullYear() === year;
        }).reduce((sum, e) => sum + (e.value || 0), 0) || 0;

        chartData.push({ name: monthNames[month], value: monthTotal });
      }

      setMonthlyData(chartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return { day, month: months[date.getMonth()] };
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (id: string) => {
    const colors = ['bg-primary', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-pink-500', 'bg-indigo-500'];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-black text-[#161118] dark:text-white tracking-tight">Olá, bem-vindo!</h1>
        <p className="text-[#7c6189] dark:text-purple-200/70 text-sm md:text-lg mt-1">Resumo diário do Facilita Teoo.</p>
      </div>

      {/* Stats Cards - Updated to match Events page style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orçamentos */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Orçamentos</p>
              <p className="text-3xl font-bold mt-1">{stats.orcamentos}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-2xl">request_quote</span>
            </div>
          </div>
        </div>

        {/* Confirmados */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Confirmados</p>
              <p className="text-3xl font-bold mt-1">{stats.confirmados}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
          </div>
        </div>

        {/* Rascunhos */}
        <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-5 text-white shadow-lg shadow-slate-500/20 group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm font-medium">Rascunhos</p>
              <p className="text-3xl font-bold mt-1">{stats.rascunhos}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-2xl">draft</span>
            </div>
          </div>
        </div>

        {/* Receita Mensal (Added to keep business value) */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20 group hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Receita Mensal</p>
              <p className="text-xl font-bold mt-2 truncate">{formatCurrency(stats.monthlyRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e2dbe6] dark:border-[#31253a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#161118] dark:text-white">Receita Mensal</h2>
            <p className="text-sm text-[#7c6189] dark:text-purple-200/60">Comparativo do último semestre</p>
          </div>
        </div>
        <div className="p-6 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2dbe6" opacity={0.5} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#7c6189', fontSize: 12, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#7c6189', fontSize: 12 }}
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {monthlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === monthlyData.length - 1 ? '#a413ec' : '#a413ec66'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] shadow-sm">
          <div className="p-6 border-b border-[#e2dbe6] dark:border-[#31253a] flex items-center justify-between">
            <h2
              className="font-bold text-[#161118] dark:text-white flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => onViewChange?.('calendar')}
            >
              <span className="material-symbols-outlined text-primary">event_upcoming</span>
              Próximos Eventos
            </h2>
            <button
              onClick={() => onViewChange?.('calendar')}
              className="text-xs text-[#7c6189] hover:text-primary font-bold uppercase transition-colors"
            >
              Ver todos ({events.length})
            </button>
          </div>
          <div className="divide-y divide-[#e2dbe6] dark:divide-[#31253a]">
            {events.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-[#7c6189]/30 mb-2">event_busy</span>
                <p className="text-sm text-[#7c6189]">Nenhum evento próximo</p>
              </div>
            ) : (
              events.map((event) => {
                const { day, month } = formatDate(event.event_date);
                return (
                  <div
                    key={event.id}
                    onClick={() => onViewChange?.('calendar')}
                    className="p-4 flex items-center gap-4 hover:bg-[#f3f0f4] dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <span className="text-[10px] font-bold uppercase">{month}</span>
                      <span className="text-xl font-black leading-none">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{event.title}</p>
                      <p className="text-xs text-[#7c6189] truncate">
                        {event.leads?.name || event.location} • {event.guests || 0} convidados
                      </p>
                    </div>
                    <span className={`
                      px-3 py-1 rounded-full text-[10px] font-black uppercase
                      ${event.status === 'confirmed' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                        event.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'}
                    `}>
                      {event.status === 'confirmed' ? 'CONFIRMADO' : event.status === 'pending' ? 'PENDENTE' : event.status?.toUpperCase()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] shadow-sm">
          <div className="p-6 border-b border-[#e2dbe6] dark:border-[#31253a] flex items-center justify-between">
            <h2 className="font-bold text-[#161118] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person_add</span>
              Leads Recentes
            </h2>
            <span className="text-xs text-[#7c6189]">{stats.totalLeads} total</span>
          </div>
          <div className="p-4 space-y-4">
            {leads.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-[#7c6189]/30 mb-2">person_off</span>
                <p className="text-sm text-[#7c6189]">Nenhum lead cadastrado</p>
              </div>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-4 hover:translate-x-1 transition-transform cursor-pointer">
                  <div className={`w-11 h-11 rounded-full ${getRandomColor(lead.id)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {getInitials(lead.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{lead.name}</p>
                    <p className="text-xs text-[#7c6189]">Interesse: {lead.interest || 'Não informado'}</p>
                  </div>
                  <p className="text-[10px] text-[#7c6189] font-medium italic">{getTimeAgo(lead.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
