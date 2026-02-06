
import React from 'react';

const MapView: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center animate-in fade-in duration-500">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-6xl text-primary">map</span>
          </div>
          <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
          Disponível em Breve
        </h2>

        {/* Description */}
        <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Estamos trabalhando para trazer uma experiência incrível de mapa e logística.
          Em breve você poderá visualizar todos os seus eventos e rotas em um só lugar.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-full">
            <span className="material-symbols-outlined text-sm">location_on</span>
            Localização de Eventos
          </span>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 text-indigo-500 text-xs font-bold rounded-full">
            <span className="material-symbols-outlined text-sm">route</span>
            Rotas Otimizadas
          </span>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full">
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            Logística Integrada
          </span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
