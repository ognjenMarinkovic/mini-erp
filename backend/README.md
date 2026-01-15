# Mini ERP Backend

Backend REST API za Mini ERP sistem, izgrađen sa NestJS i PostgreSQL.

## 🚀 Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Autentifikacija**: JWT (Passport)
- **Dokumentacija**: Swagger/OpenAPI
- **Email**: NodeMailer
- **PDF**: pdfmake
- **Validacija**: class-validator

## 📁 Struktura projekta

```
backend/
├── prisma/
│   └── schema.prisma         # Database schema
├── src/
│   ├── auth/                 # Autentifikacija i autorizacija
│   ├── clients/              # Upravljanje klijentima
│   ├── invoices/             # Fakture i stavke
│   ├── payments/             # Evidencija uplata
│   ├── expenses/             # Troškovi
│   ├── reports/              # Dashboard i izveštaji
│   ├── pdf/                  # PDF generisanje
│   ├── notifications/        # Email notifikacije
│   ├── prisma/               # Prisma servis
│   ├── common/               # Zajednički resursi
│   ├── app.module.ts
│   └── main.ts
└── package.json
```

## 🛠️ Instalacija i pokretanje

### Preduslov

- Node.js (v18+)
- PostgreSQL (v14+)
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
DATABASE_URL="postgresql://user:password@localhost:5432/mini_erp?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

### Korak 3: Migracija baze podataka

```bash
# Generisanje Prisma klijenta
npm run prisma:generate

# Pokretanje migracija
npm run prisma:migrate

# (Opciono) Otvaranje Prisma Studio
npm run prisma:studio
```

### Korak 4: Pokretanje servera

```bash
# Development mod (sa hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Server će biti dostupan na `http://localhost:3000`

## 📚 API Dokumentacija

Swagger dokumentacija je dostupna na:

```
http://localhost:3000/api/docs
```

## 🔒 Autentifikacija

API koristi JWT tokene za autentifikaciju. Nakon login-a, dobijate access token koji treba da pošaljete u Authorization header-u:

```
Authorization: Bearer <your-token>
```

## 📊 Database Schema

### Glavni entiteti:

- **User** - Korisnici sistema
- **Company** - Kompanije
- **Client** - Klijenti kompanije
- **Invoice** - Fakture
- **InvoiceItem** - Stavke fakture
- **Payment** - Uplate
- **Expense** - Troškovi

## 🧪 Testiranje

```bash
# Unit testovi
npm run test

# E2E testovi
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Komande

```bash
npm run build          # Build projekta
npm run start          # Pokretanje servera
npm run start:dev      # Dev mod sa watch
npm run lint           # ESLint
npm run format         # Prettier formatiranje
npm run prisma:generate # Generisanje Prisma klijenta
npm run prisma:migrate  # Pokretanje migracija
npm run prisma:studio   # Otvaranje Prisma Studio GUI
```

## 🌐 Environment varijable

| Varijabla | Opis | Default |
|-----------|------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret za JWT tokene | - |
| `JWT_EXPIRES_IN` | Vreme isteka JWT tokena | 7d |
| `PORT` | Port na kojem sluša server | 3000 |
| `FRONTEND_URL` | URL frontend aplikacije (za CORS) | http://localhost:5173 |
| `SMTP_HOST` | SMTP server za email | - |
| `SMTP_PORT` | SMTP port | 587 |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |

## 📄 Licenca

MIT
