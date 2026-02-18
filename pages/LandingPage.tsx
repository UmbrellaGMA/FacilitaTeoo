import React from 'react';

const features = [
  { icon: 'description', title: 'Contratos Digitais', desc: 'Crie, envie e colete assinaturas digitais com validade juridica. Modelos personalizaveis e envio por link.' },
  { icon: 'calendar_month', title: 'Agenda Inteligente', desc: 'Calendario completo com sincronizacao ao Google Calendar. Nunca perca um compromisso.' },
  { icon: 'inventory_2', title: 'Controle de Equipamentos', desc: 'Gerencie seu estoque de equipamentos, disponibilidade e valores de locacao.' },
  { icon: 'people', title: 'Gestao de Clientes', desc: 'Base completa de clientes e leads com historico de contratos e eventos.' },
  { icon: 'bar_chart', title: 'Dashboard Completo', desc: 'Visao geral do seu negocio com graficos, metricas e indicadores em tempo real.' },
  { icon: 'link', title: 'Links de Assinatura', desc: 'Gere links unicos para seus clientes assinarem contratos sem precisar de login.' },
];

const allFeatures = [
  'Contratos ilimitados',
  'Agenda com Google Calendar',
  'Controle de equipamentos',
  'Dashboard completo',
  'Links de assinatura',
  'Gestao de clientes e leads',
  'Suporte prioritario',
];

const LandingPage: React.FC = () => {
  const appUrl = 'https://app.facilitateoo.online';

  return (
    <div className="min-h-screen bg-white text-slate-900 font-display">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Facilita Teoo" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <a href="#funcionalidades" className="hidden md:inline text-sm font-semibold text-slate-600 hover:text-purple-600 transition-colors">Funcionalidades</a>
            <a href="#planos" className="hidden md:inline text-sm font-semibold text-slate-600 hover:text-purple-600 transition-colors">Planos</a>
            <a
              href={appUrl}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/25"
            >
              Acessar App
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <img src="/logo.png" alt="Facilita Teoo" className="h-16 w-auto object-contain mx-auto mb-8" />
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-purple-700 text-sm font-bold mb-8">
            <span className="material-symbols-outlined text-lg">rocket_launch</span>
            Plataforma completa para gestao de eventos
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Gerencie seus eventos
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              com facilidade
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Contratos digitais, agenda inteligente, controle de equipamentos e muito mais.
            Tudo em um so lugar para voce focar no que importa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={appUrl}
              className="px-8 py-4 bg-purple-600 text-white rounded-2xl text-lg font-bold hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/30 hover:-translate-y-0.5"
            >
              Comecar Agora
              <span className="material-symbols-outlined text-xl ml-2 align-middle">arrow_forward</span>
            </a>
            <a
              href="#funcionalidades"
              className="px-8 py-4 bg-slate-100 text-slate-900 rounded-2xl text-lg font-bold hover:bg-slate-200 transition-all"
            >
              Ver Funcionalidades
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Tudo que voce precisa</h2>
            <p className="text-lg text-slate-600">Ferramentas poderosas para profissionais de eventos</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all">
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-purple-600 text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Como funciona</h2>
            <p className="text-lg text-slate-600">Em 3 passos simples</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crie sua conta', desc: 'Cadastro rapido e comece a usar imediatamente.' },
              { step: '02', title: 'Configure seus modelos', desc: 'Crie modelos de contrato com sua marca e tags personalizadas.' },
              { step: '03', title: 'Gerencie tudo', desc: 'Envie contratos, acompanhe eventos e controle seu negocio.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-black text-purple-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Planos</h2>
            <p className="text-lg text-slate-600">Todos os recursos inclusos em qualquer plano</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Plano Free */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-slate-500 mb-6">Teste todos os recursos por 30 dias</p>
              <div className="text-4xl font-black mb-1">
                Gratis
              </div>
              <p className="text-slate-400 text-sm mb-6">por 30 dias</p>
              <ul className="space-y-3 mb-8">
                {allFeatures.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href={appUrl} className="block text-center px-6 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                Comecar Gratis
              </a>
            </div>

            {/* Plano Pro */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 rounded-full text-xs font-bold">Melhor valor</div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-purple-200 mb-6">Acesso completo e ilimitado</p>
              <div className="text-4xl font-black mb-1">
                R$ 15
                <span className="text-lg font-normal text-purple-200">/mes</span>
              </div>
              <p className="text-purple-300 text-sm mb-6">cobrado mensalmente</p>
              <ul className="space-y-3 mb-8">
                {allFeatures.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-purple-100">
                    <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href={appUrl} className="block text-center px-6 py-3.5 bg-white text-purple-700 rounded-xl font-bold hover:bg-purple-50 transition-all shadow-xl">
                Assinar Agora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Pronto para facilitar sua gestao?
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de profissionais que ja usam o Facilita Teoo para gerenciar seus eventos.
          </p>
          <a
            href={appUrl}
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-2xl text-lg font-bold hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/30 hover:-translate-y-0.5"
          >
            Criar Conta Gratis
            <span className="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Facilita Teoo" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="/privacidade" className="hover:text-purple-600 transition-colors">Privacidade</a>
            <a href="/termos" className="hover:text-purple-600 transition-colors">Termos de Uso</a>
          </div>
          <p className="text-sm text-slate-400">&copy; 2026 Facilita Teoo. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
