-- =====================================================
-- CORREÇÃO: Adicionar RLS para user_profiles
-- Execute este script no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Habilitar RLS na tabela user_profiles (se não estiver)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que usuários vejam seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- 3. Permitir que usuários atualizem seu próprio perfil  
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- 4. Permitir que MASTER veja todos os perfis (para o AdminPanel)
DROP POLICY IF EXISTS "Master can view all profiles" ON user_profiles;
CREATE POLICY "Master can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'MASTER'
    )
  );

-- 5. Permitir que MASTER atualize todos os perfis
DROP POLICY IF EXISTS "Master can update all profiles" ON user_profiles;
CREATE POLICY "Master can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'MASTER'
    )
  );

-- 6. Permitir que MASTER delete perfis (exceto is_deletable = false)
DROP POLICY IF EXISTS "Master can delete profiles" ON user_profiles;
CREATE POLICY "Master can delete profiles" ON user_profiles
  FOR DELETE USING (
    is_deletable = true AND
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() AND up.role = 'MASTER'
    )
  );

-- 7. Verificar se o admin existe e tem role MASTER
SELECT id, email, role, status FROM user_profiles WHERE email = 'admin@facilitatoo.com';
