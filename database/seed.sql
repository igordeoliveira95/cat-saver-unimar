-- CatSaver: dados de demonstração
-- Rodar uma vez, logo depois do schema.sql, num banco vazio.
-- Senha dos dois usuários: catsaver123

SET NAMES utf8mb4;

USE catsaver;

INSERT INTO usuario (id_usuario, nome, email, senha_hash, perfil) VALUES
  (1, 'Coordenação CatSaver', 'coordenacao@catsaver.org', '$2b$10$R8cD74uVptSkUbKIDE0G1.wWCzKik4VTGj5OWUz69WVfACfC0CGtC', 'coordenador'),
  (2, 'Voluntário Demo',      'voluntario@catsaver.org',  '$2b$10$R8cD74uVptSkUbKIDE0G1.wWCzKik4VTGj5OWUz69WVfACfC0CGtC', 'voluntario');

INSERT INTO gato (id_gato, id_usuario, nome, sexo, data_nascimento_aprox, pelagem, data_resgate, local_resgate, castrado, vacinado, status, observacoes) VALUES
  (1, 2, 'Mingau',   'macho', '2024-10-01', 'branco',   '2026-10-03', 'Jardim Cavallari',   TRUE,  TRUE,  'disponivel',    'Muito dócil, gosta de colo.'),
  (2, 2, 'Pretinha', 'femea', '2026-06-15', 'preto',    '2026-10-15', 'Centro',             FALSE, FALSE, 'em_tratamento', 'Tratando conjuntivite.'),
  (3, 1, 'Frajola',  'macho', '2025-09-01', 'frajola',  '2026-09-20', 'Bairro Palmital',    TRUE,  TRUE,  'adotado',       NULL),
  (4, 2, 'Amora',    'femea', '2023-10-01', 'tricolor', '2026-10-11', 'Parque do Povo',     TRUE,  TRUE,  'disponivel',    'Prefere casa sem cachorro.'),
  (5, 2, 'Tigrão',   'macho', '2026-05-01', 'rajado',   '2026-11-02', 'Vila Nova',          FALSE, TRUE,  'disponivel',    NULL);

INSERT INTO adotante (id_adotante, nome, cpf, email, telefone, cep, rua, numero, bairro, cidade, uf, tipo_moradia) VALUES
  (1, 'Ana Souza', '52998224725', 'ana.souza@exemplo.com', '14999990000', '17500000', 'Rua das Flores', '120', 'Centro', 'Marília', 'SP', 'casa');

INSERT INTO adocao (id_adocao, id_adotante, id_usuario, data_adocao, observacoes) VALUES
  (1, 1, 1, '2026-10-05', 'Primeira adoção registrada no sistema.');

INSERT INTO adocao_gato (id_adocao, id_gato) VALUES (1, 3);
