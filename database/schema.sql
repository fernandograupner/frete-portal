-- ============================================================
--  PORTAL FRETE - ESPELHO DE FRETE
--  Execute este arquivo no MySQL para criar tudo:
--  mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS frete_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE frete_portal;

-- ------------------------------------------------------------
-- TABELAS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100)         NOT NULL,
  login      VARCHAR(80)          NOT NULL UNIQUE COMMENT 'Nome de usuário para entrar no portal',
  email      VARCHAR(150)         NOT NULL UNIQUE,
  senha_hash VARCHAR(255)         NOT NULL,
  perfil     ENUM('admin','user') NOT NULL DEFAULT 'user',
  ativo      TINYINT(1)           NOT NULL DEFAULT 1,
  created_at DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messorregioes (
  id    INT          NOT NULL PRIMARY KEY,
  nome  VARCHAR(100) NOT NULL,
  uf    CHAR(2)      NOT NULL,
  ativo TINYINT(1)   NOT NULL DEFAULT 1,
  INDEX idx_uf (uf)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cidades (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  uf          CHAR(2)      NOT NULL,
  meso_id     INT          NOT NULL,
  codigo_ibge BIGINT       NULL,
  INDEX idx_uf   (uf),
  INDEX idx_meso (meso_id),
  INDEX idx_nome (nome),
  FOREIGN KEY (meso_id) REFERENCES messorregioes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  cnpj          VARCHAR(20)       NOT NULL,
  codigo        VARCHAR(20)       NOT NULL,
  loja          VARCHAR(10)       NULL,
  nome          VARCHAR(200)      NOT NULL,
  nome_fantasia VARCHAR(150)      NULL,
  municipio     VARCHAR(100)      NOT NULL,
  uf            CHAR(2)           NOT NULL,
  tipo_frete    ENUM('FOB','CIF') NOT NULL DEFAULT 'CIF',
  paletizado    TINYINT(1)        NOT NULL DEFAULT 0,
  dedicado      TINYINT(1)        NOT NULL DEFAULT 0,
  cidade_id     INT               NULL,
  ativo         TINYINT(1)        NOT NULL DEFAULT 1,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_codigo (codigo),
  INDEX idx_cnpj   (cnpj),
  INDEX idx_uf     (uf),
  FOREIGN KEY (cidade_id) REFERENCES cidades(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tarifas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  meso_id      INT           NOT NULL,
  faixa_min    DECIMAL(10,2) NOT NULL,
  faixa_max    DECIMAL(10,2) NOT NULL,
  valor_m3     DECIMAL(10,4) NOT NULL,
  vigencia_ini DATE          NOT NULL DEFAULT (CURRENT_DATE),
  vigencia_fim DATE          NULL,
  INDEX idx_meso  (meso_id),
  INDEX idx_faixa (faixa_min, faixa_max),
  FOREIGN KEY (meso_id) REFERENCES messorregioes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedagios (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  meso_id      INT           NOT NULL,
  valor_por_m3 DECIMAL(10,4) NOT NULL,
  observacao   VARCHAR(200)  NULL,
  vigencia_ini DATE          NOT NULL DEFAULT (CURRENT_DATE),
  vigencia_fim DATE          NULL,
  FOREIGN KEY (meso_id) REFERENCES messorregioes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS icms_uf (
  uf         CHAR(2)      NOT NULL PRIMARY KEY,
  aliquota   DECIMAL(6,4) NOT NULL,
  observacao VARCHAR(200) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS calculos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT           NOT NULL,
  cliente_id      INT           NOT NULL,
  cidade_id       INT           NOT NULL,
  codigo_m3       VARCHAR(50)   NOT NULL,
  valor_nf        DECIMAL(14,2) NOT NULL,
  m3              DECIMAL(10,3) NOT NULL,
  paletizado      TINYINT(1)    NOT NULL DEFAULT 0,
  qtde_pallets    DECIMAL(10,2) NOT NULL DEFAULT 0,
  dedicado        TINYINT(1)    NOT NULL DEFAULT 0,
  vl_frete_peso   DECIMAL(12,2) NOT NULL DEFAULT 0,
  vl_advalorem    DECIMAL(12,2) NOT NULL DEFAULT 0,
  vl_pedagio      DECIMAL(12,2) NOT NULL DEFAULT 0,
  vl_paletizacao  DECIMAL(12,2) NOT NULL DEFAULT 0,
  vl_dedicado     DECIMAL(12,2) NOT NULL DEFAULT 0,
  vl_sem_icms     DECIMAL(12,2) NOT NULL DEFAULT 0,
  aliquota_icms   DECIMAL(6,4)  NOT NULL DEFAULT 0.12,
  vl_icms         DECIMAL(12,2) NOT NULL DEFAULT 0,
  vl_total        DECIMAL(12,2) NOT NULL DEFAULT 0,
  tarifa_m3_usada DECIMAL(10,4) NULL,
  snapshot_json   JSON          NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuario (usuario_id),
  INDEX idx_cliente (cliente_id),
  INDEX idx_data    (created_at),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (cidade_id)  REFERENCES cidades(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- DADOS INICIAIS
-- ------------------------------------------------------------

-- Usuário admin (senha: admin123)
INSERT INTO usuarios (nome, login, email, senha_hash, perfil) VALUES
('Administrador', 'fernando.alves', 'fernandograupneralves@gmail.com',
 '$2a$12$fTu.rhXMfEOjWSqj2nByeeOFpIyRuHKfuNxRTp3eW1m7mp/B8.75m', 'admin');

-- Messorregiões do Sul
INSERT INTO messorregioes (id, nome, uf) VALUES
(294,'CENTRO OCIDENTAL PARANAENSE','PR'),
(295,'CENTRO ORIENTAL PARANAENSE','PR'),
(296,'CENTRO-SUL PARANAENSE','PR'),
(297,'CERRO AZUL','PR'),
(298,'LAPA','PR'),
(299,'METROPOLITANA CURITIBA','PR'),
(300,'NOROESTE PARANAENSE','PR'),
(301,'NORTE CENTRAL PARANAENSE','PR'),
(302,'NORTE PIONEIRO PARANAENSE','PR'),
(303,'OESTE PARANAENSE','PR'),
(304,'PARANAGUÁ','PR'),
(305,'RIO NEGRO','PR'),
(306,'SUDESTE PARANAENSE','PR'),
(307,'SUDOESTE PARANAENSE','PR'),
(315,'SERRANA','SC'),
(326,'CENTRO OCIDENTAL RIO-GRANDENSE','RS'),
(327,'CENTRO ORIENTAL RIO-GRANDENSE','RS'),
(328,'GRAMADO-CANELA','RS'),
(329,'METROPOLITANA PORTO ALEGRE','RS'),
(330,'MONTENEGRO','RS'),
(331,'NORDESTE RIO-GRANDENSE','RS'),
(332,'NOROESTE RIO-GRANDENSE','RS'),
(333,'OSÓRIO','RS'),
(334,'SÃO JERÔNIMO','RS'),
(335,'SUDESTE RIO-GRANDENSE','RS'),
(336,'SUDOESTE RIO GRANDENSE','RS'),
(337,'GRANDE FLORIANÓPOLIS','SC'),
(338,'NORTE CATARINENSE','SC'),
(339,'OESTE CATARINENSE','SC'),
(340,'SUL CATARINENSE','SC'),
(341,'VALE DO ITAJAÍ','SC');

-- ICMS
INSERT INTO icms_uf (uf, aliquota, observacao) VALUES
('PR', 0.12, 'SP → PR interestadual 12%'),
('SC', 0.12, 'SP → SC interestadual 12%'),
('RS', 0.12, 'SP → RS interestadual 12%');

-- Cidades
INSERT INTO cidades (nome, uf, meso_id, codigo_ibge) VALUES
('Altamira do Paraná','PR',294,4100459),
('Campo Mourão','PR',294,4104303),
('Goioerê','PR',294,4108601),
('Ubiratã','PR',294,4128005),
('Arapoti','PR',295,4101606),
('Castro','PR',295,4104907),
('Ponta Grossa','PR',295,4119905),
('Telêmaco Borba','PR',295,4127106),
('Guarapuava','PR',296,4109401),
('Pato Branco','PR',307,4118501),
('Francisco Beltrão','PR',307,4108304),
('Dois Vizinhos','PR',307,4107157),
('Curitiba','PR',299,4106902),
('São José dos Pinhais','PR',299,4125506),
('Pinhais','PR',299,4119152),
('Araucária','PR',299,4101804),
('Colombo','PR',299,4105706),
('Almirante Tamandaré','PR',299,4100400),
('Londrina','PR',301,4113700),
('Cambé','PR',301,4103604),
('Apucarana','PR',301,4101200),
('Arapongas','PR',301,4101507),
('Maringá','PR',301,4115200),
('Sarandi','PR',301,4126272),
('Paiçandu','PR',301,4117602),
('Cascavel','PR',303,4104808),
('Foz do Iguaçu','PR',303,4108304),
('Toledo','PR',303,4127700),
('Paranaguá','PR',304,4118204),
('Morretes','PR',304,4116307),
('Rio Negro','PR',305,4122206),
('Irati','PR',306,4110201),
('Florianópolis','SC',337,4205407),
('São José','SC',337,4216602),
('Palhoça','SC',337,4215802),
('Biguaçu','SC',337,4202404),
('Joinville','SC',338,4209102),
('Jaraguá do Sul','SC',338,4208906),
('São Bento do Sul','SC',338,4216909),
('Chapecó','SC',339,4204202),
('Xanxerê','SC',339,4223907),
('Joaçaba','SC',339,4209003),
('Criciúma','SC',340,4204608),
('Tubarão','SC',340,4218707),
('Araranguá','SC',340,4101606),
('Balneário Rincão','SC',340,4200051),
('Blumenau','SC',341,4202404),
('Itajaí','SC',341,4207007),
('Brusque','SC',341,4202800),
('Tijucas','SC',341,4218400),
('Lages','SC',315,4209300),
('Curitibanos','SC',315,4206009),
('Porto Alegre','RS',329,4314902),
('Gravataí','RS',329,4309209),
('Alvorada','RS',329,4300604),
('Viamão','RS',329,4322400),
('Cachoeirinha','RS',329,4303103),
('Novo Hamburgo','RS',329,4313409),
('São Leopoldo','RS',329,4318705),
('Canoas','RS',329,4304606),
('Caxias do Sul','RS',331,4305108),
('Passo Fundo','RS',331,4314100),
('Bento Gonçalves','RS',331,4302303),
('Gramado','RS',328,4309100),
('Canela','RS',328,4304200),
('Novo Hamburgo','RS',329,4313409),
('Santa Maria','RS',326,4316907),
('Santa Cruz do Sul','RS',327,4316006),
('Pelotas','RS',335,4314007),
('Rio Grande','RS',335,4315602),
('Bagé','RS',336,4301602),
('Osório','RS',333,4313755),
('Cachoeira do Sul','RS',327,4302808),
('São Jerônimo','RS',334,4318408),
('Montenegro','RS',330,4312401),
('Nova Santa Rita','RS',329,4313391);

-- Tarifas completas (todas as 31 messorregiões × 7 faixas)
INSERT INTO tarifas (meso_id, faixa_min, faixa_max, valor_m3) VALUES
-- PR 294
(294,0.01,3.00,181.90),(294,3.01,5.00,177.65),(294,5.01,10.00,174.25),(294,10.01,20.00,170.00),(294,20.01,40.00,166.60),(294,40.01,60.00,150.45),(294,60.01,999999,145.35),
-- PR 295
(295,0.01,3.00,181.90),(295,3.01,5.00,177.65),(295,5.01,10.00,174.25),(295,10.01,20.00,170.00),(295,20.01,40.00,166.60),(295,40.01,60.00,150.45),(295,60.01,999999,145.35),
-- PR 296
(296,0.01,3.00,181.90),(296,3.01,5.00,177.65),(296,5.01,10.00,174.25),(296,10.01,20.00,170.00),(296,20.01,40.00,166.60),(296,40.01,60.00,150.45),(296,60.01,999999,145.35),
-- PR 297
(297,0.01,3.00,181.90),(297,3.01,5.00,177.65),(297,5.01,10.00,174.25),(297,10.01,20.00,170.00),(297,20.01,40.00,166.60),(297,40.01,60.00,150.45),(297,60.01,999999,145.35),
-- PR 298
(298,0.01,3.00,175.10),(298,3.01,5.00,170.85),(298,5.01,10.00,168.30),(298,10.01,20.00,164.05),(298,20.01,40.00,160.65),(298,40.01,60.00,144.50),(298,60.01,999999,140.25),
-- PR 299
(299,0.01,3.00,149.60),(299,3.01,5.00,145.35),(299,5.01,10.00,142.80),(299,10.01,20.00,139.40),(299,20.01,40.00,136.85),(299,40.01,60.00,124.95),(299,60.01,999999,123.25),
-- PR 300
(300,0.01,3.00,181.90),(300,3.01,5.00,177.65),(300,5.01,10.00,174.25),(300,10.01,20.00,170.00),(300,20.01,40.00,166.60),(300,40.01,60.00,150.45),(300,60.01,999999,145.35),
-- PR 301
(301,0.01,3.00,181.90),(301,3.01,5.00,177.65),(301,5.01,10.00,174.25),(301,10.01,20.00,170.00),(301,20.01,40.00,166.60),(301,40.01,60.00,150.45),(301,60.01,999999,145.35),
-- PR 302
(302,0.01,3.00,181.90),(302,3.01,5.00,177.65),(302,5.01,10.00,174.25),(302,10.01,20.00,170.00),(302,20.01,40.00,166.60),(302,40.01,60.00,150.45),(302,60.01,999999,145.35),
-- PR 303
(303,0.01,3.00,181.90),(303,3.01,5.00,177.65),(303,5.01,10.00,174.25),(303,10.01,20.00,170.00),(303,20.01,40.00,166.60),(303,40.01,60.00,150.45),(303,60.01,999999,145.35),
-- PR 304
(304,0.01,3.00,175.10),(304,3.01,5.00,170.85),(304,5.01,10.00,168.30),(304,10.01,20.00,164.05),(304,20.01,40.00,160.65),(304,40.01,60.00,144.50),(304,60.01,999999,140.25),
-- PR 305
(305,0.01,3.00,175.10),(305,3.01,5.00,170.85),(305,5.01,10.00,168.30),(305,10.01,20.00,164.05),(305,20.01,40.00,160.65),(305,40.01,60.00,144.50),(305,60.01,999999,140.25),
-- PR 306
(306,0.01,3.00,181.90),(306,3.01,5.00,177.65),(306,5.01,10.00,174.25),(306,10.01,20.00,170.00),(306,20.01,40.00,166.60),(306,40.01,60.00,150.45),(306,60.01,999999,145.35),
-- PR 307
(307,0.01,3.00,181.90),(307,3.01,5.00,177.65),(307,5.01,10.00,174.25),(307,10.01,20.00,170.00),(307,20.01,40.00,166.60),(307,40.01,60.00,150.45),(307,60.01,999999,145.35),
-- SC 315
(315,0.01,3.00,202.30),(315,3.01,5.00,197.20),(315,5.01,10.00,193.80),(315,10.01,20.00,188.70),(315,20.01,40.00,184.45),(315,40.01,60.00,167.45),(315,60.01,999999,162.35),
-- RS 326
(326,0.01,3.00,154.70),(326,3.01,5.00,152.15),(326,5.01,10.00,149.60),(326,10.01,20.00,147.05),(326,20.01,40.00,144.50),(326,40.01,60.00,141.95),(326,60.01,999999,139.40),
-- RS 327
(327,0.01,3.00,154.70),(327,3.01,5.00,152.15),(327,5.01,10.00,149.60),(327,10.01,20.00,147.05),(327,20.01,40.00,144.50),(327,40.01,60.00,141.95),(327,60.01,999999,139.40),
-- RS 328
(328,0.01,3.00,154.70),(328,3.01,5.00,152.15),(328,5.01,10.00,149.60),(328,10.01,20.00,147.05),(328,20.01,40.00,144.50),(328,40.01,60.00,141.95),(328,60.01,999999,139.40),
-- RS 329
(329,0.01,3.00,135.15),(329,3.01,5.00,132.60),(329,5.01,10.00,130.05),(329,10.01,20.00,128.35),(329,20.01,40.00,124.95),(329,40.01,60.00,122.40),(329,60.01,999999,119.85),
-- RS 330
(330,0.01,3.00,154.70),(330,3.01,5.00,152.15),(330,5.01,10.00,149.60),(330,10.01,20.00,147.05),(330,20.01,40.00,144.50),(330,40.01,60.00,141.95),(330,60.01,999999,139.40),
-- RS 331
(331,0.01,3.00,154.70),(331,3.01,5.00,152.15),(331,5.01,10.00,149.60),(331,10.01,20.00,147.05),(331,20.01,40.00,144.50),(331,40.01,60.00,141.95),(331,60.01,999999,139.40),
-- RS 332
(332,0.01,3.00,142.80),(332,3.01,5.00,140.25),(332,5.01,10.00,137.70),(332,10.01,20.00,137.70),(332,20.01,40.00,132.60),(332,40.01,60.00,130.05),(332,60.01,999999,128.35),
-- RS 333
(333,0.01,3.00,142.80),(333,3.01,5.00,140.25),(333,5.01,10.00,137.70),(333,10.01,20.00,137.70),(333,20.01,40.00,132.60),(333,40.01,60.00,130.05),(333,60.01,999999,128.35),
-- RS 334
(334,0.01,3.00,142.80),(334,3.01,5.00,140.25),(334,5.01,10.00,137.70),(334,10.01,20.00,137.70),(334,20.01,40.00,132.60),(334,40.01,60.00,130.05),(334,60.01,999999,128.35),
-- RS 335
(335,0.01,3.00,181.90),(335,3.01,5.00,177.65),(335,5.01,10.00,174.25),(335,10.01,20.00,170.00),(335,20.01,40.00,166.60),(335,40.01,60.00,150.45),(335,60.01,999999,149.60),
-- RS 336
(336,0.01,3.00,181.90),(336,3.01,5.00,177.65),(336,5.01,10.00,174.25),(336,10.01,20.00,170.00),(336,20.01,40.00,166.60),(336,40.01,60.00,150.45),(336,60.01,999999,149.60),
-- SC 337
(337,0.01,3.00,166.60),(337,3.01,5.00,161.50),(337,5.01,10.00,159.80),(337,10.01,20.00,154.70),(337,20.01,40.00,149.60),(337,40.01,60.00,139.40),(337,60.01,999999,136.85),
-- SC 338
(338,0.01,3.00,170.85),(338,3.01,5.00,166.60),(338,5.01,10.00,163.20),(338,10.01,20.00,159.80),(338,20.01,40.00,156.40),(338,40.01,60.00,141.95),(338,60.01,999999,136.85),
-- SC 339
(339,0.01,3.00,202.30),(339,3.01,5.00,197.20),(339,5.01,10.00,193.80),(339,10.01,20.00,188.70),(339,20.01,40.00,184.45),(339,40.01,60.00,167.45),(339,60.01,999999,162.35),
-- SC 340
(340,0.01,3.00,202.30),(340,3.01,5.00,197.20),(340,5.01,10.00,193.80),(340,10.01,20.00,188.70),(340,20.01,40.00,184.45),(340,40.01,60.00,167.45),(340,60.01,999999,162.35),
-- SC 341
(341,0.01,3.00,170.85),(341,3.01,5.00,166.60),(341,5.01,10.00,163.20),(341,10.01,20.00,159.80),(341,20.01,40.00,156.40),(341,40.01,60.00,141.95),(341,60.01,999999,136.85);

-- Pedágios por messorregião
INSERT INTO pedagios (meso_id, valor_por_m3, observacao) VALUES
(294,3.20,'Centro Ocidental PR'),(295,3.20,'Centro Oriental PR'),(296,3.50,'Centro-Sul PR'),
(297,3.80,'Cerro Azul PR'),(298,3.00,'Lapa PR'),(299,2.50,'Metropolitana Curitiba'),
(300,3.80,'Noroeste PR'),(301,3.50,'Norte Central PR'),(302,3.50,'Norte Pioneiro PR'),
(303,4.20,'Oeste PR'),(304,2.80,'Paranaguá PR'),(305,3.00,'Rio Negro PR'),
(306,3.80,'Sudeste PR'),(307,4.00,'Sudoeste PR'),(315,4.50,'Serrana SC'),
(326,4.80,'Centro Ocidental RS'),(327,4.50,'Centro Oriental RS'),(328,4.00,'Gramado-Canela RS'),
(329,3.80,'Metropolitana POA'),(330,4.20,'Montenegro RS'),(331,4.80,'Nordeste RS'),
(332,5.20,'Noroeste RS'),(333,4.20,'Osório RS'),(334,4.50,'São Jerônimo RS'),
(335,5.50,'Sudeste RS'),(336,5.80,'Sudoeste RS'),(337,3.80,'Grande Florianópolis'),
(338,4.20,'Norte Catarinense'),(339,5.00,'Oeste Catarinense'),
(340,4.50,'Sul Catarinense'),(341,3.80,'Vale do Itajaí');

-- Clientes (baseados na planilha de particularidades)
INSERT INTO clientes (cnpj, codigo, loja, nome, nome_fantasia, municipio, uf, tipo_frete, paletizado, dedicado, cidade_id) VALUES
('00.508.070/0003-17','013251','02','ABIMAR SUPERMERCADOS LTDA','Abimar Supermercado','Balneário Rincão','SC','CIF',1,0,(SELECT id FROM cidades WHERE nome='Balneário Rincão' AND uf='SC' LIMIT 1)),
('08.517.272/0001-75','000743','01','ALTERNATIVA COM PROD HIG LTDA','Alternativa','Londrina','PR','CIF',0,0,(SELECT id FROM cidades WHERE nome='Londrina' AND uf='PR' LIMIT 1)),
('06.057.223/0291-53','000912','N4','SENDAS DISTRIBUIDORA S/A','Assaí Curitiba','Curitiba','PR','CIF',1,0,(SELECT id FROM cidades WHERE nome='Curitiba' AND uf='PR' LIMIT 1)),
('80.392.566/0001-45','200018','01','AABA COMERCIO DE EQUIP MEDICOS LTDA','AABA','Almirante Tamandaré','PR','FOB',0,0,(SELECT id FROM cidades WHERE nome='Almirante Tamandaré' AND uf='PR' LIMIT 1)),
('28.548.486/0009-73','001850','03','GCA DISTRIBUIDORA COMERCIAL DE ALIMENTOS','Campeão','Maringá','PR','CIF',1,0,(SELECT id FROM cidades WHERE nome='Maringá' AND uf='PR' LIMIT 1)),
('00.776.574/0106-06','005509','14','CARREFOUR COMERCIO E INDUSTRIA LTDA','Carrefour Pinhais','Pinhais','PR','CIF',1,0,(SELECT id FROM cidades WHERE nome='Pinhais' AND uf='PR' LIMIT 1)),
('00.776.574/0104-44','005509','04','CARREFOUR COMERCIO E INDUSTRIA LTDA','Carrefour Porto Alegre','Porto Alegre','RS','CIF',1,0,(SELECT id FROM cidades WHERE nome='Porto Alegre' AND uf='RS' LIMIT 1)),
('92.751.213/0001-73','001367','25','COMERCIAL ZAFFARI LTDA','Comercial Zaffari','Nova Santa Rita','RS','CIF',1,0,(SELECT id FROM cidades WHERE nome='Nova Santa Rita' AND uf='RS' LIMIT 1)),
('00.000.001/0001-01','001297','01','TEREZINHA SVIDZINSKI ZAMBIASI E CIA LTDA','Dagaz Porto Alegre','Porto Alegre','RS','CIF',0,0,(SELECT id FROM cidades WHERE nome='Porto Alegre' AND uf='RS' LIMIT 1)),
('60.765.479/0001-16','001437','01','DIMAR LTDA EPP','Dimar Distribuidora','Chapecó','SC','CIF',0,0,(SELECT id FROM cidades WHERE nome='Chapecó' AND uf='SC' LIMIT 1)),
('10.912.831/0001-02','002402','01','GGC COMERCIAL EIRELI','Disk Fraldas','Florianópolis','SC','CIF',0,0,(SELECT id FROM cidades WHERE nome='Florianópolis' AND uf='SC' LIMIT 1)),
('79.379.491/0001-83','000022','01','ALIEVI DIST PRODUTOS DESCARTAVEIS LTDA','Distribuidora Alievi','Pato Branco','PR','CIF',0,0,(SELECT id FROM cidades WHERE nome='Pato Branco' AND uf='PR' LIMIT 1)),
('78.187.773/0003-07','000146','03','DESTRO BRASIL DISTRIBUICAO LTDA','Distribuidora Destro Curitiba','Curitiba','PR','CIF',1,0,(SELECT id FROM cidades WHERE nome='Curitiba' AND uf='PR' LIMIT 1)),
('11.028.308/0003-37','003464','03','GENESIO A MENDES E CIA LTDA','Genesio A Mendes','São José dos Pinhais','PR','CIF',1,0,(SELECT id FROM cidades WHERE nome='São José dos Pinhais' AND uf='PR' LIMIT 1)),
('75.354.956/0005-23','000281','02','IRMAOS MUFFATO S.A','Irmãos Muffato','Cambé','PR','CIF',1,0,(SELECT id FROM cidades WHERE nome='Cambé' AND uf='PR' LIMIT 1)),
('03.937.555/0001-00','012760','01','GRUPO IRANI LTDA','Porti Atacadista','Cascavel','PR','CIF',0,1,(SELECT id FROM cidades WHERE nome='Cascavel' AND uf='PR' LIMIT 1)),
('92.700.830/0001-96','003044','03','DIMED SA DISTR DE MEDICAMENTOS','Panvel Farmácias','São José dos Pinhais','PR','CIF',1,0,(SELECT id FROM cidades WHERE nome='São José dos Pinhais' AND uf='PR' LIMIT 1)),
('61.585.865/0001-51','001348','07','RAIA DROGASIL S/A','Raia Drogasil Pinhais','São José dos Pinhais','PR','CIF',1,0,(SELECT id FROM cidades WHERE nome='São José dos Pinhais' AND uf='PR' LIMIT 1)),
('61.585.865/0022-97','001348','22','RAIA DROGASIL S/A','Raia Drogasil Gravataí','Gravataí','RS','CIF',1,0,(SELECT id FROM cidades WHERE nome='Gravataí' AND uf='RS' LIMIT 1)),
('78.389.845/0003-22','008974','03','COMPANHIA SULAMERICANA DE DISTRIBUICAO','Sulamericana','Paiçandu','PR','CIF',1,0,(SELECT id FROM cidades WHERE nome='Paiçandu' AND uf='PR' LIMIT 1)),
('11.100.000/0001-00','012828','01','KOCH HIPERMERCADO S/A','Supermercados Koch Tijucas','Tijucas','SC','CIF',1,0,(SELECT id FROM cidades WHERE nome='Tijucas' AND uf='SC' LIMIT 1)),
('07.752.236/0001-23','011592','01','BLUMEDICA PRODUTOS MEDIC E CIRURGIC LTDA','Produvale','Blumenau','SC','CIF',0,0,(SELECT id FROM cidades WHERE nome='Blumenau' AND uf='SC' LIMIT 1)),
('91.182.987/0001-39','001190','H9','COMERCIO DE MEDICAMENTOS BRAIR LTDA','Farmácias São João Passo Fundo','Passo Fundo','RS','CIF',0,0,(SELECT id FROM cidades WHERE nome='Passo Fundo' AND uf='RS' LIMIT 1)),
('91.182.987/0002-10','001190','ZF','COMERCIO DE MEDICAMENTOS BRAIR LTDA','Farmácias São João Gravataí','Gravataí','RS','CIF',0,0,(SELECT id FROM cidades WHERE nome='Gravataí' AND uf='RS' LIMIT 1));
