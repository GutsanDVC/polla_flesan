import { MatchSyncService } from '../services/MatchSyncService';
import { LiveScoreService } from '../services/LiveScoreService';

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();
  const intervalMs = Number(config.liveSyncInterval) || 180000;

  let lastSyncTime = 0;
  const MIN_SYNC_INTERVAL = 60000;

  const syncService = new MatchSyncService();
  const liveService = new LiveScoreService();

  async function runLiveSync() {
    try {
      const hasLive = await liveService.hasLiveMatches();
      if (!hasLive) {
        return;
      }

      const now = Date.now();
      if (now - lastSyncTime < MIN_SYNC_INTERVAL) {
        return;
      }

      lastSyncTime = now;
      const result = await syncService.run();
      console.log(
        `[live-sync] Sync completado: ${result.updated} actualizados, ` +
        `${result.finished} finalizados, ${result.errors.length} errores, ` +
        `${result.durationMs}ms`
      );
    } catch (error) {
      console.error('[live-sync] Error en sincronización:', error);
    }
  }

  const timer = setInterval(runLiveSync, intervalMs);

  console.log(`[live-sync] Auto-sync habilitado cada ${intervalMs / 1000}s`);

  nitroApp.hooks.hook('close', () => {
    clearInterval(timer);
    console.log('[live-sync] Auto-sync detenido');
  });
});
