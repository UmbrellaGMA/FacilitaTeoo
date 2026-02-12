
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, parseCurrencyToNumber } from '../lib/formatters';


interface Equipment {
  id: string;
  name: string;
  category: string;
  total: number;
  in_use: number;
  status: string;
  unit_price: number;
  user_id?: string;
}

const CATEGORIES = ['Todos', 'Som & Áudio', 'Iluminação', 'Mobiliário', 'Estruturas', 'Audiovisual', 'Outros'];

const ICONS: Record<string, string> = {
  'Som & Áudio': 'speaker',
  'Iluminação': 'lightbulb',
  'Mobiliário': 'chair',
  'Estruturas': 'foundation',
  'Audiovisual': 'videocam',
  'Outros': 'inventory_2',
};

const EquipmentView: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Som & Áudio',
    total: 1,
    in_use: 0,
    status: 'available',
    unit_price: 0,
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });

    if (data && !error) {
      setEquipment(data);
    }
    setLoading(false);
  };

  const openModal = (item?: Equipment) => {
    if (item) {
      setEditingEquipment(item);
      setFormData({
        name: item.name,
        category: item.category || 'Outros',
        total: item.total,
        in_use: item.in_use,
        status: item.status,
        unit_price: item.unit_price || 0,
      });
    } else {
      setEditingEquipment(null);
      setFormData({
        name: '',
        category: 'Som & Áudio',
        total: 1,
        in_use: 0,
        status: 'available',
        unit_price: 0,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEquipment(null);
  };

  const saveEquipment = async () => {
    if (!formData.name.trim()) return;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (editingEquipment) {
      await supabase
        .from('equipment')
        .update({
          name: formData.name,
          category: formData.category,
          total: formData.total,
          in_use: formData.in_use,
          status: formData.status,
          unit_price: formData.unit_price,
        })
        .eq('id', editingEquipment.id);
    } else {
      await supabase
        .from('equipment')
        .insert({
          name: formData.name,
          category: formData.category,
          total: formData.total,
          in_use: formData.in_use,
          status: formData.status,
          unit_price: formData.unit_price,
          user_id: user?.id,
        });
    }

    closeModal();
    fetchEquipment();
  };

  const deleteEquipment = async (id: string) => {
    if (!confirm('Deseja excluir este equipamento?')) return;
    await supabase.from('equipment').delete().eq('id', id);
    fetchEquipment();
  };

  const getStatusDisplay = (status: string) => {
    const styles: Record<string, { label: string; class: string }> = {
      available: { label: 'DISPONÍVEL', class: 'bg-emerald-500 text-white' },
      maintenance: { label: 'EM MANUTENÇÃO', class: 'bg-amber-500 text-white' },
      reserved: { label: 'RESERVADO', class: 'bg-indigo-500 text-white' },
    };
    return styles[status] || styles.available;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredEquipment = selectedCategory === 'Todos'
    ? equipment
    : equipment.filter(e => e.category === selectedCategory);

  // Calculate total value of all equipment services (not multiplied by quantity)
  const totalEquipmentValue = equipment.reduce((sum, e) => sum + (e.unit_price || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-[#161118] dark:text-white tracking-tight">Equipamentos</h1>
          <p className="text-[#7c6189] dark:text-purple-200/70 text-sm md:text-lg mt-1">Gestão de inventário e disponibilidade para eventos.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white font-bold px-4 md:px-8 py-2.5 md:py-3.5 rounded-xl flex items-center gap-2 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 text-sm md:text-base w-full md:w-auto justify-center"
        >
          <span className="material-symbols-outlined text-lg md:text-xl">add_box</span>
          <span className="hidden sm:inline">Cadastrar</span> Equipamento
        </button>
      </div>

      {/* Info Cards about Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* EQUIPAMENTOS Tag Info */}
        <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-500/10 dark:to-fuchsia-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">inventory_2</span>
          </div>
          <div>
            <h3 className="font-bold text-purple-900 dark:text-purple-300">Tag [EQUIPAMENTOS]</h3>
            <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
              Ao usar a tag <code className="bg-purple-200 dark:bg-purple-500/30 px-1.5 py-0.5 rounded font-mono text-xs">[EQUIPAMENTOS]</code> no contrato,
              o sistema listará automaticamente todos os equipamentos selecionados durante a criação do contrato.
            </p>
          </div>
        </div>

        {/* VALORPRONTO Tag Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">payments</span>
          </div>
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-300">Tag [VALORPRONTO]</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Defina o valor do serviço de cada equipamento. Ao usar a tag <code className="bg-blue-200 dark:bg-blue-500/30 px-1.5 py-0.5 rounded font-mono text-xs">[VALORPRONTO]</code> no contrato,
              o sistema calculará automaticamente o valor total somando os preços de serviço dos equipamentos selecionados.
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-500 mt-2 font-medium">
              Valor total do inventário: <span className="font-bold">{formatCurrency(totalEquipmentValue)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {CATEGORIES.map((cat, i) => (
          <button
            key={i}
            onClick={() => setSelectedCategory(cat)}
            className={`
              px-6 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all
              ${selectedCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-white/5 border border-[#e2dbe6] dark:border-[#31253a] text-slate-500 hover:border-primary/50'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredEquipment.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-6xl text-[#7c6189]/30 mb-4">inventory_2</span>
          <p className="text-lg font-bold text-[#7c6189]">Nenhum equipamento cadastrado</p>
          <p className="text-sm text-[#7c6189]/70">Clique em "Cadastrar Equipamento" para adicionar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEquipment.map((item) => {
            const statusInfo = getStatusDisplay(item.status);
            const icon = ICONS[item.category] || 'inventory_2';
            return (
              <div key={item.id} className="bg-white dark:bg-white/5 rounded-2xl border border-[#e2dbe6] dark:border-[#31253a] shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="p-5">
                  {/* Status and Price Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                    {item.unit_price > 0 && (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
                        {formatCurrency(item.unit_price)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-[#7c6189]">
                        {icon}
                      </span>
                      <h3 className="text-base font-bold text-[#161118] dark:text-white group-hover:text-primary transition-colors">{item.name}</h3>
                    </div>
                    <div className="relative group/menu">
                      <button className="text-[#7c6189] hover:text-primary transition-colors p-1">
                        <span className="material-symbols-outlined text-xl">more_vert</span>
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-[#e2dbe6] dark:border-[#31253a] opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 min-w-[120px]">
                        <button
                          onClick={() => openModal(item)}
                          className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span> Editar
                        </button>
                        <button
                          onClick={() => deleteEquipment(item.id)}
                          className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c6189] mb-4">Cat: {item.category}</p>

                  <div className="flex items-center justify-between border-t border-[#e2dbe6] dark:border-[#31253a] pt-4">
                    <span className="text-[10px] uppercase font-bold text-[#7c6189]">Quantidade</span>
                    <span className="text-sm font-black">{item.total} unidades</span>
                  </div>

                  {/* Service Value for this equipment (not multiplied by quantity) */}
                  {item.unit_price > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#e2dbe6] dark:border-[#31253a]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[#7c6189]">Valor do Serviço</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.unit_price)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={() => openModal()}
            className="aspect-square md:aspect-auto border-2 border-dashed border-[#e2dbe6] dark:border-[#31253a] rounded-2xl flex flex-col items-center justify-center p-8 text-[#7c6189] hover:text-primary hover:border-primary/50 transition-all bg-white/50 dark:bg-white/0 group shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-5xl mb-3 group-hover:scale-110 transition-transform">add_circle</span>
            <span className="font-bold text-sm">Adicionar Equipamento</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#e2dbe6] dark:border-[#31253a]">
              <h2 className="text-xl font-bold text-[#161118] dark:text-white">
                {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7c6189] mb-2 block">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Caixa de Som JBL"
                  className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7c6189] mb-2 block">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                >
                  {CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price Field */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7c6189] mb-2 block flex items-center gap-2">
                  Valor Unitário (R$)
                  <span className="text-[10px] font-medium text-blue-500 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">[VALORPRONTO]</span>
                </label>
                <div className="relative">

                  <input
                    type="text"
                    value={formatCurrency(formData.unit_price)}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseCurrencyToNumber(e.target.value) })}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                  />

                </div>
                <p className="text-[10px] text-slate-400 mt-1">Este valor será usado ao aplicar a tag [VALORPRONTO] no contrato</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#7c6189] mb-2 block">Qtd. Total</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.total || ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, total: raw ? parseInt(raw, 10) : 0 });
                    }}
                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#7c6189] mb-2 block">Em Uso</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.in_use || ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, in_use: raw ? parseInt(raw, 10) : 0 });
                    }}
                    className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                  />

                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7c6189] mb-2 block">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-[#f3f0f4] dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
                >
                  <option value="available">Disponível</option>
                  <option value="maintenance">Em Manutenção</option>
                  <option value="reserved">Reservado</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[#e2dbe6] dark:border-[#31253a] flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEquipment}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all"
              >
                {editingEquipment ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentView;
