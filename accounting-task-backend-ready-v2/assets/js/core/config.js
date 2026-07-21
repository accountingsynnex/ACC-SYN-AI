/** Runtime configuration. Override before loading app.js in production. */
window.ACCOUNTING_TASK_CONFIG = Object.freeze({
  dataMode: 'local',
  apiBaseUrl: '/api/v1',
  requestTimeoutMs: 15000,
  maxUploadBytes: 10 * 1024 * 1024,
  locale: 'th-TH'
});
