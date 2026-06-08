-- 002_teams.sql
-- Crea la tabla normalizada de equipos (provista por football-data.org)
-- Ejecutar DESPUÉS de 001_initial.sql (schema.sql actual)

CREATE TABLE IF NOT EXISTS teams (
    id           INT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    short_name   VARCHAR(100),
    tla          VARCHAR(10),
    crest_url    TEXT,
    country_code VARCHAR(10),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_tla ON teams(tla);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
