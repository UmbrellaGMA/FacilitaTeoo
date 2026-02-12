import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f0a13] font-display">
            {/* Header */}
            <header className="bg-white dark:bg-[#1a141f] border-b border-[#e2dbe6] dark:border-[#31253a] sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 group">
                        <div className="bg-gradient-to-br from-primary to-purple-700 p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all">
                            <img src="/logo.png" alt="Facilita Teoo" className="h-6 w-auto object-contain brightness-0 invert" />
                        </div>
                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Facilita Teoo</span>
                    </a>
                    <a
                        href="/"
                        className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Voltar ao Login
                    </a>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white dark:bg-[#1a141f] rounded-3xl border border-[#e2dbe6] dark:border-[#31253a] shadow-sm p-8 md:p-12">
                    {/* Title */}
                    <div className="mb-10">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                            <span className="material-symbols-outlined text-sm">shield</span>
                            Documento Legal
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                            Política de Privacidade
                        </h1>
                        <p className="text-[#7c6189] dark:text-purple-200/60">
                            Última atualização: 12 de fevereiro de 2026
                        </p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">info</span>
                                1. Introdução
                            </h2>
                            <p>
                                O <strong>Facilita Teoo</strong> ("nós", "nosso" ou "aplicativo") é uma plataforma de gestão de eventos desenvolvida para auxiliar
                                organizadores de eventos na administração de seus clientes, contratos, equipamentos e agendas. Esta Política de Privacidade
                                descreve como coletamos, usamos, armazenamos e protegemos as informações pessoais dos nossos usuários.
                            </p>
                            <p className="mt-3">
                                Ao utilizar nosso aplicativo, você concorda com os termos desta política. Caso não concorde, por favor, não utilize nossos serviços.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">database</span>
                                2. Dados que Coletamos
                            </h2>
                            <p className="mb-3">Coletamos os seguintes tipos de informações:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span><strong>Dados de cadastro:</strong> nome completo, e-mail, telefone, CPF e senha (criptografada).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span><strong>Dados de eventos:</strong> informações sobre eventos criados, incluindo título, data, local, descrição e convidados.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span><strong>Dados de clientes:</strong> informações de clientes cadastrados pelo usuário, como nome, contato e endereço.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span><strong>Dados de integração com Google Calendar:</strong> tokens de acesso OAuth 2.0 para sincronização de eventos. Não armazenamos sua senha do Google.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span><strong>Dados de uso:</strong> informações sobre como você interage com o aplicativo para fins de melhoria.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">target</span>
                                3. Como Usamos seus Dados
                            </h2>
                            <p className="mb-3">Utilizamos suas informações para:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Prover e manter os serviços do aplicativo.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Autenticar e manter a segurança da sua conta.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Sincronizar eventos com o Google Calendar mediante sua autorização explícita.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Gerenciar assinaturas e processar pagamentos.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Melhorar a experiência do usuário e o desempenho da plataforma.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Enviar comunicações importantes sobre o serviço.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">calendar_month</span>
                                4. Integração com Google Calendar
                            </h2>
                            <p>
                                Nosso aplicativo oferece integração com o Google Calendar para sincronização de eventos. Ao conectar sua conta do Google:
                            </p>
                            <ul className="space-y-2 ml-4 mt-3">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Solicitamos acesso apenas ao escopo necessário: leitura e escrita de eventos do calendário.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Armazenamos apenas tokens de acesso OAuth 2.0, nunca sua senha do Google.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Você pode revogar o acesso a qualquer momento através das configurações do aplicativo ou diretamente no Google.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Os dados do Google Calendar são isolados por usuário — nenhum outro usuário terá acesso aos seus eventos.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">share</span>
                                5. Compartilhamento de Dados
                            </h2>
                            <p>
                                <strong>Não vendemos, alugamos ou compartilhamos</strong> suas informações pessoais com terceiros para fins de marketing.
                                Seus dados podem ser compartilhados apenas com:
                            </p>
                            <ul className="space-y-2 ml-4 mt-3">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span><strong>Supabase:</strong> nosso provedor de banco de dados e autenticação, que processa dados sob nossas instruções.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span><strong>Google:</strong> apenas para a funcionalidade de sincronização do Google Calendar, mediante sua autorização.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span><strong>Mercado Pago:</strong> para processamento seguro de pagamentos de assinaturas.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">lock</span>
                                6. Segurança dos Dados
                            </h2>
                            <p>
                                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo:
                            </p>
                            <ul className="space-y-2 ml-4 mt-3">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Criptografia de senhas e dados sensíveis.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Comunicação via HTTPS em todas as conexões.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Row Level Security (RLS) no banco de dados para isolamento de dados por usuário.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Autenticação JWT para acesso seguro às APIs.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person</span>
                                7. Seus Direitos
                            </h2>
                            <p className="mb-3">
                                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
                            </p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Acessar seus dados pessoais armazenados.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Corrigir dados incompletos, inexatos ou desatualizados.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Solicitar a exclusão dos seus dados pessoais.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Revogar o consentimento de integração com o Google Calendar.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Portabilidade dos dados mediante solicitação.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">cookie</span>
                                8. Cookies e Armazenamento Local
                            </h2>
                            <p>
                                Utilizamos armazenamento local (localStorage) para manter sua sessão ativa e preferências do aplicativo.
                                Não utilizamos cookies de rastreamento de terceiros.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">child_care</span>
                                9. Menores de Idade
                            </h2>
                            <p>
                                Nosso aplicativo não é destinado a menores de 18 anos. Não coletamos intencionalmente informações de menores.
                                Caso tome conhecimento de que um menor forneceu dados pessoais, entre em contato para que possamos removê-los.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">update</span>
                                10. Alterações nesta Política
                            </h2>
                            <p>
                                Podemos atualizar esta Política de Privacidade periodicamente. Quaisquer alterações serão publicadas nesta página
                                com a data da última atualização. Recomendamos que você revise esta política periodicamente.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">mail</span>
                                11. Contato
                            </h2>
                            <p>
                                Se você tiver dúvidas ou preocupações sobre esta Política de Privacidade ou sobre o tratamento dos seus dados,
                                entre em contato conosco:
                            </p>
                            <div className="mt-4 bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-[#e2dbe6] dark:border-[#31253a]">
                                <p className="font-bold text-slate-900 dark:text-white">Facilita Teoo</p>
                                <p className="text-sm text-[#7c6189] mt-1">E-mail: contato@facilitateoo.online</p>
                                <p className="text-sm text-[#7c6189]">Website: www.facilitateoo.online</p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-[#7c6189] dark:text-purple-200/40">
                    <p>© {new Date().getFullYear()} Facilita Teoo. Todos os direitos reservados.</p>
                    <div className="flex items-center justify-center gap-4 mt-3">
                        <a href="/termos" className="hover:text-primary transition-colors font-bold">Termos de Serviço</a>
                        <span>•</span>
                        <a href="/privacidade" className="hover:text-primary transition-colors font-bold">Política de Privacidade</a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
