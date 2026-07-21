/**
 * Client for the task-board-worker AI file-review endpoints (separate Cloudflare Worker —
 * see https://github.com/accountingsynnex/task-board-worker). It only exposes the AI-comparison
 * and reference-file endpoints, not that worker's own task board — this app keeps its own task
 * schema/status machine in domain/task-service.js and only borrows the "compare a submission
 * against reference examples with Gemini" feature.
 *
 * Disabled by default: window.ACCOUNTING_TASK_CONFIG.aiReview.enabled must be true and
 * .baseUrl must point at a deployed worker, otherwise AiReview.service stays null and callers
 * should treat AI review as unavailable (skip it, don't block the submission on it).
 */
class AiReviewService {
  constructor(client) {
    if (!client) throw new TypeError('AiReviewService requires an HTTP client');
    this.client = client;
  }

  // Returns { status: 'pass'|'fail', reason: string }
  reviewFile(taskType, file) {
    const body = new FormData();
    body.append('taskType', taskType);
    body.append('file', file);
    return this.client.post('/ai-review', body);
  }

  listReferences(taskType) {
    return this.client.get(`/references?taskType=${encodeURIComponent(taskType)}`);
  }

  uploadReference(taskType, file) {
    const body = new FormData();
    body.append('taskType', taskType);
    body.append('file', file);
    return this.client.post('/references', body);
  }

  deleteReference(key) {
    return this.client.delete(`/references?key=${encodeURIComponent(key)}`);
  }
}

window.AiReviewService = AiReviewService;

// Shared instance the UI reaches for. `service` stays null until baseUrl is configured, so
// call sites must null-check before use (see AiReview.service?.reviewFile(...) in task-detail.js).
const AiReview = (() => {
  const cfg = window.ACCOUNTING_TASK_CONFIG?.aiReview || {};
  const service = cfg.enabled && cfg.baseUrl
    ? new AiReviewService(new AccountingTaskApiClient({ baseUrl: cfg.baseUrl }))
    : null;
  return { enabled: Boolean(service), service };
})();
window.AiReview = AiReview;
