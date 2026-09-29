# Resend Frontend (resend-fe)

A minimal, ultra-clean web dashboard for **Mailhost / Resend API**, built with **Next.js 14**, **Tailwind CSS**, and **TypeScript**. Designed with the crisp, modern dark-mode aesthetic of [resend.com](https://resend.com).

---

## Features

- **Dashboard & Analytics**: Real-time KPI cards (Sent, Delivered, Opened, Clicked, Bounced) with aggregated interval metrics (hour, day, week, month) and email volume charts.
- **Emails**: Complete outbound email explorer with delivery logs, event timelines (`sent` -> `delivered` -> `opened` -> `clicked`), recipient status tracking, and batch sender.
- **Email Composer**: Interactive email modal with live HTML rendering and template preview.
- **Domains & Deliverability**: Domain registration, DKIM cryptographic key management, DNS configuration tables (DKIM TXT, SPF, MX, DMARC, BIMI) with one-click copy, and live verification.
- **API Keys**: Scoped API keys generation (`full_access` vs `sending_access`), domain restrictions, and key revocation.
- **Inbound & Receiving**: Port 25 incoming mail viewer, raw RFC 822 MIME parser, `.eml` download, and forwarding aliases.
- **Audiences & Contacts**: Subscriber list management, unsubscribed status tracking, and contact segments.
- **Broadcasts**: Email marketing campaigns composer, instant dispatch, and campaign duplication.
- **Templates**: Reusable email templates with variable interpolation (`{{name}}`) and instant live preview.
- **Webhooks**: Real-time event webhooks with signing secret HMAC verification.
- **SMTP**: SMTP credentials generator and setup instructions for Nodemailer, Python, Laravel, and WordPress.
- **Health & Readiness**: `/readyz` dependency checks (Postgres, Redis, Mongo, Secretbox) and Prometheus metrics link.

---

## Getting Started

### 1. Prerequisites

- **Node.js**: v18+ or v20+ (tested on Node v24)
- **Backend**: Mailhost running on `http://localhost:8080` (Docker Compose or binary)

### 2. Development

```bash
cd resend-fe
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 3. Production Build

```bash
npm run build
npm start
```

---

## Configuration

| Environment Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend Mailhost HTTP address | `http://localhost:8080` |

The Next.js dev server also automatically proxies `/backend/*` requests directly to `http://localhost:8080/*` for seamless development without CORS issues.
