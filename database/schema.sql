-- ============================================================================
-- Esquema de Base de Datos - Polla Flesan DVC
-- Para instalación limpia (fresh install), ejecutar este archivo una sola vez.
-- Para actualizar una instalación existente, usar database/migrations/*.sql
-- ============================================================================

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'USER',
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Equipos (provista por football-data.org vía sync)
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(100),
    tla VARCHAR(10),
    crest_url TEXT,
    country_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Partidos
--    Los partidos se cargan desde la API (admin → "Sincronizar desde API").
--    NO se usa seed.sql — los 104 partidos del Mundial 2026 vienen del sync inicial.
CREATE TABLE IF NOT EXISTS matches (
    id INT PRIMARY KEY,
    utc_date TIMESTAMP WITH TIME ZONE NOT NULL,
    phase VARCHAR(50) NOT NULL,
    "group" CHAR(1),
    matchday INT,
    home_team_id INT NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    away_team_id INT NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    home_score INT,
    away_score INT,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Predicciones de Partidos (Apuestas)
CREATE TABLE IF NOT EXISTS match_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    home_score_pred INT NOT NULL,
    away_score_pred INT NOT NULL,
    calculated_points INT DEFAULT 0,
    processed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_match UNIQUE (user_id, match_id)
);

-- 5. Tabla de Predicciones de Posiciones de Grupos
CREATE TABLE IF NOT EXISTS group_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    "group" CHAR(1) NOT NULL,
    pos_1_team VARCHAR(100) NOT NULL,
    pos_2_team VARCHAR(100) NOT NULL,
    pos_3_team VARCHAR(100) NOT NULL,
    calculated_points INT DEFAULT 0,
    processed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_group UNIQUE (user_id, "group")
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_teams_tla ON teams(tla);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
CREATE INDEX IF NOT EXISTS idx_matches_phase ON matches(phase);
CREATE INDEX IF NOT EXISTS idx_matches_group ON matches("group");
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(utc_date);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_matchday ON matches(matchday);
CREATE INDEX IF NOT EXISTS idx_matches_phase_date ON matches(phase, utc_date);
CREATE INDEX IF NOT EXISTS idx_match_predictions_user ON match_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_predictions_match ON match_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_group_predictions_user ON group_predictions(user_id);
