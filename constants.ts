
import { EventData, LeadData, Equipment, Contract } from './types';

export const RECENT_LEADS: LeadData[] = [
  { id: '1', name: 'Mariana Bittencourt', interest: 'Festas de Formatura', timeAgo: 'Há 2 horas', initials: 'MB', color: 'bg-primary' },
  { id: '2', name: 'Guilherme Santos', interest: 'Aluguel de Equipamento', timeAgo: 'Há 5 horas', initials: 'GS', color: 'bg-blue-500' },
  { id: '3', name: 'Lúcia Cavalcanti', interest: 'Buffet Completo', timeAgo: 'Ontem', initials: 'LC', color: 'bg-emerald-500' },
];

export const UPCOMING_EVENTS: EventData[] = [
  { id: '8234', title: 'Casamento Aline & João', location: 'Villa dos Ventos', date: '24 Jun', time: '18:00 - 02:00', guests: 150, status: 'CONFIRMADO', type: 'Casamento' },
  { id: '8235', title: 'Convenção Corporativa TechX', location: 'Auditório Central', date: '28 Jun', time: '09:00 - 18:00', guests: 500, status: 'PENDENTE', type: 'Corporativo' },
];

export const EQUIPMENT_LIST: Equipment[] = [
  { id: '1', name: 'Sistema de Som PA 1200W', category: 'Som & Áudio', total: 8, inUse: 2, status: 'DISPONÍVEL', icon: 'speaker' },
  { id: '2', name: 'Canhão de LED RGBW', category: 'Iluminação', total: 24, inUse: 18, status: 'EM MANUTENÇÃO', icon: 'lightbulb' },
  { id: '3', name: 'Cadeira Tiffany Cristal', category: 'Mobiliário', total: 350, inUse: 120, status: 'DISPONÍVEL', icon: 'chair' },
  { id: '4', name: 'Projetor Laser 5000 Lumens', category: 'Audiovisual', total: 4, inUse: 4, status: 'EM USO', icon: 'videocam' },
];

export const CONTRACT_LIST: Contract[] = [
  { id: '#8234', client: 'Aline Barros', clientInitials: 'AB', type: 'Casamento', date: '24 Jun 2024', weekday: 'Sábado, 19:00', value: 'R$ 12.500,00', status: 'ASSINADO' },
  { id: '#8235', client: 'TechX Corp', clientInitials: 'TX', type: 'Corporativo', date: '28 Jun 2024', weekday: 'Quarta, 09:00', value: 'R$ 35.000,00', status: 'PENDENTE ASSINATURA' },
  { id: '#8236', client: 'Mariana Bittencourt', clientInitials: 'MB', type: 'Formatura', date: '12 Jul 2024', weekday: 'Sexta, 21:00', value: 'R$ 18.200,00', status: 'RASCUNHO' },
  { id: '#8237', client: 'Guilherme Santos', clientInitials: 'GS', type: 'Aniversário', date: '15 Jul 2024', weekday: 'Segunda, 18:00', value: 'R$ 4.800,00', status: 'ASSINADO' },
];
