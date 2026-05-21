-- Migração: login por nome de usuário (bases criadas antes do campo `login`)
-- Execute no MySQL após atualizar o código do portal:
--   mysql -u root -p frete_portal < database/migration_usuario_login.sql

USE frete_portal;

-- 1) Coluna opcional até preenchermos todas as linhas
ALTER TABLE usuarios ADD COLUMN login VARCHAR(80) NULL UNIQUE COMMENT 'Nome de usuário para entrar no portal' AFTER nome;

-- 2) Admin padrão do seed antigo -> fernando.alves
UPDATE usuarios SET login = 'fernando.alves' WHERE email = 'admin@drylock.com.br' AND login IS NULL;

-- 3) Demais usuários: prefixo estável único (ajuste manual se quiser outro padrão)
UPDATE usuarios SET login = CONCAT('user_', id) WHERE login IS NULL;

-- 4) Tornar obrigatório
ALTER TABLE usuarios MODIFY login VARCHAR(80) NOT NULL;
