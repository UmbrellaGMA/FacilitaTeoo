
export type ViewType =
  | 'dashboard'
  | 'clients'
  | 'equipment'
  | 'contracts'
  | 'events'
  | 'calendar'
  | 'settings'
  | 'admin';

export type UserRole = 'MASTER' | 'ADMIN' | 'USER';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  status: string;
  is_deletable: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface EventData {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  guests: number;
  status: 'CONFIRMADO' | 'PENDENTE' | 'RASCUNHO' | 'ORÇAMENTO' | 'FINALIZADO';
  type: string;
}

export interface LeadData {
  id: string;
  name: string;
  interest: string;
  timeAgo: string;
  initials: string;
  color: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  total: number;
  inUse: number;
  status: 'DISPONÍVEL' | 'EM MANUTENÇÃO' | 'EM USO';
  icon: string;
}

export interface Contract {
  id: string;
  client: string;
  clientInitials: string;
  type: string;
  date: string;
  weekday: string;
  value: string;
  status: 'ASSINADO' | 'PENDENTE ASSINATURA' | 'RASCUNHO';
}

export interface PlatformSettings {
  id: string;
  site_name: string;
  site_logo_url?: string;
  site_description?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  primary_color?: string;
  secondary_color?: string;
  support_email?: string;
  support_phone?: string;
}
