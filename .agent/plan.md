# Plan de Refactor — Polla Flesan DVC

> Documento vivo. Se actualiza al cierre de cada sprint.

## 0. Diagnóstico (estado actual vs. objetivo)

| Área | Estado | Brecha crítica |
|---|---|---|
| **Arquitectura backend** | ✅ Capas `api/services/repositories/utils` correctas | Repositorios instancian `new` por método → acoplamiento a tests |
| **DB schema** | ✅ 5 tablas + 6 índices | Falta `updated_at` en `matches`, falta tabla `app_config`, falta índice compuesto |
| **Auth Google** | ❌ `nuxt-auth-utils` cargado pero sin handlers | No hay `server/routes/auth/google.get.ts`, no hay callback, no hay sesiones reales → el sistema **no funciona end-to-end** |
| **Aprobación admin** | 🟡 Endpoint existe, flujo incompleto | `createUser` inserta PENDING pero nadie dispara ese path desde Google |
| **Scoring** | 🟡 Hardcodeado en el servicio | **El usuario explícitamente pidió sacarlo a `server/config/scoring.ts`** con matriz configurable |
| **Tipos compartidos** | ❌ Inexistente | Todo es `any` → refactor obligatorio |
| **Validación inputs** | ❌ Inexistente | Sin Zod/Valibot → riesgo de inyección de payloads |
| **Middleware auth** | ❌ Inexistente | Rutas `/admin/*`, `/groups` accesibles sin sesión |
| **Frontend** | 🟡 ~40% | Faltan: login, estado PENDING, bracket dinámico, predicciones especiales, auditoría, indicadores de bloqueo |
| **Tests** | 🟡 2 archivos | Solo 2 tests unitarios; sin integración ni E2E |
| **Leaderboard** | 🟡 N+1 query | Iterar usuarios → 1 query por usuario |
| **Transacciones DB** | ❌ Inexistentes | `saveMatchPrediction` no es atómica (predicción + recálculo grupo) |
| **Deploy on-prem** | 🟡 Dockerfile + nginx + systemd | Falta healthcheck, `.env.production`, política de reinicio |
| **Errores Nitro** | 🟡 `catch → {success:false}` | Pierde status codes; debe usar `createError` para tipado |

## 1. Especificaciones generales refinadas

### 1.1 Roles y matriz de permisos

| Rol | `users.role` | `users.status` | Acciones |
|---|---|---|---|
| **Admin** | `ADMIN` | `APPROVED` | CRUD matches, CRUD bracket, CRUD users, ver leaderboard completo |
| **Jugador** | `USER` | `APPROVED` | Cargar predicciones, ver leaderboard, ver auditoría |
| **Pendiente** | `USER` | `PENDING` | Solo ver pantalla "esperando aprobación" |
| **Bloqueado** | `USER` | `BLOCKED` | Solo ver pantalla "acceso bloqueado" |

### 1.2 Reglas de scoring (versión inicial — centralizadas en config)

> ⚠️ Versión inicial: **solo resultado exacto = 10 y ganador/empate = 5**. Las reglas adicionales quedan en la config listas para activarse.

`server/config/scoring.ts`:
- `match.exactResult: 10` (activo)
- `match.correctWinner: 5` (activo)
- `match.totalGoals: 2`, `match.homeGoals: 1`, `match.awayGoals: 1` (inactivos)
- `groupPosition: { pos1: 8, pos2: 5, pos3: 3, pos4: 1 }` (inactivos)
- `special: { topScorer: 15, goldenGlove: 15, mvp: 15, champion: 20 }` (inactivos)
- `activeRules: { match: ['exactResult', 'correctWinner'] }`

**Cambio clave:** `PointsCalculatorService` recibe el `SCORING_RULES` por inyección y solo aplica las reglas listadas en `activeRules.match`. Cambiar puntajes = editar 1 archivo.

### 1.3 Reglas de bloqueo (canónicas)

| Fase | Bloqueo | Origen de la fecha |
|---|---|---|
| `GROUP` | `2026-06-11T00:00:00Z` (fijo) | `runtimeConfig.public.groupPhaseLockDate` |
| `R32`, `R16`, `QUARTERS`, `SEMIS`, `FINAL`, `THIRD_PLACE` | Inicio del primer partido de la fase | `MIN(match_date) WHERE phase = ?` |

### 1.4 Tipos compartidos — `types/domain.ts`

```ts
export type Phase = 'GROUP' | 'R32' | 'R16' | 'QUARTERS' | 'SEMIS' | 'THIRD_PLACE' | 'FINAL';
export type UserStatus = 'PENDING' | 'APPROVED' | 'BLOCKED';
export type UserRole = 'USER' | 'ADMIN';
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';
export interface Match { id: number; home_team: string; away_team: string; match_date: string; phase: Phase; group_letter: string | null; home_score_real: number | null; away_score_real: number | null; status: MatchStatus; }
export interface MatchPrediction { id: string; user_id: string; match_id: number; home_score_pred: number; away_score_pred: number; calculated_points: number; processed: boolean; }
export interface User { id: string; email: string; full_name: string; avatar_url: string | null; role: UserRole; status: UserStatus; }
export interface LeaderboardEntry { user: Pick<User,'id'|'full_name'|'avatar_url'>; totalPoints: number; breakdown: { match: number; group: number; special: number; }; rank: number; }
```

### 1.5 Contratos de API (estandarizados)

- **Éxito:** `data: T` con `200/201`
- **Error:** `createError({statusCode, statusMessage, data})` — sin `success:false` envolvente

## 2. Especificaciones de diseño (UI/UX)

### 2.1 Principios

- **Mobile-first** (breakpoint `md:` 768px). Bracket horizontal solo en `lg:`.
- **Paleta:** verde FIFA (`green-600/700`) + grises neutros + rojo solo para alertas de bloqueo.
- **Estados obligatorios en cada pantalla:** `loading` / `empty` / `error` / `success` / `locked`.
- **Indicador global de bloqueo** en el header: cuenta regresiva a la próxima fase que cierre.

### 2.2 Mapa de pantallas

```
/                          → Landing pública (CTA login)
/auth/login                → Botón "Continuar con Google" + estado PENDING
/auth/pending              → "Tu cuenta espera aprobación" (polling cada 30s)
/auth/blocked              → "Acceso bloqueado, contacta al admin"

/groups                    → Tabs A-L + MatchList + Standings proyectadas
  └─ Componentes: <GroupTabs>, <GroupMatchCard>, <GroupStandingsTable>, <LockCountdown>

/bracket                   → Bracket dinámico fase a fase
/specials                  → Predicciones: Goleador, Guante de Oro, MVP, Campeón
/leaderboard               → Ranking con puntos + auditoría expandible
/profile                   → Mis predicciones agrupadas por fase + cambio de estado

/admin                     → Dashboard (links a subsecciones)
/admin/users               → Tabla + acciones approve/block + rol
/admin/matches             → Ingreso de resultados reales (partidos GROUP)
/admin/bracket             → Confirmar emparejamientos de cada fase eliminatoria
/admin/specials            → Cargar ganadores reales (goleador, MVP, etc.)
```

### 2.3 Componentes reutilizables

```
components/
  common/     → AppHeader, AppFooter, AppSpinner, AppEmpty, AppError, AppToast,
                LockCountdown, PhaseBadge, StatusPill
  auth/       → GoogleSignInButton, PendingState, BlockedState
  group/      → MatchList, Standings (existentes) + GroupTabs, GroupMatchCard
  bracket/    → BracketView, BracketMatchCard, PhaseSelector
  leaderboard/→ LeaderboardTable, LeaderboardRow, AuditDrawer
  admin/      → AdminUserTable, AdminMatchForm, BracketConfirmForm
```

## 3. Modelo de datos (tablas refinadas)

### 3.1 Cambios al esquema actual

```sql
-- A) matches: agregar updated_at
ALTER TABLE matches ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
-- B) matches: índice compuesto para bloqueos dinámicos
CREATE INDEX idx_matches_phase_matchdate ON matches(phase, match_date);
-- C) match_predictions: índice para leaderboard
CREATE INDEX idx_match_predictions_user_processed ON match_predictions(user_id, processed);
-- D) users: índice por status
CREATE INDEX idx_users_status ON users(status);
-- E) app_config: lock date por fase + scoring version
CREATE TABLE IF NOT EXISTS app_config (
  key   VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO app_config (key, value) VALUES
  ('group_phase_lock_date', '2026-06-11T00:00:00Z'),
  ('scoring_version', 'v1.0')
ON CONFLICT (key) DO NOTHING;
```

### 3.2 Mejoras en queries (repositorios)

- **Leaderboard:** 1 sola query agregada con `LEFT JOIN ... GROUP BY` en lugar de N+1.
- **`getMinDateByPhase`:** eliminar filtro `status != 'SCHEDULED'` (es fecha del primer partido).
- **`saveMatchPrediction`:** envolver en transacción `BEGIN/COMMIT` para atomicidad.

### 3.3 Seed adicional

`database/seed-r32.sql`: 32 emparejamientos placeholder con `TBD1/TBD2` y `match_date = NULL`. El admin los confirmará dinámicamente.

## 4. Endpoints (catálogo completo)

### 4.1 Auth (NUEVO)

```
GET  /api/auth/google              → Redirige a Google OAuth
GET  /api/auth/google/callback     → Callback OAuth, upsert user, set session
POST /api/auth/logout              → Limpia sesión
GET  /api/auth/me                  → Usuario actual o 401
```

### 4.2 Catálogo consolidado

| Verbo | Ruta | Auth | Capa |
|---|---|---|---|
| GET | `/api/matches?phase=GROUP` | público | MatchService |
| GET | `/api/matches/:id` | público | MatchService |
| GET | `/api/standings/group/:letter` | user | GroupStandingService |
| GET | `/api/standings/group/:letter/real` | user | GroupStandingService |
| POST | `/api/predictions/match` | user approved | **PredictionService** (con bloqueo) |
| GET | `/api/predictions/me` | user approved | PredictionService |
| GET | `/api/predictions/me/group/:letter` | user approved | PredictionService |
| POST | `/api/predictions/special` | user approved | SpecialPredictionService |
| GET | `/api/predictions/special/me` | user approved | SpecialPredictionService |
| GET | `/api/leaderboard` | user approved | **LeaderboardService** (query agregada) |
| GET | `/api/leaderboard/:userId/audit` | user approved | LeaderboardService |
| GET | `/api/bracket?phase=R32` | user approved | BracketService |
| POST | `/api/bracket/predict` | user approved | BracketService (con bloqueo) |
| GET | `/api/phases/active` | público | retorna fase abierta para predicción |
| GET | `/api/admin/users` | admin | UserService |
| PATCH | `/api/admin/users/:id/status` | admin | UserService |
| PATCH | `/api/admin/users/:id/role` | admin | UserService |
| POST | `/api/admin/matches/:id/result` | admin | **MatchResultService** |
| POST | `/api/admin/bracket/confirm` | admin | BracketService |
| POST | `/api/admin/specials/result` | admin | SpecialPredictionService |

### 4.3 Validación (NUEVO)

Zod en cada endpoint:
```ts
const schema = z.object({
  matchId: z.number().int().positive(),
  homeScorePred: z.number().int().min(0).max(20),
  awayScorePred: z.number().int().min(0).max(20),
});
const body = await readValidatedBody(event, schema.parse);
```

### 4.4 Middleware de auth (NUEVO)

```ts
// server/middleware/01.auth.ts         → decodifica sesión → event.context.user
// server/utils/requireUser(event)      → 401 si no hay sesión
// server/utils/requireAdmin(event)     → 403 si no es admin
// server/utils/requireApproved(event)  → 403 si no está APPROVED
```

## 5. Frontend (plan de implementación)

### 5.1 Stores Pinia

```
stores/auth.ts        → session, user, login(), logout(), isAdmin, isApproved
stores/matches.ts     → matches por fase, cache por group_letter
stores/predictions.ts → predicciones del user
stores/leaderboard.ts → ranking (refetch cada 60s)
stores/brackets.ts    → fases activas
```

### 5.2 Composables

```
composables/useApi.ts           → wrapper de $fetch con error tipado
composables/useLockCountdown.ts → cuenta regresiva reactiva
composables/usePhases.ts        → fases activas
```

### 5.3 Páginas — orden de construcción

1. Auth flow (login → pending → blocked)
2. Layout con sesión real
3. Groups page refinada (countdown + bloqueo)
4. Bracket dinámico
5. Specials
6. Leaderboard + auditoría
7. Admin pages completas

## 6. Sprints (Roadmap)

### 🟢 SPRINT 1 — Cimientos + Auth
- Instalar Zod, Pinia (`@pinia/nuxt`)
- `types/domain.ts` + alias `~types`
- `nuxt.config.ts`: Pinia + `runtimeConfig.google.*`
- `server/middleware/01.auth.ts` + `server/utils/require*`
- `server/routes/auth/google.get.ts` + `google/callback.get.ts` + `logout.post.ts` + `me.get.ts`
- `pages/auth/login.vue` + `pending.vue` + `blocked.vue`
- `stores/auth.ts`
- `middleware/auth.ts` (cliente)
- `pages/index.vue` con CTA dinámico
- Tests: `auth.test.ts`, `requireAdmin.test.ts`

### 🟡 SPRINT 2 — Scoring configurable + Grupos blindados
- `server/config/scoring.ts`
- Refactor `PointsCalculatorService` para consumir `SCORING_RULES`
- Bugfix `matches.updated_at` + `idx_matches_phase_matchdate`
- Transacciones en `PredictionService.saveMatchPrediction`
- Leaderboard con query agregada
- Validación Zod en todos los endpoints
- Tests: `scoring.test.ts`, `leaderboard.test.ts`
- `pages/groups/index.vue`: `<LockCountdown>`, read-only post-bloqueo

### 🟠 SPRINT 3 — Bracket dinámico + Admin completo
- `BracketService` + endpoints
- Emparejamientos dinámicos (admin edita filas TBD)
- `/api/admin/bracket/confirm`
- `pages/bracket/index.vue` con `<BracketView>`
- `pages/admin/bracket.vue`: formulario emparejamientos
- `pages/admin/matches.vue`: distinguir group vs eliminatoria
- Tests integración bloqueos dinámicos

### 🔵 SPRINT 4 — Especiales + Leaderboard auditoría + QA + Deploy
- `SpecialPredictionService` + endpoints
- `pages/specials/index.vue` + `pages/admin/specials.vue`
- `<AuditDrawer>` en leaderboard
- E2E con Playwright
- `Dockerfile` con healthcheck, `.env.production.example`
- `deploy/polla-flesan.service` con Restart=always + HealthCheck
- Verificación final checklist

### 6.b Checklist de cumplimiento

| # | Criterio | Comando |
|---|---|---|
| 1 | Tests unitarios verdes | `npm run test:unit` |
| 2 | Tests E2E verdes | `npm run test:e2e` |
| 3 | Build sin errores | `npm run build` |
| 4 | Type-check estricto | `npx nuxi typecheck` |
| 5 | Auth end-to-end manual | login → PENDING → admin aprueba → /groups |
| 6 | Bloqueo GROUP funciona | Date > 2026-06-11 → POST 403 |
| 7 | Bloqueo dinámico eliminatoria | partido fase R16 iniciado → POST 403 |
| 8 | Scoring centralizado | cambiar `exactResult` a 15 → tests ajustan |
| 9 | Leaderboard < 200 ms con 100 users | query agregada + índice |
| 10 | Deploy on-prem | docker compose up + systemctl healthy |

---

## Estado por Sprint

- [x] Plan ejecutado y guardado
- [x] Sprint 1 — Cimientos + Auth ✅
- [ ] Sprint 2 — Scoring + Grupos
- [ ] Sprint 3 — Bracket + Admin
- [ ] Sprint 4 — Especiales + Leaderboard + QA + Deploy

## Log Sprint 1

**Completado:**
- `types/domain.ts` con tipos compartidos (User, Match, Phase, etc.)
- `types/auth.d.ts` con augmentación de `nuxt-auth-utils`
- `server/utils/auth.ts` con `requireUser`, `requireApproved`, `requireAdmin`
- `server/utils/google-oauth.ts` con flujo OAuth completo + state CSRF
- `server/middleware/01.auth.ts` que hidrata `event.context.user` desde DB
- 4 endpoints auth: `/api/auth/google`, `/callback`, `/logout`, `/me`
- 6 endpoints refactorizados con `requireApproved`/`requireAdmin` + Zod
- Pinia store `useAuthStore`
- Middleware cliente `middleware/auth.ts` con redirección a pending/blocked
- Páginas: `auth/login`, `auth/pending` (con polling 30s), `auth/blocked`, `auth/post-login`
- Componentes: `GoogleSignInButton`, `PendingState`, `BlockedState`
- Layout con sesión real y menú condicional
- 17 nuevos tests unitarios (auth utils + google-oauth) → **27 tests pasando**
- Build OK, typecheck OK

**Archivos clave creados/modificados:**
- `server/api/auth/{google.get,google/callback.get,logout.post,me.get}.ts`
- `server/api/predictions/{match.post,me.get}.ts` (renombrado de `user.get.ts`)
- `server/api/standings/group/[letter].get.ts`
- `server/api/admin/users/{index.get,[id]/status.patch}.ts`
- `server/api/admin/matches/[id]/result.post.ts`
- `server/api/matches/index.get.ts`
- `server/api/leaderboard/index.get.ts`
- `stores/auth.ts` (NUEVO)
- `middleware/auth.ts` (NUEVO)
- `layouts/default.vue` (refactor con sesión)
- `pages/{index,groups,leaderboard,admin/*}.vue` (sin wrapper `success:false`)
- `pages/auth/{login,pending,blocked,post-login}.vue` (NUEVOS)
- `components/auth/{GoogleSignInButton,PendingState,BlockedState}.vue` (NUEVOS)
- `types/{domain.ts,auth.d.ts}` (NUEVOS)
- `test/{auth,google-oauth}.test.ts` (NUEVOS)
- `nuxt.config.ts` (Pinia + Google config)
- `.env.example` (actualizado)
