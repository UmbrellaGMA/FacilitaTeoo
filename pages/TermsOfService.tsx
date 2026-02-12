import React from 'react';

const TermsOfService: React.FC = () => {
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
                            <span className="material-symbols-outlined text-sm">gavel</span>
                            Documento Legal
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                            Termos de Serviço
                        </h1>
                        <p className="text-[#7c6189] dark:text-purple-200/60">
                            Última atualização: 12 de fevereiro de 2026
                        </p>
                    </div>

                    {/* Sections */}
                    <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">handshake</span>
                                1. Aceitação dos Termos
                            </h2>
                            <p>
                                Ao acessar e utilizar o <strong>Facilita Teoo</strong> ("Plataforma"), você concorda integralmente com estes Termos de Serviço.
                                Se você não concordar com qualquer parte destes termos, não utilize a plataforma.
                            </p>
                            <p className="mt-3">
                                Estes termos constituem um acordo legalmente vinculante entre você ("Usuário") e o Facilita Teoo ("Nós" ou "Plataforma").
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">description</span>
                                2. Descrição do Serviço
                            </h2>
                            <p>
                                O Facilita Teoo é uma plataforma de gestão de eventos que oferece:
                            </p>
                            <ul className="space-y-2 ml-4 mt-3">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Gerenciamento de eventos, incluindo criação, edição e acompanhamento.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Cadastro e gestão de clientes e leads.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Controle de equipamentos e inventário.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Geração de contratos e orçamentos.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Integração com Google Calendar para sincronização de eventos.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Calendário e visualização de agenda.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person_add</span>
                                3. Cadastro e Conta
                            </h2>
                            <p className="mb-3">Ao criar uma conta, você:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Declara ter pelo menos 18 anos de idade.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Concorda em fornecer informações verdadeiras, atualizadas e completas.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>É responsável por manter a segurança e confidencialidade da sua senha.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>É responsável por todas as atividades realizadas sob sua conta.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">payments</span>
                                4. Planos e Pagamentos
                            </h2>
                            <p className="mb-3">Sobre os planos de assinatura:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Novos usuários recebem um período de teste gratuito de 30 dias.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Após o período de teste, é necessário assinar um plano pago para continuar utilizando a plataforma.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Os pagamentos são processados de forma segura pelo Mercado Pago.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Os preços podem ser alterados com aviso prévio de 30 dias.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Não há reembolso para períodos parciais de uso.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">calendar_month</span>
                                5. Integração com Google Calendar
                            </h2>
                            <p>
                                A integração com o Google Calendar é um recurso opcional que permite sincronizar seus eventos. Ao utilizar esta funcionalidade:
                            </p>
                            <ul className="space-y-2 ml-4 mt-3">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Você autoriza o Facilita Teoo a acessar e gerenciar eventos na sua agenda Google.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Seus dados do Google são tratados conforme nossa <a href="/privacidade" className="text-primary hover:text-primary-hover font-bold underline">Política de Privacidade</a>.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Você pode desconectar a integração a qualquer momento.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
                                    <span>Não nos responsabilizamos por alterações ou exclusões de eventos no Google Calendar realizadas através da sincronização.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">rule</span>
                                6. Uso Aceitável
                            </h2>
                            <p className="mb-3">Você concorda em NÃO:</p>
                            <ul className="space-y-2 ml-4">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-sm mt-1">close</span>
                                    <span>Utilizar a plataforma para atividades ilegais ou não autorizadas.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-sm mt-1">close</span>
                                    <span>Tentar acessar dados de outros usuários.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-sm mt-1">close</span>
                                    <span>Realizar engenharia reversa ou tentar hackear o sistema.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-sm mt-1">close</span>
                                    <span>Sobrecarregar ou interferir no funcionamento dos servidores.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-sm mt-1">close</span>
                                    <span>Compartilhar sua conta com terceiros.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">copyright</span>
                                7. Propriedade Intelectual
                            </h2>
                            <p>
                                Todo o conteúdo da plataforma, incluindo design, código, logotipos, textos e funcionalidades, é de propriedade
                                exclusiva do Facilita Teoo e está protegido por leis de propriedade intelectual. É proibida a reprodução,
                                distribuição ou modificação sem autorização expressa.
                            </p>
                            <p className="mt-3">
                                Os dados inseridos por você na plataforma (eventos, clientes, contratos, etc.) permanecem sendo de sua propriedade.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">warning</span>
                                8. Limitação de Responsabilidade
                            </h2>
                            <p>
                                O Facilita Teoo é fornecido "como está", sem garantias de qualquer tipo, expressas ou implícitas.
                                Não nos responsabilizamos por:
                            </p>
                            <ul className="space-y-2 ml-4 mt-3">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Interrupções temporárias do serviço por manutenção ou falhas técnicas.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Perdas de dados decorrentes de ações do próprio usuário.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Danos indiretos, incidentais ou consequentes resultantes do uso da plataforma.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Problemas relacionados a serviços de terceiros (Google, Mercado Pago).</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">block</span>
                                9. Suspensão e Encerramento
                            </h2>
                            <p>
                                Reservamo-nos o direito de suspender ou encerrar sua conta em caso de:
                            </p>
                            <ul className="space-y-2 ml-4 mt-3">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Violação destes Termos de Serviço.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Inadimplência no pagamento da assinatura.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Uso abusivo ou fraudulento da plataforma.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm mt-1">arrow_forward</span>
                                    <span>Determinação judicial ou legal.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">update</span>
                                10. Alterações nos Termos
                            </h2>
                            <p>
                                Reservamo-nos o direito de modificar estes Termos de Serviço a qualquer momento. As alterações entrarão em vigor
                                imediatamente após a publicação. O uso continuado da plataforma após as alterações implica aceite dos novos termos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">balance</span>
                                11. Legislação Aplicável
                            </h2>
                            <p>
                                Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será submetida
                                ao foro da comarca da sede do Facilita Teoo, com renúncia a qualquer outro foro, por mais privilegiado que seja.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">mail</span>
                                12. Contato
                            </h2>
                            <p>
                                Para dúvidas sobre estes Termos de Serviço, entre em contato:
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

export default TermsOfService;
