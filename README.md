# 🎵 DJ Hub

A full-stack SaaS platform for DJs to discover music, manage channels, and get AI-powered recommendations powered by the Deezer API.

[![CI](https://github.com/your-org/dj-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/dj-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔐 **Authentication** – GitHub OAuth + Email/Password via NextAuth.js
- 💳 **Stripe Subscriptions** – Free, Pro ($19.99/mo), Enterprise ($99.99/mo)
- 🎵 **Deezer Integration** – Music search, recommendations by genre/BPM/energy
- 📻 **Channel Management** – Create, organize, and share curated music channels
- 🎛️ **Music Preferences** – Configure genre, BPM, energy, danceability filters
- 🤖 **Smart Recommendations** – Personalized track suggestions from Deezer
- 🎨 **shadcn/ui** – Beautiful, accessible UI components
- 🚀 **Production Ready** – Docker, GitHub Actions CI/CD, Vercel deployment

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite (via Prisma ORM) |
| Auth | NextAuth.js v4 |
| Payments | Stripe |
| Music API | Deezer API |
| UI | shadcn/ui + Tailwind CSS |
| Deployment | Vercel / Docker |

## 📁 Project Structure

```
dj-hub-nextjs/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Register pages
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── api/               # REST API endpoints
│   │   │   ├── auth/          # NextAuth + Register
│   │   │   ├── users/         # User CRUD
│   │   │   ├── preferences/   # Music preferences
│   │   │   ├── channels/      # Channel management
│   │   │   ├── recommendations/ # Deezer recommendations
│   │   │   ├── subscriptions/ # Subscription info
│   │   │   ├── stripe/        # Checkout, Portal, Webhook
│   │   │   └── health/        # Health check
│   │   ├── pricing/           # Pricing page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── auth/              # Login/Register forms
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/            # Navigation, Providers
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── deezer.ts          # Deezer API client
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── stripe.ts          # Stripe config & helpers
│   │   ├── utils.ts           # Utility functions
│   │   └── validations.ts     # Zod schemas
│   └── types/                 # TypeScript types
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI pipeline
│       └── deploy.yml         # Vercel deployment
├── Dockerfile
├── docker-compose.yml
├── next.config.js
├── tailwind.config.ts
└── vercel.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A Stripe account (for payments)
- A GitHub OAuth App (for auth)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/dj-hub.git
cd dj-hub-nextjs
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"  # openssl rand -base64 32

# GitHub OAuth (https://github.com/settings/applications/new)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Stripe (https://dashboard.stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Setup Database

```bash
# Push schema to database
npm run db:push

# (Optional) Seed with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo accounts (after seeding):**
| Email | Password | Plan |
|-------|----------|------|
| admin@djhub.com | admin123 | Enterprise |
| pro@djhub.com | pro123 | Pro |
| free@djhub.com | free123 | Free |

## 🌐 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/[...nextauth]` | NextAuth handler |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/:id` | Get user details |
| `PATCH` | `/api/users/:id` | Update user profile |
| `DELETE` | `/api/users/:id` | Delete account |

### Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/preferences` | Get user preferences |
| `PUT` | `/api/preferences` | Update preferences |

### Channels

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/channels` | List user channels |
| `POST` | `/api/channels` | Create channel |
| `GET` | `/api/channels/:id` | Get channel |
| `PATCH` | `/api/channels/:id` | Update channel |
| `DELETE` | `/api/channels/:id` | Delete channel |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/recommendations?limit=20` | Get recommendations |
| `POST` | `/api/recommendations` | Submit track feedback |

### Subscriptions & Stripe

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/subscriptions` | Get subscription |
| `POST` | `/api/stripe/checkout` | Create Stripe checkout |
| `POST` | `/api/stripe/portal` | Open billing portal |
| `POST` | `/api/stripe/webhook` | Stripe webhook handler |

## 💳 Stripe Setup

### Create Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create **Pro** product: $19.99/month recurring
3. Create **Enterprise** product: $99.99/month recurring
4. Copy the Price IDs to your `.env.local`

### Webhook Setup (Development)

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook secret to STRIPE_WEBHOOK_SECRET
```

### Webhook Events

The following Stripe events are handled:
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 🐳 Docker

### Build & Run

```bash
# Build image
docker build -t dj-hub .

# Run with Docker Compose
docker-compose up -d
```

### Environment Variables for Docker

Create a `.env` file (not committed) with all production variables.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set all environment variables in Vercel Dashboard
3. Deploy automatically on push to `main`

**Note:** For Vercel deployment, use a persistent database (e.g., [PlanetScale](https://planetscale.com), [Turso](https://turso.tech), or [Neon](https://neon.tech)) instead of SQLite.

### GitHub Actions

Required secrets in your repo:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 🗄️ Database Schema

```
User ──── Account (OAuth)
     ──── Session
     ──── Subscription (Stripe)
     ──── Preference (music settings)
     ──── Channel[] ──── Track[]
     ──── Recommendation[]
```

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
npm run db:push      # Push Prisma schema
npm run db:migrate   # Run migrations
npm run db:generate  # Regenerate Prisma client
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed demo data
```

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT sessions via NextAuth
- API routes protected with session checks
- Stripe webhook signature verification
- Input validation with Zod schemas
- CORS headers configured

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ for the DJ community. Powered by [Next.js](https://nextjs.org) and [Deezer API](https://developers.deezer.com).
