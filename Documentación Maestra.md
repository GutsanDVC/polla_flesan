# Documentación Maestra: Polla Flesan DVC — FIFA World Cup 2026

Documento técnico y funcional definitivo del MVP de la plataforma de quiniela recreativa para el Mundial 2026.

---

## 1. Resumen Ejecutivo

Aplicación web para quiniela ("polla" / "prode") del Mundial FIFA 2026, diseñada para uso cerrado y privado entre participantes de la empresa.

| Aspecto | Detalle |
|---------|---------|
| **Framework** | Nuxt 3 (SSR + Nitro server) |
| **Base de datos** | PostgreSQL (Supabase) |
| **Estado** | Pinia |
| **Auth** | Google OAuth + aprobación admin (nuxt-auth-utils) |
| **Estilos** | Tailwind CSS |
| **Sync de datos** | football-data.org API v4 |
| **Tests** | Vitest (51 tests, 6 archivos) |
| **Despliegue primario** | Servidor interno (Apache2 + PM2) — `mundial2026.grupoflesan.com` |
| **Despliegue secundario** | Vercel (preview/testing) |

### Modelo Económico

Recreativo. Cada participante aporta $10.000 CLP al pozo. Premios: 1er lugar 50%, 2do lugar 30%, 3er lugar 20%. Las transacciones se manejan offline.

---

## 2. Requerimientos Funcionales

### RF-01: Autenticación y Gestión de Usuarios

- Registro e inicio de sesión exclusivo vía **Google OAuth**.
- Flujo: Google redirect → callback → sesión en cookie cifrada (`nuxt-auth-utils`).
- El middleware server-side (`server/middleware/01.auth.ts`) hidrata el usuario desde la DB en cada request.
- Estados de usuario: `PENDING` (esperando aprobación), `APPROVED` (activo), `BLOCKED` (bloqueado).
- Roles: `USER`, `ADMIN`.
- Panel admin para aprobar/rechazar usuarios y gestionar estados.

### RF-02: Predicciones de Fase de Grupos

- 72 partidos de fase de grupos (12 grupos × 6 partidos).
- Ingreso individual o **bulk** (guardar todos los predicciones de un grupo de una vez).
- **Tabla proyectada**: se calcula automáticamente en tiempo real basándose en las predicciones del usuario (puntos FIFA: 3pts victoria, 1pt empate, desempate por diferencia de goles y goles a favor).
- **Tabla real**: muestra las posiciones basadas en resultados reales de partidos finalizados.
- Layout lado a lado en desktop: partidos a la izquierda, standings a la derecha.
- **Bloqueo**: 11 de junio de 2026 (antes del partido inaugural). Variable configurable: `GROUP_PHASE_LOCK_DATE`.

### RF-03: Predicciones de Fase Eliminatoria

- Las eliminatorias se habilitan fase por fase (R32 → R16 → Cuartos → Semifinales → Final).
- **Bloqueo dinámico**: se bloquea al iniciar el primer partido de cada fase.
- Página placeholder implementada (`/bracket`); habilitación secuencial pendiente de emparejamientos reales.

### RF-04: Motor de Cálculo de Puntos

**Simplificado** (sin bonos de goles):

| Acierto | Puntos base |
|---------|-------------|
| Resultado exacto | 10 pts |
| Ganador o empate correcto | 5 pts |
| Sin aciertos | 0 pts |

**Multiplicadores por fase**:

| Fase | Multiplicador | Máximo por partido |
|------|---------------|-------------------|
| Fase de Grupos | ×1 | 10 pts |
| Dieciseisavos (R32) | ×2 | 20 pts |
| Octavos (R16) | ×4 | 40 pts |
| Cuartos de Final | ×8 | 80 pts |
| Semifinales | ×16 | 160 pts |
| Tercer Puesto | ×32 | 320 pts |
| Final | ×64 | 640 pts |

**Flujo de cálculo**:
1. Admin ingresa resultado real del partido (o sync automática desde API).
2. `PointsCalculatorService.processMatchResults()` itera todas las predicciones del partido.
3. Aplica base points × phase multiplier.
4. Actualiza `calculated_points` en la tabla `match_predictions`.

### RF-05: Tabla de Clasificación (Leaderboard)

- Ranking global de todos los usuarios aprobados, ordenado por puntaje descendente.
- Puntaje total = suma de `calculated_points` de todas las predicciones procesadas.
- Endpoint: `GET /api/leaderboard`.

### RF-06: Páginas de Puntajes

- **`/scores`**: Detalle de puntajes del usuario — resumen, predicciones por fase de grupos, predicciones de eliminatorias, posiciones de grupo, reglas inline.
- **`/scores-rules`**: Reglas de puntaje completas, tabla de multiplicadores, regla de deadline, premios con pozo calculado.

### RF-07: Sincronización de Datos

- Consumo de **football-data.org API v4** para obtener equipos, partidos y resultados.
- Competencia: FIFA World Cup 2026 (ID: 2000).
- Botón admin: "Sincronizar desde API" → ejecuta `MatchSyncService.run()`.
- Proceso: upsert equipos → upsert partidos → calcular puntos para partidos finalizados nuevos.
- Manejo de equipos TBD (por definir) y partidos sin emparejar.

---

## 3. Requerimientos No Funcionales

| ID | Requerimiento | Implementación |
|----|---------------|----------------|
| RNF-01 | Seguridad en bloqueos | Server valida timestamp vs fecha de bloqueo por fase |
| RNF-02 | Escalabilidad | SQL crudo con pg (sin ORM), pool de conexiones |
| RNF-03 | Arquitectura limpia | Rutas → Servicios → Repositorios (3 capas) |
| RNF-04 | Mobile First | Tailwind CSS, layout responsivo, side-by-side en desktop |
| RNF-05 | Sesiones seguras | nuxt-auth-utils con cookies cifradas (iron-webcrypto) |
| RNF-06 | Validación de inputs | Zod schemas en endpoints admin |

---

## 4. Alcance y Exclusiones

### In-Scope (MVP actual)

- Autenticación Google OAuth + aprobación admin
- Predicciones de fase de grupos (72 partidos) con tabla proyectada y real
- Motor de puntos simplificado con multiplicadores por fase
- Leaderboard global
- Páginas de puntajes y reglas con premios
- Panel admin: gestión de usuarios, partidos, resultados, sync
- Sync de datos desde football-data.org
- Despliegue en servidor interno (pm2 + Apache2)
- Deploy script semi-automático (PowerShell)

### Out-of-Scope

- Predicciones especiales (goleador, MVP, etc.) — no implementadas
- Bracket interactivo dinámico — placeholder
- Procesamiento de pagos integrados
- Chats o muros de comentarios
- Estadísticas avanzadas de jugadores
- Pruebas E2E (Playwright configurado pero no implementado)

---

## 5. Esquema de Base de Datos

### 5.1 Tabla `users`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'USER',      -- 'USER', 'ADMIN'
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'BLOCKED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 Tabla `teams`

Equipos sincronizados desde football-data.org.

```sql
CREATE TABLE teams (
    id INT PRIMARY KEY,                   -- ID de football-data.org
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(100),
    tla VARCHAR(10),
    crest_url TEXT,
    country_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 Tabla `matches`

Partidos cargados desde la API (sync admin). NO se usa seed — los 104 partidos vienen del sync inicial.

```sql
CREATE TABLE matches (
    id INT PRIMARY KEY,                   -- ID de football-data.org
    utc_date TIMESTAMP WITH TIME ZONE NOT NULL,
    phase VARCHAR(50) NOT NULL,           -- 'GROUP','R32','R16','QUARTERS','SEMIS','THIRD_PLACE','FINAL'
    "group" CHAR(1),                      -- 'A'..'L' en GROUP, NULL en eliminatorias
    matchday INT,
    home_team_id INT NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    away_team_id INT NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    home_score INT,
    away_score INT,
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- 'SCHEDULED','LIVE','FINISHED'
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5.4 Tabla `match_predictions`

Predicciones de marcador por usuario y partido.

```sql
CREATE TABLE match_predictions (
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
```

### 5.5 Tabla `group_predictions`

Posiciones proyectadas de grupo (calculadas automáticamente al modificar predicciones).

```sql
CREATE TABLE group_predictions (
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
```

### 5.6 Índices

```sql
CREATE INDEX idx_teams_tla ON teams(tla);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_matches_phase ON matches(phase);
CREATE INDEX idx_matches_group ON matches("group");
CREATE INDEX idx_matches_date ON matches(utc_date);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_matches_matchday ON matches(matchday);
CREATE INDEX idx_matches_phase_date ON matches(phase, utc_date);
CREATE INDEX idx_match_predictions_user ON match_predictions(user_id);
CREATE INDEX idx_match_predictions_match ON match_predictions(match_id);
CREATE INDEX idx_group_predictions_user ON group_predictions(user_id);
```

---

## 6. Arquitectura Backend

### 6.1 Diagrama de Capas

```
[Cliente/Browser]
       │
       ▼
[Middleware: 01.auth.ts]          ← Hidrata usuario desde DB por sesión
       │
       ▼
[Route: server/api/*.ts]         ← Valida auth, parsea body, delega al servicio
       │
       ▼
[Service: server/services/*.ts]  ← Lógica de negocio, cálculos, validaciones
       │
       ▼
[Repository: server/repositories/*.ts] ← SQL crudo con pg
       │
       ▼
[PostgreSQL (Supabase)]
```

### 6.2 Estructura de Directorios

```
server/
├── api/
│   ├── admin/
│   │   ├── matches/
│   │   │   ├── [id]/result.post.ts    ← Ingresar resultado real
│   │   │   └── sync.post.ts           ← Sincronizar desde football-data.org
│   │   └── users/
│   │       ├── [id]/status.patch.ts   ← Aprobar/bloquear usuario
│   │       └── index.get.ts           ← Listar todos los usuarios
│   ├── auth/
│   │   ├── google.get.ts             ← Iniciar login Google
│   │   ├── google/callback.get.ts    ← Callback de Google
│   │   ├── logout.post.ts            ← Cerrar sesión
│   │   └── me.get.ts                 ← Usuario actual
│   ├── debug/session.get.ts          ← Verificar sesión (debug)
│   ├── leaderboard/index.get.ts      ← Ranking global
│   ├── matches/index.get.ts          ← Listar partidos
│   ├── predictions/
│   │   ├── bulk.post.ts              ← Guardar predicciones masivo
│   │   ├── match.post.ts             ← Guardar predicción individual
│   │   ├── me.get.ts                 ← Mis predicciones con datos de partido
│   │   └── my-group-predictions.get.ts ← Mis predicciones de grupo
│   └── standings/group/[letter].get.ts ← Standings proyectado + real
├── middleware/01.auth.ts             ← Hidrata event.context.user
├── repositories/
│   ├── MatchRepository.ts
│   ├── PredictionRepository.ts
│   ├── TeamRepository.ts
│   └── UserRepository.ts
├── services/
│   ├── MatchSyncService.ts           ← Sync desde API externa
│   ├── PointsCalculatorService.ts    ← Cálculo de puntos
│   └── PredictionService.ts          ← Guardar predicciones + standings
└── utils/
    ├── auth.ts                       ← requireUser, requireApproved, requireAdmin
    ├── db.ts                         ← Pool de conexiones pg
    ├── football-data.ts              ← Fetch de football-data.org API
    └── google-oauth.ts               ← Hash/verify state para OAuth
```

### 6.3 Componentes Clave

| Servicio | Responsabilidad |
|----------|----------------|
| `PointsCalculatorService` | Calcula puntos: exacto=10, ganador=5, × phase multiplier |
| `PredictionService` | Guarda predicciones con transacción, recalcula standings de grupo, calcula standings reales |
| `MatchSyncService` | Orquesta sync: upsert equipos → upsert partidos → calcular puntos finales |
| `PredictionRepository` | CRUD predicciones, upsert group predictions |
| `MatchRepository` | CRUD partidos, queries por grupo/fase |
| `TeamRepository` | Upsert equipos |
| `UserRepository` | Query usuarios |

---

## 7. Algoritmos Críticos

### 7.1 Cálculo de Puntos (`PointsCalculatorService`)

```typescript
calculatePointsForMatch(homeReal, awayReal, homePred, awayPred, phase): number {
  const isExact = homeReal === homePred && awayReal === awayPred;
  const realWinner = homeReal > awayReal ? 'HOME' : awayReal > homeReal ? 'AWAY' : 'DRAW';
  const predWinner = homePred > awayPred ? 'HOME' : awayPred > homePred ? 'AWAY' : 'DRAW';
  const isWinner = realWinner === predWinner;

  let base = isExact ? 10 : isWinner ? 5 : 0;
  return base * PHASE_MULTIPLIERS[phase];
}
```

### 7.2 Standings Proyectados (`PredictionService.calculateStandings`)

Calcula posiciones basándose en predicciones del usuario (no en resultados reales):

1. Inicializa stats por equipo (pts=0, gd=0, gf=0).
2. Para cada predicción: aplica reglas FIFA (3pts victoria, 1pt empate).
3. Ordena: puntos ↓ → diferencia de goles ↓ → goles a favor ↓.
4. Retorna `StandingEntry[]` con teamId, name, crest_url, points, gf, gd.

### 7.3 Standings Reales (`PredictionService.calculateRealStandings`)

Igual al anterior pero usa `home_score` / `away_score` de partidos con status `FINISHED`.

### 7.4 Recalculo de Posiciones de Grupo

Al guardar una predicción de grupo:
1. Dentro de transacción SQL (`BEGIN/COMMIT/ROLLBACK`).
2. Recalcula standings del grupo con las predicciones actualizadas.
3. Persiste top 3 equipos en `group_predictions`.

---

## 8. Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL (Supabase pooler, puerto 6543) | `postgresql://...` |
| `NUXT_SESSION_PASSWORD` | Password para cifrado de sesiones (mín 32 chars) | `openssl rand -base64 32` |
| `AUTH_SECRET` | Secret para nuxt-auth-utils | `dev-secret-change-in-production` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth | `GOCSPX-xxx` |
| `GOOGLE_REDIRECT_URI` | URI de callback de Google | `https://domain/api/auth/google/callback` |
| `API_TOKEN` | Token de football-data.org | `your-token` |
| `FOOTBALL_DATA_BASE_URL` | Base URL de la API | `https://api.football-data.org/v4` |
| `FOOTBALL_DATA_COMPETITION_ID` | ID de la competencia (Mundial 2026) | `2000` |
| `GROUP_PHASE_LOCK_DATE` | Fecha de bloqueo de fase de grupos | `2026-06-11T00:00:00Z` |
| `NUXT_PUBLIC_APP_NAME` | Nombre de la aplicación | `Polla Flesan DVC` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |

---

## 9. Endpoints API

### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/auth/google` | No | Redirige a Google OAuth |
| GET | `/api/auth/google/callback` | No | Callback de Google, crea sesión |
| POST | `/api/auth/logout` | Sí | Cierra sesión |
| GET | `/api/auth/me` | Sí | Retorna usuario actual (401 si no hay sesión) |

### Predicciones

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/predictions/match` | Approved | Guardar predicción individual |
| POST | `/api/predictions/bulk` | Approved | Guardar predicciones masivas (por grupo) |
| GET | `/api/predictions/me` | Approved | Mis predicciones con datos de partido |
| GET | `/api/predictions/my-group-predictions` | Approved | Mis predicciones de posición de grupo |

### Standings y Leaderboard

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/standings/group/:letter` | Approved | Standings proyectado + real del grupo |
| GET | `/api/leaderboard` | Approved | Ranking global de todos los usuarios |

### Partidos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/matches` | Approved | Listar todos los partidos |

### Admin

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | Listar todos los usuarios |
| PATCH | `/api/admin/users/:id/status` | Admin | Cambiar estado de usuario |
| POST | `/api/admin/matches/sync` | Admin | Sincronizar desde football-data.org |
| POST | `/api/admin/matches/:id/result` | Admin | Ingresar resultado real |

### Debug

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/debug/session` | No | Verificar estado de sesión |

---

## 10. Páginas y Rutas

| Ruta | Página | Auth | Descripción |
|------|--------|------|-------------|
| `/` | index.vue | No (auto-redirect si auth) | Homepage — logo, CTA, resumen si autenticado |
| `/auth/login` | login.vue | No | Login con Google |
| `/groups` | groups/index.vue | Approved | Predicciones fase de grupo (side-by-side) |
| `/bracket` | bracket/index.vue | Approved | Fase eliminatoria (placeholder) |
| `/scores` | scores/index.vue | Approved | Mis puntajes detallados |
| `/scores-rules` | scores-rules/index.vue | No | Reglas de puntaje + premios |
| `/leaderboard` | leaderboard/index.vue | Approved | Tabla de clasificación |
| `/admin` | admin/index.vue | Admin | Dashboard admin |
| `/admin/users` | admin/users.vue | Admin | Gestión de usuarios |
| `/admin/matches` | admin/matches.vue | Admin | Gestión de partidos + sync |
| `/admin/bracket` | admin/bracket.vue | Admin | Bracket admin |

---

## 11. Componentes Frontend

### `components/group/`

| Componente | Descripción |
|------------|-------------|
| `MatchList.vue` | Lista de partidos de un grupo con inputs de predicción |
| `Standings.vue` | Tabla de posiciones proyectada (según predicciones) |
| `RealStandings.vue` | Tabla de posiciones real (según resultados) |

### `components/scores/`

| Componente | Descripción |
|------------|-------------|
| `ScoreSummary.vue` | Resumen de puntaje total del usuario |
| `MatchScoreCard.vue` | Card de predicción con resultado real y explicación de puntos |
| `GroupPositionCard.vue` | Card de posición de grupo predicha |
| `ScoringRules.vue` | Reglas de puntaje + tabla de multiplicadores |

### `components/common/`

| Componente | Descripción |
|------------|-------------|
| `TeamLogo.vue` | Logo + nombre del equipo (reutilizable) |

### `components/auth/`

| Componente | Descripción |
|------------|-------------|
| `PendingState.vue` | Mensaje de espera de aprobación |

---

## 12. Despliegue

### 12.1 Despliegue Primario: Servidor Interno

- **URL**: `mundial2026.grupoflesan.com`
- **Stack**: Apache2 (reverse proxy) + PM2 (Node.js process manager)
- **Script**: `deploy/deploy.ps1` (PowerShell, semi-automático, 4 pasos)

#### Pasos del deploy

1. **Build local**: `npm run build` → genera `.output/`
2. **Preparar servidor**: limpia directorio remoto
3. **Subir archivos**: transfiere `.output/` vía SCP/pscp
4. **Reiniciar PM2**: ejecuta `pm2 start .ecosystem.config.js`

#### Configuración PM2 (`deploy/ecosystem.config.js`)

```javascript
module.exports = {
  apps: [{
    name: 'polla_flesan',
    script: './server/index.mjs',
    instances: 'max',        // Cluster mode
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOST: '127.0.0.1',
      // ... variables de entorno
    }
  }]
};
```

#### Variables del deploy (`deploy/.env`)

```env
PROJECT_NAME=polla_flesan
REMOTE_BASE_DIR=/var/www/one
HOST_QA=server-qa.grupoflesan.com
HOST_PD=server.grupoflesan.com
USER_QA=deploy
USER_PD=deploy
PASS_QA=***
PASS_PD=***
```

### 12.2 Despliegue Secundario: Vercel

- Conexión automática al hacer push a `main`
- Variables de entorno configuradas en el dashboard de Vercel
- Útil para preview y testing

---

## 13. Dependencias

### Runtime

| Paquete | Versión | Uso |
|---------|---------|-----|
| `nuxt` | ^3.15.0 | Framework fullstack |
| `vue` | ^3.5.0 | UI framework |
| `vue-router` | ^4.5.0 | Routing |
| `pinia` | ^3.0.4 | State management |
| `@pinia/nuxt` | ^0.11.3 | Integración Pinia + Nuxt |
| `nuxt-auth-utils` | ^0.5.0 | Sesiones y OAuth |
| `pg` | ^8.13.0 | Cliente PostgreSQL |
| `zod` | ^4.4.3 | Validación de schemas |

### Dev

| Paquete | Versión | Uso |
|---------|---------|-----|
| `vitest` | ^3.0.0 | Unit testing |
| `typescript` | ^5.7.0 | Tipado estático |
| `tailwindcss` | ^3.4.0 | CSS utility-first |
| `autoprefixer` | ^10.4.0 | PostCSS |
| `postcss` | ^8.5.0 | CSS processing |
| `@playwright/test` | ^1.49.0 | E2E testing (configurado, no implementado) |

---

## 14. Tests

51 tests unitarios en 6 archivos, ejecutados con Vitest.

| Archivo | Tests | Cubre |
|---------|-------|-------|
| `PointsCalculatorService.test.ts` | 11 | Cálculo de puntos + multiplicadores de fase |
| `PredictionService.test.ts` | 4 | Guardado de predicciones + standings |
| `MatchSyncService.test.ts` | 4 | Sync desde API, deduplicación, manejo de errores |
| `football-data.test.ts` | 15 | Parsing de API, mapeo de equipos/partidos |
| `auth.test.ts` | 11 | Middleware de autenticación y autorización |
| `google-oauth.test.ts` | 6 | Hash y verificación de state OAuth |

---

## 15. Git y Control de Versiones

- **Remoto**: `https://github.com/GutsanDVC/polla_flesan.git`
- **Rama principal**: `main`
- **Último commit**: `94fd000` — feat: scoring simplification, real standings, scores pages, bulk predictions, UI/UX improvements
- **Commits siguen convención**: `feat:`, `fix:`, `refactor:`, etc.
- **Deploy trigger**: push a `main` → Vercel auto-deploy + deploy manual al servidor interno
