# Mini ERP Frontend

React frontend aplikacija za Mini ERP sistem, izgrađena sa Vite i TypeScript.

## 🚀 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand (client state) + TanStack Query (server state)
- **HTTP Client**: Axios
- **UI**: Tailwind CSS + Radix UI komponente
- **Charts**: Recharts
- **i18n**: i18next (Srpski + Engleski)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## 📁 Struktura projekta

```
frontend/
├── src/
│   ├── features/           # Feature modules
│   │   ├── auth/          # Autentifikacija
│   │   ├── clients/       # Klijenti
│   │   ├── invoices/      # Fakture
│   │   ├── payments/      # Uplate
│   │   ├── expenses/      # Troškovi
│   │   └── reports/       # Dashboard i izveštaji
│   ├── components/        # Zajedničke komponente
│   │   ├── ui/           # UI komponente (shadcn/ui)
│   │   └── layouts/      # Layout komponente
│   ├── stores/           # Zustand stores
│   ├── lib/              # Utiliti funkcije
│   │   ├── axios.ts      # API konfiguracija
│   │   ├── i18n.ts       # i18next setup
│   │   └── utils.ts      # Helper funkcije
│   ├── locales/          # Prevodi
│   │   ├── sr.json       # Srpski
│   │   └── en.json       # Engleski
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🛠️ Instalacija i pokretanje

### Preduslov

- Node.js (v18+)
- npm ili yarn

### Korak 1: Instalacija paketa

```bash
npm install
```

### Korak 2: Konfiguracija okruženja

Kopirajte `env.example` u `.env` i popunite vrednosti:

```bash
cp env.example .env
```

Primer `.env` fajla:

```env
VITE_API_URL=http://localhost:3000/api
```

### Korak 3: Pokretanje dev servera

```bash
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:5173`

## 🏗️ Build za produkciju

```bash
npm run build
```

Build fajlovi će biti u `dist/` folderu.

## 📝 Komande

```bash
npm run dev          # Pokretanje dev servera
npm run build        # Build za produkciju
npm run preview      # Preview production build-a
npm run lint         # ESLint
npm run format       # Prettier formatiranje
```

## 🌐 Višejezična podrška

Aplikacija podržava srpski (primarni) i engleski jezik. Prevodi se nalaze u:

- `src/locales/sr.json` - Srpski
- `src/locales/en.json` - Engleski

Koristi se `i18next` biblioteka za internacionalizaciju.

## 🎨 UI Komponente

Projekat koristi kombinaciju Tailwind CSS-a i Radix UI komponenti za moderne i pristupačne UI elemente.

## 📊 State Management

- **Server State**: TanStack Query (React Query) - caching, refetching, optimistic updates
- **Client State**: Zustand - autentifikacija, globalno stanje aplikacije

## 🔒 Autentifikacija

Aplikacija koristi JWT tokene koje čuva u localStorage preko Zustand store-a. Axios interceptor automatski dodaje token u svaki request.

## 🌈 Features

- Responsive dizajn
- Dark mode support (opciono)
- Real-time data updates
- Form validacija
- Error handling
- Loading states
- Toast notifikacije

## 📄 Licenca

MIT
