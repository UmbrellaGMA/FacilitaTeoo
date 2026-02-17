# Sistema de Assinaturas nos Contratos

## Visão Geral

O sistema de assinaturas nos contratos foi implementado com sucesso! Agora você pode:

1. **Cadastrar assinaturas da empresa** nas configurações
2. **Usar tags especiais** nos templates de contratos
3. **Assinaturas aparecem automaticamente** quando o contrato é visualizado ou assinado

---

## 🚀 Como Configurar

### 1. Criar a Tabela no Supabase

Primeiro, precisamos criar a tabela `admin_signatures` no banco de dados:

1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá em **SQL Editor**
3. Execute o script SQL que está no arquivo `create_admin_signatures_table.sql`
4. Clique em **Run** para executar

**Ou execute este comando SQL diretamente:**

```sql
-- Create admin_signatures table
CREATE TABLE IF NOT EXISTS admin_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    signature_data TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_signatures_user_id ON admin_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_signatures_default ON admin_signatures(user_id, is_default) WHERE is_default = true;

ALTER TABLE admin_signatures ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own signatures"
    ON admin_signatures FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own signatures"
    ON admin_signatures FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signatures"
    ON admin_signatures FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signatures"
    ON admin_signatures FOR DELETE
    USING (auth.uid() = user_id);
```

---

## 📝 Como Usar

### 1. Cadastrar Assinaturas da Empresa

1. Vá em **Ajustes** (ícone de engrenagem na sidebar)
2. Role até a seção **"Assinaturas da Empresa"**
3. Clique em **"Nova Assinatura"**
4. Digite um nome para a assinatura (ex: "Diretor", "Gerente", "Empresa")
5. Desenhe a assinatura no campo
6. Clique em **"Confirmar Assinatura"**

**Dica:** A primeira assinatura cadastrada será definida automaticamente como padrão. Você pode alterar a assinatura padrão clicando em "Tornar Padrão" em qualquer outra assinatura.

### 2. Usar Tags nos Templates de Contrato

Ao criar ou editar um **template de contrato**, use as seguintes tags:

#### Tag para Assinatura do Cliente
```
[assinatura cliente]
```
- Esta tag será substituída por um campo vazio antes da assinatura
- Após o cliente assinar, a assinatura aparecerá aqui

#### Tag para Assinatura da Empresa
```
[assinatura LOCATARIA]
```
- Esta tag será substituída pela assinatura padrão cadastrada nas configurações
- A assinatura aparece automaticamente quando o contrato é criado

### 3. Criar Contratos com Assinaturas

1. Vá em **Contratos** → **Modelos**
2. Edite ou crie um novo template
3. No editor de texto, insira as tags de assinatura onde desejar:
   - Use a categoria **"Assinaturas"** no painel lateral de tags
   - Ou digite manualmente `[assinatura cliente]` ou `[assinatura LOCATARIA]`

**Exemplo de template:**

```
CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS

...conteúdo do contrato...

PARTES CONTRATANTES:

LOCATÁRIA:
Nome: [Nome da Empresa]
CNPJ: [CNPJ]
Assinatura: [assinatura LOCATARIA]
________________________________


LOCATÁRIO:
Nome: [Nome do Cliente]
CPF: [CPF do Cliente]
Assinatura: [assinatura cliente]
________________________________
```

### 4. Como Funciona

1. **Ao criar o contrato:**
   - A tag `[assinatura LOCATARIA]` é substituída pela assinatura padrão da empresa
   - A tag `[assinatura cliente]` mostra "[Aguardando Assinatura do Cliente]"

2. **Ao enviar para o cliente:**
   - O cliente vê a assinatura da empresa já preenchida
   - O cliente pode assinar digitalmente

3. **Após a assinatura:**
   - A assinatura do cliente substitui a tag `[assinatura cliente]`
   - Ambas as assinaturas aparecem no contrato final

---

## 🎨 Recursos Adicionais

### Múltiplas Assinaturas

Você pode cadastrar várias assinaturas diferentes:
- Assinatura do diretor
- Assinatura do gerente
- Assinatura da empresa (logo)

A assinatura marcada como **padrão** será usada automaticamente nos contratos.

### Editar Assinaturas

1. Vá em **Ajustes** → **Assinaturas da Empresa**
2. Clique em **"Editar"** na assinatura desejada
3. Modifique o nome ou redesenhe a assinatura
4. Salve as alterações

### Excluir Assinaturas

1. Vá em **Ajustes** → **Assinaturas da Empresa**
2. Clique em **"Excluir"** na assinatura desejada
3. Confirme a exclusão

**Atenção:** Contratos já criados não serão afetados ao excluir uma assinatura.

---

## ⚠️ Notas Importantes

1. **Assinatura Padrão:** Apenas uma assinatura pode ser marcada como padrão por vez
2. **Case-Insensitive:** As tags funcionam independente de maiúsculas/minúsculas
   - `[assinatura cliente]` = `[ASSINATURA CLIENTE]`
   - `[assinatura LOCATARIA]` = `[ASSINATURA LOCATARIA]`
3. **Primeiro Uso:** A primeira assinatura cadastrada automaticamente vira a padrão
4. **Segurança:** Cada usuário só pode ver e gerenciar suas próprias assinaturas

---

## 🐛 Solução de Problemas

### Assinatura da empresa não aparece no contrato
- Verifique se você cadastrou uma assinatura padrão em **Ajustes**
- Verifique se a tag está correta: `[assinatura LOCATARIA]`

### Não consigo cadastrar assinatura
- Verifique se a tabela `admin_signatures` foi criada no Supabase
- Verifique as RLS policies no Supabase

### Assinatura aparece muito grande ou pequena
- As assinaturas são automaticamente redimensionadas para caber no contrato
- Altura máxima: 64px (16rem)
- Largura máxima: 200px

---

## 📞 Suporte

Se encontrar problemas ou tiver dúvidas, entre em contato através do suporte técnico.
