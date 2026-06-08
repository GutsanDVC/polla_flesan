# **Documentación Maestra: Plataforma de Apuestas \- FIFA World Cup 2026**

Este documento constituye la especificación técnica y funcional definitiva para el desarrollo del MVP de la plataforma de apuestas recreativas. El sistema se construirá sobre una arquitectura limpia, modular y desacoplada, utilizando **NuxtJS** como framework fullstack y **PostgreSQL** (en Neon o Supabase) como motor de persistencia relacional.

## **1\. Resumen Ejecutivo y Objetivos del MVP**

El objetivo de este proyecto es construir una aplicación web ágil y altamente responsiva para realizar apuestas deportivas ("quiniela", "polla" o "prode") de manera cerrada y privada para el Mundial 2026\.

* **Foco del MVP:** Experiencia de usuario pulida en móviles, precisión absoluta en el cálculo automatizado de puntos y gestión estricta de bloqueos de apuestas basados en las fases del torneo.  
* **Modelo Económico:** Recreativo. Las transacciones monetarias se manejan "offline" (fuera de la plataforma).  
* **Despliegue:** Optimizado para la capa gratuita de **Vercel** (Nuxt Serverless Nitro Engine) y base de datos serverless PostgreSQL.

## **2\. Requerimientos del Sistema (360°)**

### **2.1 Requerimientos Funcionales (RF)**

* **RF-01: Autenticación por Invitación:** Registro e inicio de sesión exclusivo a través de Google OAuth. El Administrador debe pre-registrar el correo del usuario autorizado o aprobar solicitudes de inscripción pendientes en un panel administrativo simple.  
* **RF-02: Gestión de Pronósticos de Fase de Grupos:**  
  * Los usuarios deben ingresar marcadores para los 72 partidos de la fase de grupos.  
  * **Cálculo Automático de Posiciones:** La aplicación calculará automáticamente en tiempo real las posiciones de cada uno de los 12 grupos (posiciones 1, 2, 3 y 4\) basándose exclusivamente en los 72 marcadores pronosticados por el usuario. Se implementará un algoritmo que aplique las reglas de desempate oficiales de la FIFA (puntos, diferencia de goles y goles anotados). El usuario visualizará su tabla proyectada inmediatamente sin necesidad de un ordenamiento manual (drag-and-drop), garantizando 100% de consistencia lógica.  
  * **Bloqueo estricto:** 11 de Junio de 2026 (antes del partido inaugural). Ninguna predicción de fase de grupos puede ser modificada posterior a este hito.  
* **RF-03: Gestión Dinámica de Pronósticos de Fase Eliminatoria (Fase por Fase):**  
  * La predicción de las eliminatorias no se bloquea en su totalidad al inicio del torneo. En su lugar, se habilita de forma secuencial fase por fase (Dieciseisavos, Octavos, Cuartos, Semifinales, Final).  
  * Una vez que la fase previa ha concluido y el Administrador confirma los emparejamientos oficiales en la base de datos, se "abre" la ventana de predicción para la siguiente fase.  
  * **Bloqueo dinámico por fase:** Las apuestas de una fase eliminatoria específica (por ejemplo, Cuartos de Final) se bloquean de forma estricta en el instante en que inicia el primer partido programado de esa fase específica. Esto permite a los usuarios corregir su camino y seguir sumando puntos basándose en los equipos reales que avanzaron, manteniendo alta la retención de jugadores.  
* **RF-04: Predicciones Especiales:** Formulario de selección única para Goleador (Bota de Oro), Guante de Oro y MVP del torneo. Bloqueo idéntico al de la fase de grupos.  
* **RF-05: Motor de Cálculo de Puntos (Core Engine):**  
  * Automatización del procesamiento de puntajes en base al ingreso de resultados reales por parte del administrador.  
  * Aplicación estricta de la matriz de puntos (ver sección de negocio).  
* **RF-06: Tabla de Clasificación en Tiempo Real (Leaderboard):**  
  * Visualización del ranking general de amigos ordenados por puntaje descendente.  
  * Detalle expandible para auditar las predicciones de otros usuarios una vez que el tiempo límite de edición haya expirado (transparencia del juego).

### **2.2 Requerimientos No Funcionales (RNF)**

* **RNF-01: Seguridad en Transiciones de Fase:** El servidor debe validar el timestamp de cada petición de guardado contra la hora oficial de bloqueo de la fase correspondiente, impidiendo inyecciones vía API fuera de plazo.  
* **RNF-02: Escalabilidad y Rendimiento:** Consultas optimizadas con SQL crudo para soportar ráfagas de lectura al finalizar los partidos del mundial.  
* **RNF-03: Arquitectura Limpia:** Separación rígida en tres capas de backend (Rutas Nitro \-\> Servicios de Negocio \-\> Repositorio SQL nativo) para facilitar mantenimiento y pruebas.  
* **RNF-04: Diseño Móvil Primero (Mobile First):** Interfaz altamente responsiva, emulando una aplicación nativa, ideal para su uso desde smartphones.

## **3\. Alcance y Exclusiones**

* **En el Alcance (In-Scope):**  
  * Panel de administración básico para ingresar resultados oficiales de partidos, actualizar llaves reales para fases eliminatorias y ganadores de premios individuales.  
  * Flujo de apuestas completo de grupos y bracket de eliminatorias dinámico por fases.  
  * Sistema de notificaciones/alertas visuales dentro de la interfaz para recordar los bloqueos de apuestas de la fase activa.  
* **Fuera del Alcance (Out-of-Scope):**  
  * Procesamiento de pagos integrados (Stripe, PayPal, criptomonedas).  
  * Chats en vivo o muros de comentarios integrados (se asume coordinación por apps de mensajería externas).  
  * Generación de estadísticas avanzadas de rendimiento de jugadores.

## **4\. Diseño de Base de Datos y Estrategia de Persistencia (Supabase)**

Para garantizar consistencia y rendimiento óptimo en las consultas SQL crudas, se propone el siguiente diseño relacional estructurado en 3ª Forma Normal:

### **4.1 Evaluación de Infraestructura de Datos para Despliegue Rápido**

* **SQLite local en Nuxt:** **Descartado**. Al desplegar en Vercel, el sistema de archivos del contenedor de funciones serverless es efímero y de solo lectura. SQLite perdería todos los datos cada vez que la función serverless se reinicie (cold start).  
* **Firebase (Firestore):** **Descartado**. No es relacional. El modelo de datos de un mundial (partidos, predicciones, emparejamientos y usuarios) requiere transaccionalidad, joins de bases de datos y agregaciones complejas (como resolver desempates FIFA). Firebase requeriría reescribir toda la lógica de repositorios y no admite SQL nativo.  
* **Supabase (PostgreSQL):** **Seleccionado (Solución Óptima)**. Ofrece una base de datos PostgreSQL real y persistente con una capa gratuita excelente. Permite la conexión directa por TCP/pooling y es 100% compatible con consultas SQL nativas sin ORM. Su aprovisionamiento toma menos de 2 minutos, lo que la convierte en la opción de implementación más rápida y estable para este proyecto.

### **4.2 Esquema de Base de Datos (PostgreSQL)**

\-- 1\. Tabla de Usuarios  
CREATE TABLE users (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    email VARCHAR(255) UNIQUE NOT NULL,  
    full\_name VARCHAR(255) NOT NULL,  
    avatar\_url TEXT,  
    role VARCHAR(50) DEFAULT 'USER', \-- 'USER', 'ADMIN'  
    status VARCHAR(50) DEFAULT 'PENDING', \-- 'PENDING', 'APPROVED', 'BLOCKED'  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP  
);

\-- 2\. Tabla de Partidos  
CREATE TABLE matches (  
    id INT PRIMARY KEY, \-- ID oficial de la FIFA o secuencial  
    home\_team VARCHAR(100) NOT NULL,  
    away\_team VARCHAR(100) NOT NULL,  
    match\_date TIMESTAMP WITH TIME ZONE NOT NULL,  
    phase VARCHAR(50) NOT NULL, \-- 'GROUP', 'R32', 'R16', 'QUARTERS', 'SEMIS', 'THIRD\_PLACE', 'FINAL'  
    group\_letter CHAR(1), \-- 'A' a 'L' si es fase de grupos  
    home\_score\_real INT,  
    away\_score\_real INT,  
    status VARCHAR(50) DEFAULT 'SCHEDULED', \-- 'SCHEDULED', 'LIVE', 'FINISHED'  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP  
);

\-- 3\. Tabla de Predicciones de Partidos (Apuestas)  
CREATE TABLE match\_predictions (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    user\_id UUID REFERENCES users(id) ON DELETE CASCADE,  
    match\_id INT REFERENCES matches(id) ON DELETE CASCADE,  
    home\_score\_pred INT NOT NULL,  
    away\_score\_pred INT NOT NULL,  
    calculated\_points INT DEFAULT 0,  
    processed BOOLEAN DEFAULT FALSE,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP,  
    CONSTRAINT unique\_user\_match UNIQUE (user\_id, match\_id)  
);

\-- 4\. Tabla de Predicciones de Posiciones de Grupos  
\-- NOTA: Estas filas se calcularán y persistirán de forma automatizada en el Backend  
\-- cuando el usuario modifique una predicción de partido en el grupo correspondiente.  
CREATE TABLE group\_predictions (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    user\_id UUID REFERENCES users(id) ON DELETE CASCADE,  
    group\_letter CHAR(1) NOT NULL,  
    pos\_1\_team VARCHAR(100) NOT NULL,  
    pos\_2\_team VARCHAR(100) NOT NULL,  
    pos\_3\_team VARCHAR(100) NOT NULL,  
    calculated\_points INT DEFAULT 0,  
    processed BOOLEAN DEFAULT FALSE,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP,  
    CONSTRAINT unique\_user\_group UNIQUE (user\_id, group\_letter)  
);

\-- 5\. Tabla de Predicciones Especiales y Ganadores Finales  
CREATE TABLE special\_predictions (  
    user\_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,  
    top\_scorer VARCHAR(255),  
    golden\_glove VARCHAR(255),  
    mvp VARCHAR(255),  
    champion\_team VARCHAR(255),  
    calculated\_points INT DEFAULT 0,  
    processed BOOLEAN DEFAULT FALSE,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP  
);

## **5\. Arquitectura por Capas en Nuxt Server (Backend)**

La API del servidor Nuxt (directorio /server) se dividirá estrictamente bajo el flujo de responsabilidades:

1. **Route (Entrada/HTTP):** Recibe el payload, valida la sesión del usuario (Google Auth) y delega la ejecución al Servicio correspondiente.  
2. **Service (Negocio):** Implementa las reglas de cálculo, lógica de bloqueos por fecha y validación lógica de los datos. No sabe nada de HTTP ni de bases de datos directamente.  
3. **Repository (Persistencia):** Ejecuta consultas SQL crudas utilizando un cliente Postgres (pg). Es la única capa que interactúa con la base de datos.

### **Diagrama de Flujo del Backend y Despliegue**

\[Cliente Nuxt/Browser\]   
       │ (HTTP POST /api/bets)  
       ▼ \[Desplegado en Vercel\]  
\[Route: server/api/bets/index.post.ts\]   \<-- Valida Auth & Formato  
       │  
       ▼  
\[Service: server/services/BetService.ts\]  \<-- Aplica Reglas de Negocio / Fecha límite  
       │  
       ▼  
\[Repository: server/repositories/BetRepository.ts\] \<-- Query SQL Cruda  
       │  
       ▼ \[Conexión TCP / Pool de Conexiones\]  
\[Base de Datos PostgreSQL (Alojada en Supabase)\]

## **6\. Pseudo-código de Tareas Críticas**

Para evitar el acoplamiento y la deuda técnica, se detalla el flujo completo para dos de las operaciones más delicadas del backend: **Guardar una apuesta** (con control de bloqueo dinámico) y el **Cálculo automático de puntos**.

### **6.0 Configuración de la Conexión de Base de Datos (/server/utils/db.ts)**

Para conectar de forma eficiente la función Serverless de Vercel con la base de datos PostgreSQL de Supabase, utilizaremos la biblioteca pg configurando un **Pool de Conexiones**.

import pg from 'pg';

const { Pool } \= pg;

// Cargamos la variable de entorno DATABASE\_URL que proporciona Supabase  
// NOTA: Para ambientes serverless de Vercel, se recomienda usar el Transaction Connection String de Supabase (puerto 6543\)  
const connectionString \= process.env.DATABASE\_URL;

if (\!connectionString) {  
    console.error("ADVERTENCIA: La variable de entorno DATABASE\_URL no está definida.");  
}

export const dbClient \= new Pool({  
    connectionString,  
    // Configuraciones clave para entornos Serverless de Vercel  
    max: 10, // Control de concurrencia para evitar saturación de conexiones en el tier gratuito  
    idleTimeoutMillis: 30000, // Cerrar conexiones inactivas para liberar recursos  
    connectionTimeoutMillis: 2000, // Tiempo límite de espera para conectar  
    ssl: {  
        rejectUnauthorized: false // Requerido por Supabase para conexiones SSL seguras  
    }  
});

### **6.1 Flujo: Guardar Apuesta de Partido (Grupos y Eliminatorias)**

#### **Capa 1: Route (/server/api/predictions/match.post.ts)**

// Pseudocódigo del manejador de la ruta de Nuxt Server (Nitro)  
export default defineEventHandler(async (event) \=\> {  
    try {  
        // 1\. Validar autenticación del usuario mediante sesión de Google  
        const session \= await getUserSession(event);  
        if (\!session || \!session.userId) {  
            throw createError({ statusCode: 401, statusMessage: 'No autorizado' });  
        }

        const body \= await readBody(event);  
        const { matchId, homeScorePred, awayScorePred } \= body;

        // 2\. Validación básica de formato  
        if (matchId \=== undefined || homeScorePred \=== undefined || awayScorePred \=== undefined) {  
            throw createError({ statusCode: 400, statusMessage: 'Parámetros inválidos' });  
        }

        // 3\. Delegar al Servicio de Predicciones  
        const predictionService \= new PredictionService();  
        const result \= await predictionService.saveMatchPrediction(  
            session.userId,   
            matchId,   
            homeScorePred,   
            awayScorePred  
        );

        return { success: true, data: result };  
    } catch (error: any) {  
        return { success: false, error: error.message || 'Error interno del servidor' };  
    }  
});

#### **Capa 2: Service (/server/services/PredictionService.ts)**

import { PredictionRepository } from '../repositories/PredictionRepository';  
import { MatchRepository } from '../repositories/MatchRepository';

export class PredictionService {  
    private predictionRepo \= new PredictionRepository();  
    private matchRepo \= new MatchRepository();

    async saveMatchPrediction(userId: string, matchId: number, homeScore: number, awayScore: number) {  
        // 1\. Obtener la información del partido para verificar fechas y fase  
        const match \= await this.matchRepo.getMatchById(matchId);  
        if (\!match) {  
            throw new Error('El partido no existe.');  
        }

        const currentDate \= new Date();

        // 2\. Regla de Negocio: Validar bloqueo dinámico por fase  
        if (match.phase \=== 'GROUP') {  
            // Fase de Grupos tiene fecha fija (antes de la inauguración oficial)  
            const blockDate \= new Date('2026-06-11T00:00:00Z');   
            if (currentDate \>= blockDate) {  
                throw new Error('La fase de grupos está bloqueada. No se permiten más modificaciones.');  
            }  
        } else {  
            // Fases eliminatorias: Bloquear estrictamente al iniciar el primer partido de la fase del partido  
            const phaseStartDate \= await this.matchRepo.getMinDateByPhase(match.phase);  
            if (\!phaseStartDate) {  
                throw new Error('No se ha podido definir la fecha de inicio de la fase.');  
            }  
            if (currentDate \>= phaseStartDate) {  
                throw new Error(\`La fase eliminatoria ${match.phase} está en juego y bloqueada.\`);  
            }  
        }

        // 3\. Persistir en la base de datos a través del Repositorio  
        const prediction \= await this.predictionRepo.upsertMatchPrediction(userId, matchId, homeScore, awayScore);

        // 4\. Lógica Adicional Automática para Grupos: Recalcular la tabla del grupo basándose en los partidos del usuario  
        if (match.phase \=== 'GROUP' && match.group\_letter) {  
            await this.recalculateAndSaveGroupPositions(userId, match.group\_letter);  
        }

        return prediction;  
    }

    private async recalculateAndSaveGroupPositions(userId: string, groupLetter: string) {  
        const groupMatches \= await this.matchRepo.getMatchesByGroup(groupLetter);  
        const userPredictions \= await this.predictionRepo.getPredictionsByUserAndMatches(  
            userId,   
            groupMatches.map(m \=\> m.id)  
        );

        const standing \= this.calculateStandings(groupMatches, userPredictions);

        await this.predictionRepo.upsertGroupPrediction(  
            userId,   
            groupLetter,   
            standing\[0\], // pos\_1\_team  
            standing\[1\], // pos\_2\_team  
            standing\[2\]  // pos\_3\_team  
        );  
    }

    private calculateStandings(matches: any\[\], predictions: any\[\]): string\[\] {  
        const stats: Record\<string, { points: number, gd: number, gf: number }\> \= {};

        matches.forEach(m \=\> {  
            if (\!stats\[m.home\_team\]) stats\[m.home\_team\] \= { points: 0, gd: 0, gf: 0 };  
            if (\!stats\[m.away\_team\]) stats\[m.away\_team\] \= { points: 0, gd: 0, gf: 0 };  
        });

        predictions.forEach(p \=\> {  
            const match \= matches.find(m \=\> m.id \=== p.match\_id);  
            if (\!match) return;

            const home \= match.home\_team;  
            const away \= match.away\_team;  
            const hs \= p.home\_score\_pred;  
            const as \= p.away\_score\_pred;

            stats\[home\].gf \+= hs;  
            stats\[away\].gf \+= as;  
            stats\[home\].gd \+= (hs \- as);  
            stats\[away\].gd \+= (as \- hs);

            if (hs \> as) {  
                stats\[home\].points \+= 3;  
            } else if (as \> hs) {  
                stats\[away\].points \+= 3;  
            } else {  
                stats\[home\].points \+= 1;  
                stats\[away\].points \+= 1;  
            }  
        });

        return Object.keys(stats).sort((a, b) \=\> {  
            if (stats\[b\].points \!== stats\[a\].points) {  
                return stats\[b\].points \- stats\[a\].points;  
            }  
            if (stats\[b\].gd \!== stats\[a\].gd) {  
                return stats\[b\].gd \- stats\[a\].gd;  
            }  
            return stats\[b\].gf \- stats\[a\].gf;  
        });  
    }  
}

#### **Capa 3: Repository (/server/repositories/PredictionRepository.ts)**

import { dbClient } from '../utils/db'; // Cliente pg nativo configurado con Supabase

export class PredictionRepository {  
    async upsertMatchPrediction(userId: string, matchId: number, homeScore: number, awayScore: number) {  
        const query \= \`  
            INSERT INTO match\_predictions (user\_id, match\_id, home\_score\_pred, away\_score\_pred, updated\_at)  
            VALUES ($1, $2, $3, $4, NOW())  
            ON CONFLICT (user\_id, match\_id)   
            DO UPDATE SET   
                home\_score\_pred \= EXCLUDED.home\_score\_pred,  
                away\_score\_pred \= EXCLUDED.away\_score\_pred,  
                updated\_at \= NOW()  
            RETURNING \*;  
        \`;  
          
        const values \= \[userId, matchId, homeScore, awayScore\];  
        const result \= await dbClient.query(query, values);  
        return result.rows\[0\];  
    }

    async upsertGroupPrediction(userId: string, groupLetter: string, pos1: string, pos2: string, pos3: string) {  
        const query \= \`  
            INSERT INTO group\_predictions (user\_id, group\_letter, pos\_1\_team, pos\_2\_team, pos\_3\_team, updated\_at)  
            VALUES ($1, $2, $3, $4, $5, NOW())  
            ON CONFLICT (user\_id, group\_letter)   
            DO UPDATE SET   
                pos\_1\_team \= EXCLUDED.pos\_1\_team,  
                pos\_2\_team \= EXCLUDED.pos\_2\_team,  
                pos\_3\_team \= EXCLUDED.pos\_3\_team,  
                updated\_at \= NOW()  
            RETURNING \*;  
        \`;  
        const values \= \[userId, groupLetter, pos1, pos2, pos3\];  
        await dbClient.query(query, values);  
    }  
}

### **6.2 Flujo: Motor de Puntuación (Cálculo de Partido)**

Este flujo es ejecutado por el administrador cuando se registra el marcador definitivo de un partido jugado.

#### **Capa 2: Core Service (/server/services/PointsCalculatorService.ts)**

export class PointsCalculatorService {  
      
    // Método puro que implementa las reglas del JSON sin tocar base de datos  
    calculatePointsForMatch(  
        homeReal: number,   
        awayReal: number,   
        homePred: number,   
        awayPred: number  
    ): number {  
        let points \= 0;

        const isExactMatch \= (homeReal \=== homePred) && (awayReal \=== awayPred);  
          
        const realWinner \= homeReal \> awayReal ? 'HOME' : (awayReal \> homeReal ? 'AWAY' : 'DRAW');  
        const predWinner \= homePred \> awayPred ? 'HOME' : (awayPred \> homePred ? 'AWAY' : 'DRAW');  
        const isWinnerMatch \= realWinner \=== predWinner;

        // Regla: No acumulativo entre Resultado Exacto (10 pts) y Ganador/Empate sin marcador (5 pts)  
        if (isExactMatch) {  
            points \+= 10;  
        } else if (isWinnerMatch) {  
            points \+= 5;  
        }

        // Acierto cantidad total de goles del partido (+2 puntos)  
        const totalGolesReal \= homeReal \+ awayReal;  
        const totalGolesPred \= homePred \+ awayPred;  
        if (totalGolesReal \=== totalGolesPred) {  
            points \+= 2;  
        }

        // Acierto un solo equipo goles (+1 punto)  
        if (\!isExactMatch) {  
            if (homeReal \=== homePred) points \+= 1;  
            if (awayReal \=== awayPred) points \+= 1;  
        }

        return points;  
    }

    // Proceso orquestador que actualiza todas las predicciones para un partido finalizado  
    async processMatchResults(matchId: number, homeRealScore: number, awayRealScore: number) {  
        const predictionRepo \= new PredictionRepository();  
          
        // 1\. Buscar todas las predicciones de los usuarios para ese partido  
        const predictions \= await predictionRepo.getPredictionsByMatch(matchId);

        for (const pred of predictions) {  
            const calculatedPoints \= this.calculatePointsForMatch(  
                homeRealScore,   
                awayRealScore,   
                pred.home\_score\_pred,   
                pred.away\_score\_pred  
            );

            // 2\. Actualizar los puntos calculados en la DB usando SQL Crudo  
            await predictionRepo.updatePredictionPoints(pred.id, calculatedPoints);  
        }  
    }  
}

## **7\. Plan de Control de Calidad (QA)**

Para asegurar la robustez de las reglas matemáticas y de la seguridad de la app, se ejecutará una estrategia de testing en tres fases:

1. **Pruebas Unitarias (Backend Core):**  
   * Framework: Vitest.  
   * Objetivo: Probar el método calculatePointsForMatch con todos los escenarios del JSON y el algoritmo de cálculo de posiciones del grupo (calculateStandings) para verificar que resuelva los desempates según la lógica estricta de la FIFA.  
2. **Pruebas de Integración (API y Bloqueos):**  
   * Objetivo: Validar que el repositorio de persistencia guarde correctamente el registro en la base de datos de PostgreSQL usando queries crudas y que el servicio de predicciones bloquee efectivamente las solicitudes de forma dinámica dependiendo de la fase activa evaluada.  
3. **Pruebas de Extremo a Extremo (E2E):**  
   * Framework: Playwright.  
   * Objetivo: Automatizar el flujo crítico: Un usuario inicia sesión con Google (simulado), ingresa a la pestaña de fase de grupos, llena sus pronósticos y verifica que se reflejen correctamente en su perfil y en la tabla de clasificación.

## **8\. Estimación Temporal e Hitos de Entrega y Despliegue**

El desarrollo se distribuirá en un plan intensivo de **4 Sprints** de una semana cada uno para llegar listos a producción.

\[Sprint 1: Base & Auth\] ──► \[Sprint 2: Motor & Grupos\] ──► \[Sprint 3: Bracket & Admin\] ──► \[Sprint 4: QA & Prod\]

### **8.1 Pasos para el Despliegue Rápido (Supabase \+ Vercel)**

Este proceso toma menos de 10 minutos una vez programada la app:

1. **Creación en Supabase:** Crear un proyecto nuevo (gratuito) en Supabase para obtener la base de datos PostgreSQL de inmediato.  
2. **Obtener Cadena de Conexión:** Ir a *Settings \-\> Database* en Supabase y copiar la URI de conexión de modo Pooler (puerto 6543), ya que las funciones de Vercel necesitan optimizar el pool de conexiones.  
3. **Ejecutar Esquema de Base de Datos:** Pegar el script de creación de tablas (Sección 4.2) en el editor SQL de Supabase para inicializar la base de datos.  
4. **Vercel Deploy:** Conectar el repositorio de GitHub a Vercel.  
5. **Configuración de Variables de Entorno en Vercel:** Agregar la variable DATABASE\_URL con la cadena de conexión de Supabase y las llaves de Google Auth. ¡Y listo\!

### **8.2 Plan de Sprints**

* **Sprint 1: Cimiento de Arquitectura, Autenticación y Conexión Supabase**  
  * Configuración inicial del pool en /server/utils/db.ts.  
  * Creación de las tablas iniciales en Supabase y primera prueba de inserción por consola.  
  * Integración del flujo de Google OAuth y aprobación de accesos.  
* **Sprint 2: Motor de Apuestas y Fase de Grupos**  
  * Implementación del motor de cálculo de puntos.  
  * Interfaz visual de carga de pronósticos para los 72 partidos de grupo.  
  * Algoritmo de cálculo automático de posiciones de grupos basado en predicciones de partidos e implementación de reglas de desempate de la FIFA.  
* **Sprint 3: Fase Eliminatoria Dinámica (Bracket Secuencial) y Panel de Admin**  
  * Interfaz del bracket interactivo que renderiza dinámicamente según la fase actual cargada por el Administrador.  
  * Panel administrativo para ingreso de resultados y configuración de llaves eliminatorias reales.  
* **Sprint 4: Tabla de Líderes, QA y Despliegue**  
  * Vista del Leaderboard global con auditoría pública post-bloqueo.  
  * Ejecución del set de pruebas unitarias y de integración.  
  * Despliegue continuo en Vercel apuntando a la base de datos de producción de Supabase.