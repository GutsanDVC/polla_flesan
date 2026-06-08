-- 003_alter_matches.sql
-- Migra la tabla matches para referenciar teams por FK y agregar campos del sync
-- Ejecutar DESPUÉS de 002_teams.sql

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS home_team_id INT,
    ADD COLUMN IF NOT EXISTS away_team_id INT,
    ADD COLUMN IF NOT EXISTS matchday INT,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE matches
    ADD CONSTRAINT fk_matches_home_team
        FOREIGN KEY (home_team_id) REFERENCES teams(id)
        ON DELETE RESTRICT,
    ADD CONSTRAINT fk_matches_away_team
        FOREIGN KEY (away_team_id) REFERENCES teams(id)
        ON DELETE RESTRICT;

-- Pre-MVP: limpia datos existentes del seed anterior (id 1..72) para permitir nuevos IDs de API
TRUNCATE match_predictions, group_predictions, matches RESTART IDENTITY CASCADE;

-- Elimina columnas legacy
ALTER TABLE matches
    DROP COLUMN IF EXISTS home_team,
    DROP COLUMN IF EXISTS away_team,
    DROP COLUMN IF EXISTS home_score_real,
    DROP COLUMN IF EXISTS away_score_real;

-- Renombra columnas para coincidir con el response de la API
ALTER TABLE matches RENAME COLUMN match_date TO utc_date;
ALTER TABLE matches RENAME COLUMN home_score_pred TO home_score_pred;
ALTER TABLE matches RENAME COLUMN away_score_pred TO away_score_pred;

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS home_score INT,
    ADD COLUMN IF NOT EXISTS away_score INT;

-- Índices nuevos
DROP INDEX IF EXISTS idx_matches_group;
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_matchday ON matches(matchday);
CREATE INDEX IF NOT EXISTS idx_matches_phase_date ON matches(phase, utc_date);
