/**
 * API-backed repository for backend integration.
 *
 * The approved prototype currently renders from a synchronous in-memory cache.
 * This class is intentionally asynchronous and should be adopted while the UI
 * is migrated view-by-view to loading, success and error states.
 */
class ApiTaskService {
  constructor(client) {
    if (!client) throw new TypeError('ApiTaskService requires an HTTP client');
    this.client = client;
  }

  getCurrentUser() {
    return this.client.get('/me');
  }

  /**
   * These five methods (list/get/create/update/transition) plus updateChecklistItem below are
   * the contract AsyncTaskRepository proxies to. Their names and argument shapes intentionally
   * match LocalTaskService in domain/task-service.js one-for-one, so swapping
   * `AsyncTaskRepository.repo` from a LocalTaskService instance to an ApiTaskService instance is
   * a one-line change with no call-site updates anywhere in ui/ or pages/.
   */
  list(filters = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        query.set(key, String(value));
      }
    });
    const suffix = query.size ? `?${query.toString()}` : '';
    return this.client.get(`/tasks${suffix}`);
  }

  get(taskId) {
    return this.client.get(`/tasks/${encodeURIComponent(taskId)}`);
  }

  create(payload) {
    return this.client.post('/tasks', payload);
  }

  update(taskId, payload) {
    return this.client.patch(`/tasks/${encodeURIComponent(taskId)}`, payload);
  }

  transition(taskId, targetStatus, { reason = null, version } = {}) {
    return this.client.post(`/tasks/${encodeURIComponent(taskId)}/transitions`, {
      targetStatus,
      reason,
      version
    });
  }

  updateChecklistItem(taskId, itemId, checked, { version } = {}) {
    return this.client.patch(
      `/tasks/${encodeURIComponent(taskId)}/checklist/${encodeURIComponent(itemId)}`,
      { checked, version }
    );
  }

  // System-only transition mirroring LocalTaskService.aiReject — the backend must apply the
  // same restriction: only its own AI-review integration may call this, not a user action.
  aiReject(taskId, reason) {
    return this.client.post(`/tasks/${encodeURIComponent(taskId)}/ai-reject`, { reason });
  }

  // File transfer has no LocalTaskService equivalent (the local demo keeps metadata only and
  // stores bytes in IndexedDB — see BrowserFileStore in ui/task-detail.js), so these keep their
  // own names rather than forcing a match to addFile/removeFile.
  uploadFile(taskId, file, metadata = {}) {
    const body = new FormData();
    body.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) body.append(key, String(value));
    });
    return this.client.post(`/tasks/${encodeURIComponent(taskId)}/files`, body);
  }

  deleteFile(taskId, fileId) {
    return this.client.delete(
      `/tasks/${encodeURIComponent(taskId)}/files/${encodeURIComponent(fileId)}`
    );
  }

  downloadFile(taskId, fileId) {
    return this.client.get(
      `/tasks/${encodeURIComponent(taskId)}/files/${encodeURIComponent(fileId)}/download`
    );
  }

  listTeams() { return this.client.get('/teams'); }
  createTeam(payload) { return this.client.post('/teams', payload); }
  updateTeam(teamId, payload) { return this.client.patch(`/teams/${encodeURIComponent(teamId)}`, payload); }
  deleteTeam(teamId) { return this.client.delete(`/teams/${encodeURIComponent(teamId)}`); }

  listCategories() { return this.client.get('/categories'); }
  createCategory(payload) { return this.client.post('/categories', payload); }
  updateCategory(categoryId, payload) { return this.client.patch(`/categories/${encodeURIComponent(categoryId)}`, payload); }
  deleteCategory(categoryId) { return this.client.delete(`/categories/${encodeURIComponent(categoryId)}`); }

  listAnnualTasks() { return this.client.get('/annual-tasks'); }
  createAnnualTask(payload) { return this.client.post('/annual-tasks', payload); }
  updateAnnualTask(id, payload) { return this.client.patch(`/annual-tasks/${encodeURIComponent(id)}`, payload); }
  deleteAnnualTask(id) { return this.client.delete(`/annual-tasks/${encodeURIComponent(id)}`); }
  generateAnnualTask(id, payload) {
    return this.client.post(`/annual-tasks/${encodeURIComponent(id)}/generate`, payload);
  }

  listNotifications() { return this.client.get('/notifications'); }
  markNotificationRead(id) { return this.client.patch(`/notifications/${encodeURIComponent(id)}`, { read: true }); }
  markAllNotificationsRead() { return this.client.post('/notifications/read-all', {}); }

  getDashboardOverview(filters = {}) {
    const query = new URLSearchParams(filters);
    return this.client.get(`/dashboard/overview?${query.toString()}`);
  }

  getDashboardAnalytics(filters = {}) {
    const query = new URLSearchParams(filters);
    return this.client.get(`/dashboard/analytics?${query.toString()}`);
  }
}

window.ApiTaskService = ApiTaskService;
