
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GoogleCalendarButton from '../components/GoogleCalendarButton';

interface Event {
  id: string;
  title: string;
  location: string;
  event_date: string;
  event_time: string;
  guests: number;
  status: 'CONFIRMADO' | 'PENDENTE' | 'RASCUNHO';
  event_type: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  notes?: string;
  google_event_id?: string;
  sync_status?: 'synced' | 'pending' | 'error' | 'not_synced';
  synced_at?: string;
}

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);

  const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setLoading(true);

    // Get first and last day of current month for filtering
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', firstDay.toISOString().split('T')[0])
      .lte('event_date', lastDay.toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.event_date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setShowMiniCalendar(false);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMADO': return 'bg-emerald-500';
      case 'PENDENTE': return 'bg-amber-500';
      case 'RASCUNHO': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'CONFIRMADO': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
      'PENDENTE': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      'RASCUNHO': 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
    };
    return styles[status] || styles['RASCUNHO'];
  };

  const selectedDateEvents = selectedDate
    ? getEventsForDay(selectedDate.getDate())
    : [];

  // Group events by date for agenda view
  const eventsByDate = events.reduce((acc, event) => {
    if (!acc[event.event_date]) {
      acc[event.event_date] = [];
    }
    acc[event.event_date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const sortedDates = Object.keys(eventsByDate).sort();

  // Mobile Mini Calendar Component
  const MiniCalendar = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-white/10">
      {/* Mini Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={previousMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg">
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg">
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 mb-2">
        {weekDaysShort.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells */}
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days */}
        {days.map(day => {
          const hasEvents = getEventsForDay(day).length > 0;
          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square flex items-center justify-center text-xs font-medium rounded-lg relative
                ${isToday(day) ? 'bg-primary text-white font-bold' : ''}
                ${isSelected(day) && !isToday(day) ? 'bg-primary/20 text-primary font-bold' : ''}
                ${!isToday(day) && !isSelected(day) ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10' : ''}
              `}
            >
              {day}
              {hasEvents && !isToday(day) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 md:gap-6 animate-in slide-in-from-right-4 duration-500">
      {/* Mobile Header with Mini Calendar Toggle */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowMiniCalendar(!showMiniCalendar)}
            className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"
          >
            <span className="material-symbols-outlined text-primary">calendar_month</span>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            <span className="material-symbols-outlined text-sm text-slate-400">
              {showMiniCalendar ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary rounded-lg"
            >
              Hoje
            </button>
            <GoogleCalendarButton onConnectionChange={() => fetchEvents()} />
          </div>
        </div>

        {/* Collapsible Mini Calendar */}
        {showMiniCalendar && (
          <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
            <MiniCalendar />
          </div>
        )}

        {/* Mobile Agenda View */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">event_busy</span>
              <p className="text-sm text-slate-500">Nenhum evento este mês</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/10">
              {sortedDates.map(dateStr => {
                const date = new Date(dateStr + 'T12:00:00');
                const dayEvents = eventsByDate[dateStr];
                const isTodays = new Date().toISOString().split('T')[0] === dateStr;

                return (
                  <div key={dateStr} className={`${isTodays ? 'bg-primary/5' : ''}`}>
                    {/* Date Header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/80 dark:bg-white/5">
                      <div className={`
                        w-10 h-10 rounded-xl flex flex-col items-center justify-center
                        ${isTodays ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10'}
                      `}>
                        <span className="text-[9px] font-bold uppercase leading-tight">
                          {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                        </span>
                        <span className="text-base font-black leading-tight">{date.getDate()}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isTodays ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>
                          {isTodays ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>

                    {/* Events List */}
                    <div className="px-4 py-2 space-y-2">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl"
                        >
                          <div className={`w-1 self-stretch rounded-full ${getStatusColor(event.status)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{event.title}</h4>
                              <span className="text-xs font-bold text-primary whitespace-nowrap">
                                {formatTime(event.event_time)}
                              </span>
                            </div>
                            {event.location && (
                              <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                {event.location}
                              </p>
                            )}
                            {event.client_name && (
                              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">person</span>
                                {event.client_name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Calendar */}
      <div className="hidden lg:flex flex-1 flex-col bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={previousMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GoogleCalendarButton onConnectionChange={() => fetchEvents()} />
            <button
              onClick={goToToday}
              className="flex items-center gap-2 px-5 py-2 bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/20 transition-all"
            >
              HOJE
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 flex-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-transparent"></div>
          ))}

          {/* Days of month */}
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const hasEvents = dayEvents.length > 0;

            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`
                  min-h-[100px] p-2 border-r border-b border-slate-100 dark:border-white/10 transition-all cursor-pointer
                  ${isSelected(day) ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-slate-50 dark:hover:bg-white/5'}
                  ${isToday(day) ? 'bg-primary/5' : ''}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all
                    ${isToday(day) ? 'bg-primary text-white shadow-lg' : ''}
                    ${isSelected(day) && !isToday(day) ? 'bg-primary/20 text-primary' : ''}
                    ${!isToday(day) && !isSelected(day) ? 'text-slate-600 dark:text-slate-400 hover:text-primary' : ''}
                  `}>{day}</span>
                  {hasEvents && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  )}
                </div>

                {/* Event indicators */}
                <div className="mt-1 space-y-1 max-h-[60px] overflow-hidden">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`
                        text-[8px] font-bold p-1 rounded-md border-l-2 truncate
                        ${event.status === 'CONFIRMADO' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500' : ''}
                        ${event.status === 'PENDENTE' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500' : ''}
                        ${event.status === 'RASCUNHO' ? 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-400' : ''}
                      `}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[8px] font-bold text-slate-400 dark:text-slate-500 px-1">
                      +{dayEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-96 flex-col gap-6">
        {/* Selected Date Events */}
        {selectedDate && (
          <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Eventos do Dia</h3>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">event_busy</span>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Nenhum evento nesta data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(event.status)}`}>
                        {event.status}
                      </span>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                        {formatTime(event.event_time)}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{event.title}</h4>

                    <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                      {event.location && (
                        <p className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">location_on</span>
                          {event.location}
                        </p>
                      )}
                      {event.guests > 0 && (
                        <p className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">group</span>
                          {event.guests} convidados
                        </p>
                      )}
                      {event.client_name && (
                        <p className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">person</span>
                          {event.client_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Próximos na Agenda</h3>

          {events.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">calendar_month</span>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Nenhum evento próximo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => {
                const eventDate = new Date(event.event_date);
                return (
                  <div
                    key={event.id}
                    onClick={() => {
                      setCurrentDate(new Date(event.event_date));
                      setSelectedDate(new Date(event.event_date));
                    }}
                    className="flex gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 p-2 rounded-xl transition-all"
                  >
                    <div className="w-12 h-12 flex flex-col items-center justify-center bg-slate-100 dark:bg-white/10 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="text-[10px] font-black uppercase leading-tight">
                        {eventDate.toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                      <span className="text-base font-black leading-tight">
                        {eventDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{event.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(event.status)}`}></span>
                        {event.status} • {formatTime(event.event_time)}
                      </p>
                      {event.location && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{event.location}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
