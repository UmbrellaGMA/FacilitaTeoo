-- SCRIPT DE DIAGNÓSTICO
-- Execute e veja os resultados na aba "Results"

-- 1. Verifique se o usuário admin existe no auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@facilitatoo.com';

-- 2. Verifique se o perfil existe e qual a role
SELECT * FROM user_profiles WHERE email = 'admin@facilitatoo.com';

-- 3. Verifique se há duplicatas ou inconsistências
SELECT count(*) as total_admins FROM user_profiles WHERE role = 'MASTER';

-- 4. Tente simular a policy (substitua o ID abaixo pelo ID retornado no passo 1 se quiser testar manualmente)
-- SELECT * FROM user_profiles WHERE id = 'ID_DO_USUARIO_AQUI';
