-- CatSaver: estrutura do banco (MariaDB)
-- Segue o MER do Documento de Visão (seção 3).

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS catsaver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE catsaver;

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario  INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha_hash  CHAR(60)     NOT NULL,
  perfil      ENUM('coordenador','voluntario') NOT NULL DEFAULT 'voluntario',
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adotante (
  id_adotante  INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(100) NOT NULL,
  cpf          CHAR(11)     NOT NULL UNIQUE,
  email        VARCHAR(150) NOT NULL UNIQUE,
  telefone     VARCHAR(15)  NOT NULL,
  cep          CHAR(8),
  rua          VARCHAR(120) NOT NULL,
  numero       VARCHAR(10)  NOT NULL,
  bairro       VARCHAR(80)  NOT NULL,
  cidade       VARCHAR(80)  NOT NULL,
  uf           CHAR(2)      NOT NULL,
  tipo_moradia ENUM('casa','apartamento','outro') NOT NULL,
  criado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gato (
  id_gato               INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario            INT          NOT NULL,
  nome                  VARCHAR(60)  NOT NULL,
  sexo                  ENUM('macho','femea') NOT NULL,
  data_nascimento_aprox DATE,
  pelagem               VARCHAR(40),
  data_resgate          DATE         NOT NULL,
  local_resgate         VARCHAR(150) NOT NULL,
  castrado              BOOLEAN      NOT NULL DEFAULT FALSE,
  vacinado              BOOLEAN      NOT NULL DEFAULT FALSE,
  status                ENUM('em_tratamento','disponivel','adotado') NOT NULL DEFAULT 'em_tratamento',
  observacoes           TEXT,
  criado_em             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gato_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT ck_gato_nascimento CHECK (data_nascimento_aprox IS NULL OR data_nascimento_aprox <= data_resgate)
);

CREATE TABLE IF NOT EXISTS adocao (
  id_adocao   INT AUTO_INCREMENT PRIMARY KEY,
  id_adotante INT      NOT NULL,
  id_usuario  INT      NOT NULL,
  data_adocao DATE     NOT NULL,
  observacoes TEXT,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_adocao_adotante FOREIGN KEY (id_adotante) REFERENCES adotante (id_adotante),
  CONSTRAINT fk_adocao_usuario  FOREIGN KEY (id_usuario)  REFERENCES usuario (id_usuario)
);

CREATE TABLE IF NOT EXISTS adocao_gato (
  id_adocao        INT NOT NULL,
  id_gato          INT NOT NULL,
  data_devolucao   DATE,
  motivo_devolucao VARCHAR(255),
  PRIMARY KEY (id_adocao, id_gato),
  CONSTRAINT fk_ag_adocao FOREIGN KEY (id_adocao) REFERENCES adocao (id_adocao),
  CONSTRAINT fk_ag_gato   FOREIGN KEY (id_gato)   REFERENCES gato (id_gato),
  CONSTRAINT ck_ag_motivo CHECK (data_devolucao IS NULL OR motivo_devolucao IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_gato_status ON gato (status);
CREATE INDEX IF NOT EXISTS idx_adocao_data ON adocao (data_adocao);
