/**
 * Small HTTP client for the backend integration phase.
 * It is intentionally dependency-free and is not enabled while dataMode=local.
 */
class AccountingTaskApiClient {
  constructor({ baseUrl, timeoutMs = 15000, getAccessToken = () => null }) {
    this.baseUrl = String(baseUrl || '').replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.getAccessToken = getAccessToken;
  }

  async request(path, { method = 'GET', body, headers = {}, signal } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const token = await this.getAccessToken();
    const requestHeaders = { Accept: 'application/json', ...headers };
    const isFormData = body instanceof FormData;
    if (body != null && !isFormData) requestHeaders['Content-Type'] = 'application/json';
    if (token) requestHeaders.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: requestHeaders,
        body: body == null ? undefined : isFormData ? body : JSON.stringify(body),
        signal: signal || controller.signal,
        credentials: 'include'
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message = payload?.error?.message || payload?.message || `Request failed (${response.status})`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }

  get(path, options) { return this.request(path, { ...options, method: 'GET' }); }
  post(path, body, options) { return this.request(path, { ...options, method: 'POST', body }); }
  patch(path, body, options) { return this.request(path, { ...options, method: 'PATCH', body }); }
  delete(path, options) { return this.request(path, { ...options, method: 'DELETE' }); }
}

window.AccountingTaskApiClient = AccountingTaskApiClient;
