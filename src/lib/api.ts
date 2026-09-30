// Resend / Mailhost API Client

const getBaseUrl = (): string => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.buy4cashback.com"
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }
  return configuredUrl.replace(/\/+$/, "");
};

export const getConfiguredAPIBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";

// API Types
export interface UserView {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
  created_at: string;
}

export interface UserAccountView {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

export interface AuthSession {
  token: string;
  apiKey?: string;
  user?: UserView;
  account?: UserAccountView;
  accounts?: UserAccountView[];
}

export interface CurrentUserResponse {
  object: "user" | "account_info";
  id?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  email_verified?: boolean;
  created_at?: string;
  current_account?: UserAccountView;
  accounts?: UserAccountView[];
  account?: Pick<UserAccountView, "id" | "name" | "created_at">;
}

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  purpose: string;
  required?: boolean;
  status?: string;
}

export interface DomainView {
  id: string;
  name: string;
  status: "not_started" | "pending" | "verified" | "failed" | string;
  region: string;
  open_tracking: boolean;
  click_tracking: boolean;
  tls: string;
  inbound_webhook_url?: string;
  webhook_secret?: string;
  created_at: string;
  verified_at?: string;
  records: DNSRecord[];
}

export interface APIKeyView {
  id: string;
  name: string;
  permission: "full_access" | "sending_access" | string;
  domain_id?: string;
  last_four: string;
  created_at: string;
  last_used_at?: string;
}

export interface EmailSummary {
  id: string;
  batch_id?: string;
  from: string;
  subject: string;
  status?: "pending" | "queued" | "sent" | "delivered" | "bounced" | "failed" | "canceled" | string;
  created_at: string;
}

export interface DeliveryView {
  id: string;
  recipient: string;
  status: "pending" | "queued" | "delivered" | "bounced" | "failed" | string;
  attempts: number;
  last_error?: string;
  updated_at: string;
}

export interface EventView {
  delivery_id: string;
  type: "sent" | "delivered" | "bounced" | "opened" | "clicked" | "failed" | string;
  detail?: string;
  created_at: string;
}

export interface EmailDetail {
  id: string;
  batch_id?: string;
  from: string;
  subject: string;
  message_id: string;
  created_at: string;
  deliveries: DeliveryView[];
  events: EventView[];
}

export interface SendEmailPayload {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  reply_to?: string[];
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  attachments?: { filename: string; content: string; content_type?: string }[];
  tags?: { name: string; value: string }[];
  scheduled_at?: string;
  template_id?: string;
  template?: string;
  variables?: Record<string, unknown>;
}

export interface BulkEmailPayload {
  from: string;
  reply_to?: string[];
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  attachments?: { filename: string; content: string; content_type?: string }[];
  recipients: { to: string; variables: Record<string, string> }[];
}

export interface BatchStatusView {
  batch_id: string;
  total: number;
  statuses: Record<string, number>;
}

export interface InboundEmailSummary {
  id: string;
  domain_id: string;
  mail_from: string;
  rcpt_to: string[];
  from: string;
  subject: string;
  size: number;
  created_at: string;
}

export interface InboundAttachment {
  filename: string;
  content_type: string;
  size: number;
}

export interface InboundEmailDetail extends InboundEmailSummary {
  message_id: string;
  text: string;
  html: string;
  attachments?: InboundAttachment[];
}

export interface AliasView {
  id: string;
  domain_id: string;
  name: string;
  address: string;
  alias?: string;
  destinations: string[];
  forward_to?: string[];
  store_copy?: boolean;
  created_at: string;
}

export interface AudienceView {
  id: string;
  name: string;
  created_at: string;
}

export interface ContactView {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  unsubscribed: boolean;
  traits?: Record<string, unknown>;
  created_at: string;
}

export interface BroadcastView {
  id: string;
  name: string;
  from: string;
  subject: string;
  status: "draft" | "queued" | "sending" | "sent" | string;
  audience_id?: string;
  segment_id?: string;
  topic_id?: string;
  reply_to?: string[];
  preview_text?: string;
  html?: string;
  text?: string;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface TemplateView {
  id: string;
  name: string;
  alias?: string;
  subject: string;
  html: string;
  text: string;
  status: "draft" | "published" | string;
  variables?: { key: string; type: string; fallback_value?: string }[];
  created_at: string;
  updated_at: string;
}

export interface WebhookView {
  id: string;
  url: string;
  events: string[];
  status: "active" | "disabled" | string;
  signing_secret?: string;
  created_at: string;
  updated_at: string;
}

export interface SMTPCredView {
  id: string;
  domain_id: string;
  email: string;
  name: string;
  username: string;
  last_used_at?: string;
  created_at: string;
}

export interface DedicatedIPView {
  id: string;
  ip_address: string;
  status: string;
  warmup_day: number;
  daily_quota: number;
  sent_today: number;
  created_at: string;
}

export interface OrgMemberView {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AuditLogView {
  id: string;
  account_id: string;
  actor: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface SegmentView {
  id: string;
  name: string;
  filter?: any;
  created_at: string;
}

export interface TopicView {
  id: string;
  name: string;
  description?: string;
  visibility: "public" | "private" | string;
  created_at: string;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  subject: string;
  html: string;
  text: string;
  created_at: string;
}

export interface AutomationStep {
  id: string;
  type: "send_email" | "delay" | "condition" | "add_to_segment" | "remove_from_segment" | string;
  config: {
    template_id?: string;
    from?: string;
    subject?: string;
    html?: string;
    text?: string;
    delay_seconds?: number;
    field?: string;
    operator?: string;
    value?: any;
    segment_id?: string;
  };
  then_steps?: AutomationStep[];
  else_steps?: AutomationStep[];
}

export interface AutomationTrigger {
  type: "event" | "contact.created" | "email.opened" | "email.clicked" | string;
  event_name?: string;
}

export interface AutomationView {
  id: string;
  name: string;
  status: "active" | "draft" | "paused" | string;
  trigger: AutomationTrigger;
  steps: AutomationStep[];
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: string;
  automation_id: string;
  trigger_event_id?: string;
  contact_id?: string;
  status: "running" | "waiting" | "completed" | "failed" | string;
  current_step?: string;
  started_at: string;
  completed_at?: string;
}

export interface AutomationRunDetail {
  id: string;
  automation_id: string;
  contact_email: string;
  event_name: string;
  event_data: Record<string, unknown>;
  status: string;
  current_step_index: number;
  step_results: unknown[];
  created_at: string;
  updated_at: string;
}

export interface CustomEvent {
  id: string;
  name: string;
  contact_email: string;
  data: Record<string, any>;
  created_at: string;
}

export interface UserSession {
  id: string;
  account_id: string;
  created_at: string;
  last_used_at?: string;
  expires_at: string;
  is_current?: boolean;
}


export interface AnalyticsCounts {
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  opened: number;
  clicked: number;
}

export interface AnalyticsBucket {
  bucket: string;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  opened: number;
  clicked: number;
}

export interface AnalyticsResponse {
  from: string;
  to: string;
  interval: string;
  domain_id?: string;
  totals: AnalyticsCounts;
  rates: {
    delivery_rate: number;
    bounce_rate: number;
    failure_rate: number;
    open_rate: number;
    click_rate: number;
  };
  series: AnalyticsBucket[];
}

export interface APIPage<T> {
  data: T[];
  next_before?: string;
}

export class APIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

const API_CACHE_TTL_MS = 8_000;
const API_CACHE_MAX_ENTRIES = 128;
const API_READ_TIMEOUT_MS = 15_000;
const API_WRITE_TIMEOUT_MS = 60_000;

interface CachedAPIResponse {
  expiresAt: number;
  value: unknown;
}

export class APIClient {
  private token: string | null = null;
  private onUnauthorizedCallback?: (token: string) => void;
  private cacheRevision = 0;
  private readonly responseCache = new Map<string, CachedAPIResponse>();
  private readonly pendingGETs = new Map<string, Promise<unknown>>();

  constructor(token?: string | null) {
    if (token) this.token = token;
  }

  setToken(token: string | null) {
    if (this.token !== token) this.clearCache();
    this.token = token;
  }

  clearCache() {
    this.cacheRevision += 1;
    this.responseCache.clear();
    this.pendingGETs.clear();
  }

  setOnUnauthorized(cb?: (token: string) => void) {
    this.onUnauthorizedCallback = cb;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheTTL = API_CACHE_TTL_MS,
    responseType: "json" | "blob" | "text" | "response" = "json",
    retryStaleRead = true
  ): Promise<T> {
    const base = getBaseUrl();
    const url = `${base}${endpoint}`;
    const method = (options.method || "GET").toUpperCase();
    const requestToken = this.token;
    if (method !== "GET") this.clearCache();
    const canCache = method === "GET" && cacheTTL > 0 && responseType === "json";
    const cacheKey = `${method}:${responseType}:${url}`;

    if (canCache) {
      const cached = this.responseCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        this.responseCache.delete(cacheKey);
        this.responseCache.set(cacheKey, cached);
        return cached.value as T;
      }
      if (cached) this.responseCache.delete(cacheKey);

      if (!options.signal) {
        const pending = this.pendingGETs.get(cacheKey);
        if (pending) return pending as Promise<T>;
      }
    }

    const revision = this.cacheRevision;
    const requestPromise = this.performRequest<T>(url, options, requestToken, responseType);
    if (canCache && !options.signal) this.pendingGETs.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      if (canCache && revision !== this.cacheRevision && retryStaleRead) {
        if (this.pendingGETs.get(cacheKey) === requestPromise) {
          this.pendingGETs.delete(cacheKey);
        }
        return this.request<T>(endpoint, options, cacheTTL, responseType, false);
      }
      if (canCache && revision === this.cacheRevision) {
        this.responseCache.set(cacheKey, {
          value: result,
          expiresAt: Date.now() + cacheTTL,
        });
        while (this.responseCache.size > API_CACHE_MAX_ENTRIES) {
          const oldestKey = this.responseCache.keys().next().value;
          if (oldestKey === undefined) break;
          this.responseCache.delete(oldestKey);
        }
      }
      return result;
    } finally {
      if (this.pendingGETs.get(cacheKey) === requestPromise) {
        this.pendingGETs.delete(cacheKey);
      }
    }
  }

  private async performRequest<T>(
    url: string,
    options: RequestInit,
    requestToken: string | null,
    responseType: "json" | "blob" | "text" | "response"
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (
      options.body &&
      !(typeof FormData !== "undefined" && options.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    if (requestToken) {
      headers.set("Authorization", `Bearer ${requestToken}`);
    }

    const controller = new AbortController();
    const callerSignal = options.signal;
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, (options.method || "GET").toUpperCase() === "GET"
      ? API_READ_TIMEOUT_MS
      : API_WRITE_TIMEOUT_MS);
    const abortFromCaller = () => controller.abort();
    if (callerSignal?.aborted) controller.abort();
    else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      if (requestToken !== this.token) {
        throw new APIError("The active credential changed before the request completed.", 0);
      }
      if (responseType === "response" && res.status >= 300 && res.status < 400) {
        return res as T;
      }
      const responseText = responseType === "blob" && res.ok ? "" : await res.text();
      let data: unknown;
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = undefined;
        }
      }

      const responseData = data as
        | { message?: unknown; error?: unknown }
        | undefined;
      const serverMessage =
        (typeof responseData?.message === "string" && responseData.message) ||
        (typeof responseData?.error === "string" && responseData.error) ||
        (typeof data === "string" && data) ||
        (responseText.trim() && data === undefined ? responseText.trim() : undefined);

      if (res.status === 401) {
        this.clearCache();
        if (requestToken && this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback(requestToken);
        }
      }

      if (!res.ok) {
        throw new APIError(
          serverMessage || (res.status === 401
            ? "Session expired or unauthorized. Please sign in again."
            : `HTTP error ${res.status}`),
          res.status,
          data
        );
      }

      if (res.status === 204 || res.status === 205) {
        return {} as T;
      }
      if (responseType === "blob") return await res.blob() as T;
      if (responseType === "text") return responseText as T;
      if (responseType === "response") return res as T;
      if (data === undefined) {
        throw new APIError(
          responseText.trim()
            ? `Invalid JSON response (HTTP ${res.status})`
            : `Empty response (HTTP ${res.status})`,
          res.status
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof APIError) throw error;
      if (didTimeout) {
        throw new APIError("The request timed out. Please try again.", 0, error);
      }
      if (callerSignal?.aborted) {
        throw new APIError("The request was cancelled.", 0, error);
      }
      if (error instanceof TypeError) {
        throw new APIError("Could not connect to the API. Check your connection and try again.", 0, error);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    }
  }

  // System
  async getHealth() {
    return this.request<{ status: string }>("/healthz", {}, 0);
  }

  async getReadiness() {
    return this.request<{ status: string }>("/readyz", {}, 0);
  }

  async getMetrics() {
    return this.request<string>("/metrics", { headers: { Accept: "text/plain" } }, 0, "text");
  }

  async getPluginManifest() {
    return this.request<Record<string, unknown>>("/.well-known/ai-plugin.json");
  }

  async getOpenAPISpec() {
    return this.request<Record<string, unknown>>("/openapi.json");
  }

  async getOpenAPIYAML() {
    return this.request<string>("/openapi.yaml", { headers: { Accept: "application/x-yaml" } }, 0, "text");
  }

  async getPluginLogo() {
    return this.request<Blob>("/logo.png", { headers: { Accept: "image/svg+xml" } }, 0, "blob");
  }

  async getLegalTerms() {
    return this.request<string>("/legal", { headers: { Accept: "text/plain" } }, 0, "text");
  }

  async getMCPStatus() {
    return this.request<{ status: string; service: string; version: string; tools: number }>(
      "/mcp",
      {},
      0
    );
  }

  async callMCP<T = unknown>(request: {
    jsonrpc: "2.0";
    id?: string | number;
    method: string;
    params?: Record<string, unknown>;
  }) {
    return this.request<T>("/mcp", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async trackOpen(deliveryId: string) {
    return this.request<Blob>(
      `/v1/track/open/${encodeURIComponent(deliveryId)}`,
      { headers: { Accept: "image/gif" } },
      0,
      "blob"
    );
  }

  async trackClick(deliveryId: string, targetURL: string) {
    const query = new URLSearchParams({ url: targetURL });
    return this.request<Response>(
      `/v1/track/click/${encodeURIComponent(deliveryId)}?${query}`,
      { redirect: "manual" },
      0,
      "response"
    );
  }

  async unsubscribeContact(deliveryId: string) {
    return this.request<{ id: string; email: string; unsubscribed: boolean; message: string }>(
      `/v1/unsubscribe/${encodeURIComponent(deliveryId)}`,
      { method: "POST", headers: { Accept: "application/json" } }
    );
  }

  async getUnsubscribePage(deliveryId: string) {
    return this.request<string>(
      `/v1/unsubscribe/${encodeURIComponent(deliveryId)}`,
      { headers: { Accept: "text/html" } },
      0,
      "text"
    );
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    name?: string;
    organization_name?: string;
  }) {
    return this.request<{
      object: string;
      token: string;
      verification_token: string;
      verification_url: string;
      user: UserView;
      account: UserAccountView;
      api_key: string;
    }>("/v1/users/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{
      object: string;
      token: string;
      user: UserView;
      current_account: UserAccountView;
      accounts: UserAccountView[];
    }>("/v1/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(token: string) {
    return this.request<{ message: string }>("/v1/users/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async verifyEmailFromLink(token: string) {
    const query = new URLSearchParams({ token });
    return this.request<{ message: string }>(`/v1/users/verify-email?${query}`, {}, 0);
  }

  async resendVerification(email: string) {
    return this.request<{ message: string }>("/v1/users/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>("/v1/users/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request<{ message: string }>("/v1/users/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }
  async getMe() {
    return this.request<CurrentUserResponse>("/v1/users/me");
  }

  async listAccounts() {
    return this.request<{ data: UserAccountView[] }>("/v1/users/accounts");
  }

  async switchAccount(accountId: string) {
    return this.request<{ object: string; current_account: UserAccountView }>(
      "/v1/users/switch-account",
      {
        method: "POST",
        body: JSON.stringify({ account_id: accountId }),
      }
    );
  }

  // Analytics
  async getAnalytics(params?: {
    from?: string;
    to?: string;
    interval?: "hour" | "day" | "week" | "month";
    domain_id?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.from) search.set("from", params.from);
    if (params?.to) search.set("to", params.to);
    if (params?.interval) search.set("interval", params.interval);
    if (params?.domain_id) search.set("domain_id", params.domain_id);
    const query = search.toString() ? `?${search.toString()}` : "";
    return this.request<AnalyticsResponse>(`/v1/analytics${query}`);
  }

  // Emails
  async listEmails(limit = 50, before?: string, status?: string) {
    const q = new URLSearchParams({ limit: limit.toString() });
    if (before) q.set("before", before);
    if (status && status !== "all") q.set("status", status);
    return this.request<{ data: EmailSummary[]; next_before?: string }>(
      `/v1/emails?${q.toString()}`
    );
  }

  async getEmail(id: string) {
    return this.request<EmailDetail>(`/v1/emails/${id}`);
  }

  async sendEmail(payload: SendEmailPayload) {
    return this.request<{ id: string }>("/v1/emails", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async sendBatch(emails: SendEmailPayload[]) {
    return this.request<{ batch_id: string; data: { id: string }[] }>("/v1/emails/batch", {
      method: "POST",
      body: JSON.stringify(emails),
    });
  }

  async sendBulk(payload: BulkEmailPayload) {
    return this.request<{ batch_id: string; count: number; status: string }>("/v1/emails/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getBatch(id: string) {
    return this.request<BatchStatusView>(`/v1/batches/${id}`);
  }

  async cancelEmail(id: string) {
    return this.request<{ id: string; cancelled: boolean }>(
      `/v1/emails/${id}/cancel`,
      { method: "POST" }
    );
  }

  async cancelEmailWithPatch(id: string) {
    return this.request<{ id: string; cancelled: boolean }>(`/v1/emails/${id}`, {
      method: "PATCH",
    });
  }

  // Render Preview
  async renderEmail(data: { html?: string; text?: string; variables?: Record<string, any> }) {
    return this.request<{ html: string; text: string }>("/v1/render", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Domains
  async listDomains() {
    return this.request<{ data: DomainView[] }>("/v1/domains");
  }

  async getDomain(id: string) {
    return this.request<DomainView>(`/v1/domains/${id}`);
  }

  async createDomain(name: string, region: string) {
    return this.request<DomainView>("/v1/domains", {
      method: "POST",
      body: JSON.stringify({ name, region }),
    });
  }

  async verifyDomain(id: string) {
    return this.request<DomainView>(`/v1/domains/${id}/verify`, {
      method: "POST",
    });
  }

  async deleteDomain(id: string) {
    return this.request<{ id: string; object: string; deleted: boolean }>(
      `/v1/domains/${id}`,
      { method: "DELETE" }
    );
  }

  // API Keys
  async listAPIKeys() {
    return this.request<{ data: APIKeyView[] }>("/v1/api-keys");
  }

  async createAPIKey(name: string, permission: "full_access" | "sending_access" = "full_access", domain_id?: string) {
    return this.request<{
      id: string;
      name: string;
      permission: string;
      api_key: string;
      last_four: string;
      created_at: string;
      domain_id?: string;
    }>("/v1/api-keys", {
      method: "POST",
      body: JSON.stringify({ name, permission, domain_id }),
    });
  }

  async deleteAPIKey(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/api-keys/${id}`, {
      method: "DELETE",
    });
  }

  // Inbound & Aliases
  async listInbound(limit = 50, before?: string, domainId?: string) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set("before", before);
    if (domainId) query.set("domain_id", domainId);
    return this.request<APIPage<InboundEmailSummary>>(`/v1/inbound?${query}`);
  }

  async getInbound(id: string) {
    return this.request<InboundEmailDetail>(`/v1/inbound/${id}`);
  }

  async getInboundRaw(id: string) {
    return this.request<Blob>(
      `/v1/inbound/${id}/raw`,
      { headers: { Accept: "message/rfc822" } },
      0,
      "blob"
    );
  }

  async getReceivedEmail(id: string) {
    return this.request<InboundEmailDetail>(`/v1/emails/receiving/${id}`);
  }

  async listReceivedEmails(limit = 50, before?: string) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set("before", before);
    return this.request<APIPage<InboundEmailSummary>>(`/v1/emails/receiving?${query}`);
  }

  async listReceivedAttachments(id: string) {
    return this.request<{ data: InboundAttachment[] }>(
      `/v1/emails/receiving/${id}/attachments`
    );
  }

  async listAliases() {
    return this.request<{ data: AliasView[] }>("/v1/aliases");
  }

  async createAlias(data: {
    domain_id?: string;
    name?: string;
    alias?: string;
    forward_to?: string[];
    destinations?: string[];
    store_copy?: boolean;
  }) {
    const payload = {
      domain_id: data.domain_id,
      name: data.name || (data.alias ? data.alias.split("@")[0] : ""),
      destinations: data.destinations || data.forward_to || [],
      store_copy: data.store_copy ?? true,
    };
    return this.request<AliasView>("/v1/aliases", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAlias(id: string) {
    return this.request<AliasView>(`/v1/aliases/${id}`);
  }

  async updateAlias(id: string, data: { destinations: string[]; store_copy: boolean }) {
    return this.request<AliasView>(`/v1/aliases/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAlias(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/aliases/${id}`, {
      method: "DELETE",
    });
  }

  // Audiences & Contacts
  async listAudiences() {
    return this.request<{ data: AudienceView[] }>("/v1/audiences");
  }

  async getAudience(id: string) {
    return this.request<AudienceView>(`/v1/audiences/${id}`);
  }

  async createAudience(name: string) {
    return this.request<AudienceView>("/v1/audiences", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async deleteAudience(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/audiences/${id}`, {
      method: "DELETE",
    });
  }

  async listContacts(audienceId?: string, limit = 50, before?: string) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set("before", before);
    const path = audienceId
      ? `/v1/audiences/${encodeURIComponent(audienceId)}/contacts`
      : "/v1/contacts";
    return this.request<APIPage<ContactView>>(`${path}?${query}`);
  }

  async createContact(data: {
    email: string;
    first_name?: string;
    last_name?: string;
    unsubscribed?: boolean;
    audience_id?: string;
    traits?: Record<string, unknown>;
  }) {
    const url = data.audience_id ? `/v1/audiences/${data.audience_id}/contacts` : "/v1/contacts";
    return this.request<ContactView>(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: string, audienceId?: string) {
    const url = audienceId ? `/v1/audiences/${audienceId}/contacts/${id}` : `/v1/contacts/${id}`;
    return this.request<{ id: string; deleted: boolean }>(url, {
      method: "DELETE",
    });
  }

  async getContact(id: string, audienceId?: string) {
    const url = audienceId ? `/v1/audiences/${audienceId}/contacts/${id}` : `/v1/contacts/${id}`;
    return this.request<ContactView>(url);
  }

  async updateContact(id: string, data: {
    first_name?: string;
    last_name?: string;
    unsubscribed?: boolean;
    traits?: Record<string, any>;
    audience_id?: string;
  }) {
    const url = data.audience_id ? `/v1/audiences/${data.audience_id}/contacts/${id}` : `/v1/contacts/${id}`;
    return this.request<ContactView>(url, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Broadcasts
  async listBroadcasts() {
    return this.request<{ data: BroadcastView[] }>("/v1/broadcasts");
  }

  async getBroadcast(id: string) {
    return this.request<BroadcastView>(`/v1/broadcasts/${id}`);
  }

  async updateBroadcast(id: string, data: {
    name?: string;
    from?: string;
    subject?: string;
    reply_to?: string[];
    preview_text?: string;
    html?: string;
    text?: string;
    audience_id?: string;
    segment_id?: string;
    topic_id?: string;
    scheduled_at?: string;
  }) {
    return this.request<{ id: string; updated: boolean }>(`/v1/broadcasts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async createBroadcast(data: {
    name: string;
    from: string;
    subject: string;
    html?: string;
    text?: string;
    audience_id?: string;
    segment_id?: string;
    topic_id?: string;
    reply_to?: string[];
    preview_text?: string;
    scheduled_at?: string;
  }) {
    return this.request<BroadcastView>("/v1/broadcasts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async sendBroadcast(id: string, scheduledAt?: string) {
    return this.request<{ id: string; status: string }>(
      `/v1/broadcasts/${id}/send`,
      {
        method: "POST",
        body: JSON.stringify(scheduledAt ? { scheduled_at: scheduledAt } : {}),
      }
    );
  }

  async duplicateBroadcast(id: string) {
    return this.request<BroadcastView>(`/v1/broadcasts/${id}/duplicate`, {
      method: "POST",
    });
  }

  async deleteBroadcast(id: string) {
    return this.request<{ id: string; deleted: boolean }>(
      `/v1/broadcasts/${id}`,
      { method: "DELETE" }
    );
  }

  // Templates
  async listTemplates() {
    return this.request<{ data: TemplateView[] }>("/v1/templates");
  }

  async getTemplate(id: string) {
    return this.request<TemplateView>(`/v1/templates/${id}`);
  }

  async updateTemplate(id: string, data: {
    name?: string;
    alias?: string;
    subject?: string;
    html?: string;
    text?: string;
    variables?: { key: string; type: string; fallback_value?: string }[];
  }) {
    return this.request<TemplateView>(`/v1/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async createTemplate(data: {
    name: string;
    alias?: string;
    subject: string;
    html?: string;
    text?: string;
    variables?: { key: string; type: string; fallback_value?: string }[];
  }) {
    return this.request<TemplateView>("/v1/templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async publishTemplate(id: string) {
    return this.request<{ id: string; status: string }>(
      `/v1/templates/${id}/publish`,
      { method: "POST" }
    );
  }

  async deleteTemplate(id: string) {
    return this.request<{ id: string; deleted: boolean }>(
      `/v1/templates/${id}`,
      { method: "DELETE" }
    );
  }

  // Webhooks
  async listWebhooks() {
    return this.request<{ data: WebhookView[] }>("/v1/webhooks");
  }

  async getWebhook(id: string) {
    return this.request<WebhookView>(`/v1/webhooks/${id}`);
  }

  async createWebhook(data: { url: string; events: string[]; status?: string }) {
    return this.request<WebhookView>("/v1/webhooks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWebhook(id: string, data: { url?: string; events?: string[]; status?: "active" | "disabled" }) {
    return this.request<{ id: string; updated: boolean }>(`/v1/webhooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/webhooks/${id}`, {
      method: "DELETE",
    });
  }

  // SMTP Credentials
  async listSMTPCredentials() {
    return this.request<{ data: SMTPCredView[] }>("/v1/smtp-credentials");
  }

  async createSMTPCredential(email: string, name?: string) {
    return this.request<{
      id: string;
      email: string;
      name: string;
      username: string;
      password: string;
      created_at: string;
    }>("/v1/smtp-credentials", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
  }

  async deleteSMTPCredential(id: string) {
    return this.request<{ id: string; deleted: boolean }>(
      `/v1/smtp-credentials/${id}`,
      { method: "DELETE" }
    );
  }

  // Dedicated IPs & Warmup Schedule
  async listDedicatedIPs() {
    return this.request<{ data: DedicatedIPView[] }>("/v1/ips");
  }

  async getWarmingSchedule() {
    return this.request<{ schedule: any[] }>("/v1/ips/warming-schedule");
  }

  async updateIPWarmup(id: string, data: { status?: "warming" | "active" | "paused"; warmup_day?: number; daily_quota?: number }) {
    return this.request<{ id: string; object: string; updated: boolean }>(`/v1/ips/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Organization Members
  async listMembers() {
    return this.request<{ data: OrgMemberView[] }>("/v1/members");
  }

  async addMember(email: string, role = "user") {
    return this.request<OrgMemberView>("/v1/members", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  }

  async removeMember(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/members/${id}`, {
      method: "DELETE",
    });
  }

  // Audit Logs
  async listAuditLogs(limit = 50, before?: string) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set("before", before);
    return this.request<APIPage<AuditLogView>>(`/v1/audit-logs?${query}`);
  }

  // Suppressions
  async listSuppressions(limit = 50) {
    return this.request<{ data: { address: string; reason?: string; created_at: string }[] }>(
      `/v1/suppressions?limit=${limit}`
    );
  }

  async deleteSuppression(address: string) {
    return this.request<{ address: string; deleted: boolean }>(
      `/v1/suppressions/${encodeURIComponent(address)}`,
      { method: "DELETE" }
    );
  }

  // Domain Settings
  async updateDomain(
    id: string,
    data: {
      open_tracking?: boolean;
      click_tracking?: boolean;
      tls?: string;
      inbound_webhook_url?: string | null;
    }
  ) {
    return this.request<DomainView>(`/v1/domains/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Segments & Topics
  async listSegments() {
    return this.request<{ data: SegmentView[] }>("/v1/segments");
  }

  async createSegment(data: { name: string; filter?: any }) {
    return this.request<SegmentView>("/v1/segments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSegment(id: string) {
    return this.request<SegmentView>(`/v1/segments/${id}`);
  }

  async updateSegment(id: string, data: { name?: string; filter?: Record<string, unknown> }) {
    return this.request<SegmentView>(`/v1/segments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteSegment(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/segments/${id}`, {
      method: "DELETE",
    });
  }

  async listTopics() {
    return this.request<{ data: TopicView[] }>("/v1/topics");
  }

  async createTopic(data: { name: string; description?: string; visibility?: "public" | "private" }) {
    return this.request<TopicView>("/v1/topics", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTopic(id: string) {
    return this.request<TopicView>(`/v1/topics/${id}`);
  }

  async updateTopic(id: string, data: { name?: string; description?: string; visibility?: "public" | "private" }) {
    return this.request<TopicView>(`/v1/topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTopic(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/topics/${id}`, {
      method: "DELETE",
    });
  }

  // Segment Contacts
  async listSegmentContacts(segmentId: string, limit = 50, before?: string) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set("before", before);
    return this.request<APIPage<ContactView>>(
      `/v1/segments/${encodeURIComponent(segmentId)}/contacts?${query}`
    );
  }

  // Contact Segments
  async listContactSegments(contactId: string) {
    return this.request<{ data: SegmentView[] }>(`/v1/contacts/${contactId}/segments`);
  }

  async addContactToSegment(contactId: string, segmentId: string) {
    return this.request<{ contact_id: string; segment_id: string }>(
      `/v1/contacts/${contactId}/segments/${segmentId}`,
      { method: "POST" }
    );
  }

  async removeContactFromSegment(contactId: string, segmentId: string) {
    return this.request<{ contact_id: string; segment_id: string; deleted: boolean }>(
      `/v1/contacts/${contactId}/segments/${segmentId}`,
      { method: "DELETE" }
    );
  }

  // Contact Topics
  async listContactTopics(contactId: string) {
    return this.request<{ data: (TopicView & { status: string })[] }>(
      `/v1/contacts/${contactId}/topics`
    );
  }

  async updateContactTopic(contactId: string, topicId: string, status: "subscribed" | "unsubscribed") {
    return this.request<{ contact_id: string; topic_id: string; status: string }>(
      `/v1/contacts/${contactId}/topics/${topicId}`,
      {
        method: "POST",
        body: JSON.stringify({ status }),
      }
    );
  }

  async removeContactTopic(contactId: string, topicId: string) {
    return this.request<{ contact_id: string; topic_id: string; deleted: boolean }>(
      `/v1/contacts/${contactId}/topics/${topicId}`,
      { method: "DELETE" }
    );
  }

  // Template Versions & Rollback
  async listTemplateVersions(templateId: string) {
    return this.request<{ data: TemplateVersion[] }>(`/v1/templates/${templateId}/versions`);
  }

  async rollbackTemplate(templateId: string, version: number) {
    return this.request<TemplateView>(`/v1/templates/${templateId}/rollback/${version}`, {
      method: "POST",
    });
  }

  // Automations
  async listAutomations() {
    return this.request<{ data: AutomationView[] }>("/v1/automations");
  }

  async getAutomation(id: string) {
    return this.request<AutomationView>(`/v1/automations/${id}`);
  }

  async createAutomation(data: {
    name: string;
    status?: "active" | "draft" | "paused";
    trigger: AutomationTrigger;
    steps: AutomationStep[];
  }) {
    return this.request<AutomationView>("/v1/automations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAutomation(
    id: string,
    data: {
      name?: string;
      status?: "active" | "draft" | "paused";
      trigger?: AutomationTrigger;
      steps?: AutomationStep[];
    }
  ) {
    return this.request<AutomationView>(`/v1/automations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAutomation(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/automations/${id}`, {
      method: "DELETE",
    });
  }

  async listAutomationRuns(automationId: string) {
    return this.request<{ data: AutomationRun[] }>(`/v1/automations/${automationId}/runs`);
  }

  async getAutomationRun(automationId: string, runId: string) {
    return this.request<AutomationRunDetail>(
      `/v1/automations/${automationId}/runs/${runId}`
    );
  }

  // Custom Events
  async triggerEvent(data: { name: string; email: string; data?: Record<string, any> }) {
    return this.request<CustomEvent>("/v1/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listEvents(limit = 50, before?: string) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (before) query.set("before", before);
    return this.request<APIPage<CustomEvent>>(`/v1/events?${query}`);
  }

  async getEvent(id: string) {
    return this.request<CustomEvent>(`/v1/events/${id}`);
  }

  // User Profile & Sessions & Accounts
  async updateCurrentUser(data: { name?: string; avatar_url?: string }) {
    return this.request<UserView>("/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { current_password?: string; new_password: string }) {
    return this.request<{ message: string }>("/v1/users/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async changeEmail(newEmail: string, password = "") {
    return this.request<{ message: string }>("/v1/users/change-email", {
      method: "POST",
      body: JSON.stringify({ new_email: newEmail, password }),
    });
  }

  async createAccount(name: string) {
    return this.request<UserAccountView>("/v1/users/accounts", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async listSessions() {
    return this.request<{ data: UserSession[] }>("/v1/users/sessions");
  }

  async revokeSession(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/users/sessions/${id}`, {
      method: "DELETE",
    });
  }

  async revokeAllOtherSessions() {
    return this.request<{ object: string; revoked: number; message: string }>(
      "/v1/users/sessions/revoke-others",
      {
        method: "POST",
      }
    );
  }

  async logout() {
    return this.request<{ message: string }>("/v1/users/logout", {
      method: "POST",
    });
  }
}

export const api = new APIClient();
