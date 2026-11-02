import cron from 'node-cron';

export const RETENTION_DAYS = 730;
const DAY_MS = 24 * 60 * 60 * 1000;

// Deletes every entry whose last activity is older than the retention period.
export function purgeInactive(store, now = Date.now(), days = RETENTION_DAYS) {
  let removed = 0;
  for (const [id, row] of store) {
    if (now - (row.lastActiveAt ?? row.createdAt) > days * DAY_MS) {
      store.delete(id);
      removed += 1;
    }
  }
  return removed;
}

// Daily purge at 03:00.
export function startRetentionJob(store) {
  cron.schedule('0 3 * * *', () => purgeInactive(store));
}
