-- =====================================================
-- CORREÇÃO: Permitir acesso público para assinatura de contratos via link
-- Visitantes (sem login) precisam:
--   1. Ler o contrato pelo share_token
--   2. Atualizar o contrato para salvar a assinatura
--   3. Ler a assinatura da empresa (admin_signatures)
-- =====================================================

-- 0. Garantir que a coluna share_token existe na tabela contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS share_token TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- Criar índice para busca rápida por share_token
CREATE INDEX IF NOT EXISTS idx_contracts_share_token ON contracts(share_token) WHERE share_token IS NOT NULL;

-- 1. Remover políticas públicas anteriores (caso existam) para recriar
DROP POLICY IF EXISTS "Public can view contracts with share_token" ON contracts;
DROP POLICY IF EXISTS "Public can sign contracts with share_token" ON contracts;
DROP POLICY IF EXISTS "Public can view admin signatures for contracts" ON admin_signatures;

-- 2. Permitir leitura pública de contratos que possuem share_token (papel anon)
CREATE POLICY "Public can view contracts with share_token"
    ON contracts FOR SELECT
    TO anon
    USING (share_token IS NOT NULL);

-- 3. Permitir que visitantes assinem contratos (update via papel anon)
CREATE POLICY "Public can sign contracts with share_token"
    ON contracts FOR UPDATE
    TO anon
    USING (share_token IS NOT NULL)
    WITH CHECK (share_token IS NOT NULL);

-- 4. Permitir leitura pública APENAS de assinaturas padrão (is_default = true)
-- Restringe acesso anônimo para não expor todas as assinaturas
CREATE POLICY "Public can view admin signatures for contracts"
    ON admin_signatures FOR SELECT
    TO anon
    USING (is_default = true);

-- =====================================================
-- PRONTO! Agora visitantes podem acessar e assinar contratos via link.
-- =====================================================
