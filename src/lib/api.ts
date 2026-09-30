// Resend / Mailhost API Client

const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || "https://api.buy4cashback.com";
};

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
  tags?: { name: string; value: string }[];
  scheduled_at?: string;
  template_id?: string;
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

export interface InboundEmailDetail extends InboundEmailSummary {
  message_id: string;
  text: string;
  html: string;
  attachments?: any;
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
  default_subscription: boolean;
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

export class APIClient {
  private token: string | null = null;
  private onUnauthorizedCallback?: (token: string) => void;

  constructor(token?: string | null) {
    if (token) this.token = token;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setOnUnauthorized(cb?: (token: string) => void) {
    this.onUnauthorizedCallback = cb;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const base = getBaseUrl();
    const url = `${base}${endpoint}`;

    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const requestToken = this.token;
    if (requestToken) {
      headers.set("Authorization", `Bearer ${requestToken}`);
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await res.text();
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

    if (
      res.status === 401 &&
      ["invalid api key", "missing api key"].includes(serverMessage?.toLowerCase() || "")
    ) {
      if (requestToken && this.onUnauthorizedCallback) {
        this.onUnauthorizedCallback(requestToken);
      }
      throw new APIError(
        serverMessage || "Session expired or unauthorized. Please sign in again.",
        res.status,
        data
      );
    }

    if (!res.ok) {
      throw new APIError(serverMessage || `HTTP error ${res.status}`, res.status, data);
    }

    if (res.status === 204 || res.status === 205) {
      return {} as T;
    }
    if (data === undefined) {
      throw new APIError(
        responseText.trim()
          ? `Invalid JSON response (HTTP ${res.status})`
          : `Empty response (HTTP ${res.status})`,
        res.status
      );
    }

    return data as T;
  }

  // System
  async getHealth() {
    return this.request<{ status: string }>("/healthz");
  }

  async getReadiness() {
    return this.request<{ status: string }>("/readyz");
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
    return this.request<{ data: { id: string }[] }>("/v1/emails/batch", {
      method: "POST",
      body: JSON.stringify(emails),
    });
  }

  async cancelEmail(id: string) {
    return this.request<{ id: string; cancelled: boolean }>(
      `/v1/emails/${id}/cancel`,
      { method: "POST" }
    );
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

  async createDomain(name: string, region = "us-east-1") {
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
  async listInbound(limit = 50) {
    return this.request<{ data: InboundEmailSummary[] }>(
      `/v1/inbound?limit=${limit}`
    );
  }

  async getInbound(id: string) {
    return this.request<InboundEmailDetail>(`/v1/inbound/${id}`);
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

  async deleteAlias(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/aliases/${id}`, {
      method: "DELETE",
    });
  }

  // Audiences & Contacts
  async listAudiences() {
    return this.request<{ data: AudienceView[] }>("/v1/audiences");
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

  async listContacts(audienceId?: string) {
    const url = audienceId ? `/v1/audiences/${audienceId}/contacts` : "/v1/contacts";
    return this.request<{ data: ContactView[] }>(url);
  }

  async createContact(data: {
    email: string;
    first_name?: string;
    last_name?: string;
    unsubscribed?: boolean;
    audience_id?: string;
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

  async createBroadcast(data: {
    name: string;
    from: string;
    subject: string;
    html?: string;
    text?: string;
    audience_id?: string;
    scheduled_at?: string;
  }) {
    return this.request<BroadcastView>("/v1/broadcasts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async sendBroadcast(id: string) {
    return this.request<{ id: string; status: string }>(
      `/v1/broadcasts/${id}/send`,
      { method: "POST" }
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

  async createWebhook(data: { url: string; events: string[]; status?: string }) {
    return this.request<WebhookView>("/v1/webhooks", {
      method: "POST",
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
  async listAuditLogs(limit = 50) {
    return this.request<{ data: AuditLogView[] }>(`/v1/audit-logs?limit=${limit}`);
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

  async deleteSegment(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/segments/${id}`, {
      method: "DELETE",
    });
  }

  async listTopics() {
    return this.request<{ data: TopicView[] }>("/v1/topics");
  }

  async createTopic(data: { name: string; description?: string; default_subscription?: boolean }) {
    return this.request<TopicView>("/v1/topics", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteTopic(id: string) {
    return this.request<{ id: string; deleted: boolean }>(`/v1/topics/${id}`, {
      method: "DELETE",
    });
  }

  // Segment Contacts
  async listSegmentContacts(segmentId: string) {
    return this.request<{ data: ContactView[] }>(`/v1/segments/${segmentId}/contacts`);
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

  // Custom Events
  async triggerEvent(data: { name: string; email: string; data?: Record<string, any> }) {
    return this.request<CustomEvent>("/v1/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listEvents(limit = 50) {
    return this.request<{ data: CustomEvent[] }>(`/v1/events?limit=${limit}`);
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
