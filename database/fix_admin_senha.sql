-- Corrige senha do admin para admin123 (hash bcrypt válido)
-- Rode se o login falhar com "Credenciais inválidas" mesmo com senha correta:
--   mysql -u root -p frete_portal < database/fix_admin_senha.sql

USE frete_portal;

UPDATE usuarios
SET senha_hash = '$2a$12$fTu.rhXMfEOjWSqj2nByeeOFpIyRuHKfuNxRTp3eW1m7mp/B8.75m'
WHERE login = 'fernando.alves' OR email = 'fernandograupneralves@gmail.com';
