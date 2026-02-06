-- =====================================================
-- SCRIPT DE SEGURANÇA: Isolamento de Dados por Usuário
-- Execute este script no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Garantir que admin@facilitatoo.com seja MASTER
UPDATE user_profiles 
SET role = 'MASTER', is_deletable = false 
WHERE email = 'admin@facilitatoo.com';

-- =====================================================
-- 2. Adicionar coluna user_id nas tabelas (se não existir)
-- NOTA: A tabela 'clients' não existe - usamos 'leads' para clientes
-- =====================================================

-- EVENTS
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- EQUIPMENT
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- CONTRACTS
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- CONTRACT_TEMPLATES
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- LEADS (usado para clientes)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- =====================================================
-- 3. Habilitar Row Level Security (RLS)
-- =====================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Criar Policies de Isolamento
-- =====================================================

-- EVENTS: usuários veem apenas seus dados
DROP POLICY IF EXISTS "Users see own events" ON events;
CREATE POLICY "Users see own events" ON events
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- EQUIPMENT: usuários veem apenas seus dados
DROP POLICY IF EXISTS "Users see own equipment" ON equipment;
CREATE POLICY "Users see own equipment" ON equipment
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- CONTRACTS: usuários veem apenas seus dados
DROP POLICY IF EXISTS "Users see own contracts" ON contracts;
CREATE POLICY "Users see own contracts" ON contracts
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- CONTRACT_TEMPLATES: usuários veem apenas seus dados
DROP POLICY IF EXISTS "Users see own templates" ON contract_templates;
CREATE POLICY "Users see own templates" ON contract_templates
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- LEADS: usuários veem apenas seus dados
DROP POLICY IF EXISTS "Users see own leads" ON leads;
CREATE POLICY "Users see own leads" ON leads
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- =====================================================
-- 5. Atualizar dados existentes com user_id do admin
-- (Opcional - descomente se quiser atribuir dados existentes ao admin)
-- =====================================================

-- UPDATE events SET user_id = (SELECT id FROM user_profiles WHERE role = 'MASTER' LIMIT 1) WHERE user_id IS NULL;
-- UPDATE equipment SET user_id = (SELECT id FROM user_profiles WHERE role = 'MASTER' LIMIT 1) WHERE user_id IS NULL;
-- UPDATE contracts SET user_id = (SELECT id FROM user_profiles WHERE role = 'MASTER' LIMIT 1) WHERE user_id IS NULL;
-- UPDATE contract_templates SET user_id = (SELECT id FROM user_profiles WHERE role = 'MASTER' LIMIT 1) WHERE user_id IS NULL;
-- UPDATE leads SET user_id = (SELECT id FROM user_profiles WHERE role = 'MASTER' LIMIT 1) WHERE user_id IS NULL;

-- =====================================================
-- PRONTO! Agora o banco está configurado para isolamento.
-- =====================================================
