/** Runtime configuration. Override before loading app.js in production. */
window.ACCOUNTING_TASK_CONFIG = Object.freeze({
  dataMode: 'local',
  apiBaseUrl: '/api/v1',
  requestTimeoutMs: 15000,
  maxUploadBytes: 10 * 1024 * 1024,
  locale: 'th-TH',
  // AI file review, borrowed from the task-board-worker Cloudflare Worker
  // (github.com/accountingsynnex/task-board-worker) — see services/ai-review-service.js.
  // Stays disabled until that worker is deployed and baseUrl is filled in.
  aiReview: Object.freeze({
    enabled: false,
    baseUrl: '' // e.g. 'https://task-board-worker.<your-subdomain>.workers.dev'
  })
});
