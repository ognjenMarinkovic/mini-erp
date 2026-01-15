# Mini ERP MVP 🚀

**Kompletna web aplikacija za evidenciju poslovanja malih preduzetnika**

Modern, full-stack ERP sistem sa React frontendom i NestJS backendom.

---

## ✨ Features

### 📊 Core Business
- ✅ **Multi-tenancy** - Izolacija podataka po kompanijama
- ✅ **Klijenti** - CRUD operacije, pretraga, paginacija
- ✅ **Fakture** - Kreiranje sa dinamičkim stavkama, automatski broj
- ✅ **Uplate** - Evidencija uplata, auto ažuriranje statusa faktura
- ✅ **Troškovi** - Kategorije, filteri, pretraga
- ✅ **Dashboard** - Real-time statistika i grafici
- ✅ **PDF Generator** - Profesionalni PDF sa srpskim templateom

### 🔐 Security & Auth
- ✅ JWT autentifikacija
- ✅ Role-based access control (ADMIN, USER, ACCOUNTANT)
- ✅ Password hashing (bcrypt)
- ✅ Company-level data isolation

### 📈 Reports & Analytics
- ✅ Revenue vs Expense grafici (Recharts)
- ✅ Prekoračene fakture
- ✅ Top klijenti po prihodu
- ✅ Mesečni profit/loss

### 🌐 Dodatno
- ✅ **i18n** - Višejezična podrška (Srpski/English)
- ✅ **Notifications** - Cron job za prekoračene fakture
- ✅ **Testing** - Unit i E2E testovi
- ✅ **Docker** - Production-ready deployment

---

## 🛠 Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type safety
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **Swagger/OpenAPI** - API documentation
- **pdfmake** - PDF generation
- **@nestjs/schedule** - Cron jobs

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (ultra fast)
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Radix UI** - Headless components
- **Recharts** - Data visualization
- **i18next** - Internationalization
- **Axios** - HTTP client

### DevOps
- **Docker & Docker Compose** - Containerization
- **Jest & Vitest** - Testing
- **ESLint & Prettier** - Code quality

---

## 🚀 Quick Start

### Development (Lokalno)

```bash
# 1. Kloniraj repo
git clone <repo-url>
cd "Mini erp"

# 2. Start PostgreSQL
docker-compose up -d postgres

# 3. Backend setup
cd backend
npm install
cp .env.example .env
# Ažuriraj .env sa DATABASE_URL
npx prisma migrate dev
npm run start:dev
# Backend: http://localhost:3000

# 4. Frontend setup (u novom terminalu)
cd ../frontend
npm install
cp .env.example .env
npm run dev
# Frontend: http://localhost:5173
```

### Production (Docker Compose)

```bash
# Kompletna aplikacija sa jednom komandom
docker-compose --profile production up -d --build

# Pristupi:
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000/api
# Swagger docs: http://localhost:3000/api/docs
```

---

## 📚 Documentation

- 📖 [Setup Instructions](./SETUP_INSTRUCTIONS.md) - Detaljno uputstvo za setup
- 🚀 [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- 🔧 [Backend README](./backend/README.md) - Backend dokumentacija
- 💻 [Frontend README](./frontend/README.md) - Frontend dokumentacija
- 📊 [API Docs](http://localhost:3000/api/docs) - Swagger (kada backend radi)

---

## 📁 Struktura projekta

```
Mini erp/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── auth/        # JWT autentifikacija
│   │   ├── clients/     # Clients modul
│   │   ├── invoices/    # Invoices modul
│   │   ├── payments/    # Payments modul
│   │   ├── expenses/    # Expenses modul
│   │   ├── reports/     # Dashboard & reports
│   │   ├── pdf/         # PDF generator
│   │   └── notifications/ # Email & cron jobs
│   └── prisma/          # Database schema
├── frontend/            # React frontend
│   ├── src/
│   │   ├── features/    # Feature modules
│   │   ├── components/  # Reusable components
│   │   ├── stores/      # Zustand stores
│   │   └── locales/     # i18n translations
├── docker-compose.yml   # Docker setup
└── DEPLOYMENT.md        # Deploy guide
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage

# Frontend tests
cd frontend
npm run test          # Vitest
```

---

## 🔒 Security Checklist

- [x] JWT secret key u .env
- [x] Password hashing (bcrypt)
- [x] SQL injection zaštita (Prisma)
- [x] CORS konfiguracija
- [x] Input validacija (class-validator)
- [x] Role-based access control
- [ ] Rate limiting (TODO za production)
- [ ] HTTPS/SSL (TODO za production)

---

## 📊 Database Schema

```prisma
User ←→ Company ←→ [Client, Invoice, Expense]
Invoice ←→ [InvoiceItem, Payment]
```

**Glavni entiteti:**
- User (korisnici)
- Company (kompanije)
- Client (klijenti)
- Invoice (fakture) + InvoiceItem (stavke)
- Payment (uplate)
- Expense (troškovi)

---

## 🎯 Roadmap & Status

### ✅ Completed (v1.0 - MVP)
- [x] Auth sistem (JWT, registracija, login)
- [x] Clients CRUD
- [x] Invoices + Items (kreiranje, izmena, brisanje)
- [x] Payments tracking (evidencija uplata)
- [x] Expenses management (troškovi sa kategorijama)
- [x] Dashboard & reports (grafici, statistika)
- [x] PDF generation (download faktura)
- [x] Notifications (cron jobs za prekoračene fakture)
- [x] i18n (srpski/engleski jezik)
- [x] Docker deployment setup
- [x] Testing setup (unit & e2e)

### 🔜 Future (v2.0)
- [ ] Email sending (NodeMailer integracija)
- [ ] Advanced analytics dashboard
- [ ] Recurring invoices (mesečne fakture)
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Excel/CSV export
- [ ] e-Faktura integracija (NBS)
- [ ] QR code za plaćanje (IPS)

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repo
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 📞 Support

- 📚 [Documentation](./SETUP_INSTRUCTIONS.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

---

**Built with ❤️ using modern web technologies**

**Made in Serbia 🇷🇸**
