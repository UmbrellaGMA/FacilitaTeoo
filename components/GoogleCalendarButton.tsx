import React, { useState, useEffect } from 'react';
import { supabase, SUPABASE_URL } from '../lib/supabase';

interface GoogleCalendarButtonProps {
    onConnectionChange?: (connected: boolean) => void;
}

const GoogleCalendarButton: React.FC<GoogleCalendarButtonProps> = ({ onConnectionChange }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [connectedAt, setConnectedAt] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showComingSoonModal, setShowComingSoonModal] = useState(false);

    useEffect(() => {
        checkConnectionStatus();

        // Check for connection result from URL params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('google_connected') === 'true') {
            setIsConnected(true);
            onConnectionChange?.(true);
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        } else if (urlParams.get('google_error')) {
            const error = urlParams.get('google_error');
            console.error('Google connection error:', error);
            alert(`Erro ao conectar com Google Calendar: ${error}`);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const checkConnectionStatus = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setIsLoading(false);
                return;
            }

            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/google-calendar-sync`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'status' }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setIsConnected(data.connected);
                setConnectedAt(data.connectedAt);
                onConnectionChange?.(data.connected);
            }
        } catch (error) {
            console.error('Error checking connection status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        // Show coming soon modal instead of connecting
        setShowComingSoonModal(true);
    };

    const handleDisconnect = async () => {
        if (!confirm('Tem certeza que deseja desconectar o Google Calendar? Os eventos não serão mais sincronizados.')) {
            return;
        }

        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/google-calendar-sync`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'disconnect' }),
                }
            );

            if (response.ok) {
                setIsConnected(false);
                setConnectedAt(null);
                onConnectionChange?.(false);
                setShowMenu(false);
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/google-calendar-sync`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'sync-all' }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                alert(`Sincronização concluída! ${data.synced} eventos sincronizados${data.errors > 0 ? `, ${data.errors} erros` : ''}`);
            }
        } catch (error) {
            console.error('Error syncing:', error);
            alert('Erro ao sincronizar eventos');
        } finally {
            setIsSyncing(false);
            setShowMenu(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 rounded-xl">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                <span className="text-sm text-slate-500">Verificando...</span>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <>
                <button
                    onClick={handleConnect}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/20 transition-all shadow-sm group"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700 dark:text-white">Conectar Google Calendar</span>
                </button>

                {/* Coming Soon Modal */}
                {showComingSoonModal && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
                            onClick={() => setShowComingSoonModal(false)}
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
                                <div className="flex flex-col items-center text-center">
                                    {/* Google Calendar Icon */}
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                                        </svg>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        Em Breve!
                                    </h3>

                                    {/* Message */}
                                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                                        A integração com o Google Agenda estará disponível apenas na versão do lançamento oficial.
                                    </p>

                                    {/* Additional info */}
                                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 mb-6 w-full">
                                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                            <span className="material-symbols-outlined text-xl">info</span>
                                            <span className="text-sm font-medium">
                                                Aguarde novidades em breve!
                                            </span>
                                        </div>
                                    </div>

                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowComingSoonModal(false)}
                                        className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
                                    >
                                        Entendi
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-all"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Conectado</span>
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-base">
                    {showMenu ? 'expand_less' : 'expand_more'}
                </span>
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-3 border-b border-slate-100 dark:border-white/10">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Conectado em {connectedAt ? new Date(connectedAt).toLocaleDateString('pt-BR') : '--'}
                            </p>
                        </div>

                        <button
                            onClick={handleSyncAll}
                            disabled={isSyncing}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                        >
                            <span className={`material-symbols-outlined text-primary ${isSyncing ? 'animate-spin' : ''}`}>
                                {isSyncing ? 'progress_activity' : 'sync'}
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-white">
                                {isSyncing ? 'Sincronizando...' : 'Sincronizar Tudo'}
                            </span>
                        </button>

                        <button
                            onClick={handleDisconnect}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left border-t border-slate-100 dark:border-white/10"
                        >
                            <span className="material-symbols-outlined text-red-500">link_off</span>
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">Desconectar</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default GoogleCalendarButton;
