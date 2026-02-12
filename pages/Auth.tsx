import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [cpf, setCpf] = useState('');

    // View States
    const [isRegistering, setIsRegistering] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isForgotPassword) {
                // Password Reset Logic
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin, // Redirect back to app
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Instruções de recuperação enviadas para seu e-mail!' });
            }
            else if (isRegistering) {
                // Registration Logic
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            phone: phone,
                            cpf: cpf,
                            role: 'USER' // Default role
                        }
                    }
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Verifique seu e-mail para confirmar a conta!' });
            } else {
                // Login Logic
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Ocorreu um erro ao processar sua solicitação.' });
        } finally {
            setLoading(false);
        }
    };

    // Helper to render form title
    const getTitle = () => {
        if (isForgotPassword) return 'Recuperar Senha';
        if (isRegistering) return 'Crie sua conta';
        return 'Boas-vindas de volta';
    };

    // Helper to render form subtitle
    const getSubtitle = () => {
        if (isForgotPassword) return 'Digite seu email para receber as instruções.';
        if (isRegistering) return 'Comece a transformar seus eventos hoje mesmo.';
        return 'Acesse seu painel administrativo para continuar.';
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f0a13] flex items-center justify-center p-4 font-display">
            <div className="max-w-5xl w-full bg-white dark:bg-[#1a141f] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-[#e2dbe6] dark:border-[#31253a]">

                {/* Left Side: Illustration & Branding */}
                <div className="md:w-1/2 bg-gradient-to-br from-primary via-purple-600 to-indigo-800 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="mb-8 inline-block">
                            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg">
                                <img src="/logo.png" alt="Facilita Teoo" className="h-10 w-auto object-contain" />
                            </div>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
                            Gerencie seus eventos com <span className="text-purple-200">perfeição.</span>
                        </h2>
                        <p className="text-purple-100 text-lg opacity-80 max-w-sm">
                            A plataforma completa para gestores de eventos que buscam excelência e agilidade.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12">
                        <div className="flex -space-x-3 mb-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-primary bg-slate-200 overflow-hidden shadow-lg">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-primary bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] font-bold">
                                +2k
                            </div>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-200/60">Utilizado por mais de 2.000 profissionais</p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white dark:bg-[#1a141f]">
                    <div className="mb-10 text-center md:text-left">
                        <h3 className="text-3xl font-black text-[#161118] dark:text-white mb-2">
                            {getTitle()}
                        </h3>
                        <p className="text-[#7c6189] dark:text-purple-200/60 font-medium">
                            {getSubtitle()}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {message && (
                            <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                }`}>
                                <span className="material-symbols-outlined">
                                    {message.type === 'success' ? 'check_circle' : 'error'}
                                </span>
                                {message.text}
                            </div>
                        )}

                        {/* Register Fields */}
                        {isRegistering && (
                            <>
                                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] ml-1">Nome Completo</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#7c6189] text-xl">person</span>
                                        <input
                                            required
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Seu nome"
                                            className="w-full pl-12 pr-4 py-4 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/50 transition-all text-[#161118] dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] ml-1">Telefone / Celular</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#7c6189] text-xl">call</span>
                                            <input
                                                required
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="(00) 00000-0000"
                                                className="w-full pl-12 pr-4 py-4 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/50 transition-all text-[#161118] dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] ml-1">CPF</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#7c6189] text-xl">badge</span>
                                            <input
                                                required
                                                type="text"
                                                value={cpf}
                                                onChange={(e) => setCpf(e.target.value)}
                                                placeholder="000.000.000-00"
                                                className="w-full pl-12 pr-4 py-4 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/50 transition-all text-[#161118] dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] ml-1">E-mail</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#7c6189] text-xl">mail</span>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full pl-12 pr-4 py-4 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/50 transition-all text-[#161118] dark:text-white"
                                />
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-[#7c6189] ml-1">Senha</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#7c6189] text-xl">lock</span>
                                    <input
                                        required
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-4 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/50 transition-all text-[#161118] dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        {!isForgotPassword && !isRegistering && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsForgotPassword(true);
                                        setMessage(null);
                                    }}
                                    className="text-sm font-bold text-primary hover:text-primary-hover transition-colors"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group mt-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>
                                        {isForgotPassword
                                            ? 'Enviar Instruções'
                                            : (isRegistering ? 'Criar Conta' : 'Entrar no Sistema')}
                                    </span>
                                    {!isForgotPassword && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-[#e2dbe6] dark:border-[#31253a] text-center">
                        <button
                            onClick={() => {
                                if (isForgotPassword) {
                                    setIsForgotPassword(false);
                                } else {
                                    setIsRegistering(!isRegistering);
                                }
                                setMessage(null);
                            }}
                            className="text-sm font-bold text-[#7c6189] hover:text-primary transition-colors"
                        >
                            {isForgotPassword
                                ? 'Voltar para o Login'
                                : (isRegistering
                                    ? 'Já tem uma conta? Faça login agora'
                                    : 'Novo por aqui? Crie sua conta gratuitamente')}
                        </button>

                        {/* Legal Links */}
                        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-[#7c6189]/70 dark:text-purple-200/40">
                            <a
                                href="/privacidade"
                                className="hover:text-primary transition-colors font-semibold underline decoration-dotted underline-offset-2"
                            >
                                Política de Privacidade
                            </a>
                            <span className="text-[#e2dbe6] dark:text-[#31253a]">•</span>
                            <a
                                href="/termos"
                                className="hover:text-primary transition-colors font-semibold underline decoration-dotted underline-offset-2"
                            >
                                Termos de Serviço
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
