# Setup Instrukcije - Mini ERP

Ovaj dokument sadrži **detaljne korake** za inicijalno pokretanje Mini ERP sistema.

## 📋 Preduslovi

Pre nego što počnete, uverite se da imate instalirano:

1. **Node.js** (verzija 18 ili novija)
   - Proverite: `node --version`
   - Download: https://nodejs.org/

2. **npm** (dolazi sa Node.js)
   - Proverite: `npm --version`

3. **PostgreSQL** (verzija 14 ili novija) ILI **Docker**
   - Za Docker: https://www.docker.com/get-started
   - Za PostgreSQL: https://www.postgresql.org/download/

4. **Git** (opciono, za verzionisanje)
   - Proverite: `git --version`

---

## 🚀 Korak po korak setup

### KORAK 1: Instalacija dependencies

#### Backend

```bash
# Navigirajte u backend folder
cd backend

# Instalirajte sve pakete
npm install
```

Ova komanda će instalirati sve potrebne pakete: NestJS, Prisma, JWT, bcrypt, i sve ostale dependencije.

#### Frontend

```bash
# Navigirajte u frontend folder (iz root-a)
cd ../frontend

# Instalirajte sve pakete
npm install
```

Ova komanda će instalirati React, Vite, TanStack Query, Zustand, Tailwind CSS i ostale frontend pakete.

---

### KORAK 2: PostgreSQL Database Setup

**OPCIJA A: Korišćenje Docker-a (preporučeno za developera)**

```bash
# U root folderu projekta
docker-compose up -d
```

Ova komanda pokreće PostgreSQL u Docker kontejneru sa:
- Database: `mini_erp`
- User: `mini_erp`
- Password: `mini_erp_password`
- Port: `5432`

Provera da li je kontejner pokrenut:
```bash
docker ps
```

**OPCIJA B: Lokalna PostgreSQL instalacija**

Ako imate PostgreSQL već instaliran, kreirajte bazu podataka:

```bash
# Ulogujte se u PostgreSQL
psql -U postgres

# Kreirajte bazu podataka
CREATE DATABASE mini_erp;

# Kreirajte korisnika (opciono)
CREATE USER mini_erp WITH PASSWORD 'mini_erp_password';
GRANT ALL PRIVILEGES ON DATABASE mini_erp TO mini_erp;

# Izlaz
\q
```

---

### KORAK 3: Backend konfiguracija

```bash
cd backend

# Kopirajte env.example fajl
cp env.example .env
```

**Uredite `.env` fajl** (otvorite u text editoru):

```env
# Database URL - ako koristite Docker, ovo je default:
DATABASE_URL="postgresql://mini_erp:mini_erp_password@localhost:5432/mini_erp?schema=public"

# JWT Secret - OBAVEZNO PROMENITE U PRODUKCIJI!
JWT_SECRET="your-super-secret-jwt-key-change-in-production-123456"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production-789"
JWT_REFRESH_EXPIRES_IN="30d"

# Port
PORT=3000
NODE_ENV=development

# Email konfiguracija (opciono za MVP, kasnije)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
SMTP_FROM="Mini ERP <noreply@minierp.com>"

# Frontend URL (za CORS)
FRONTEND_URL="http://localhost:5173"
```

**Pokrenite Prisma migracije:**

```bash
# Generišite Prisma klijent
npm run prisma:generate

# Pokrenite migracije (kreira tabele u bazi)
npm run prisma:migrate

# (Opciono) Otvorite Prisma Studio za pregled baze
npm run prisma:studio
```

Prisma Studio će biti dostupan na `http://localhost:5555`

---

### KORAK 4: Frontend konfiguracija

```bash
cd ../frontend

# Kopirajte env.example fajl
cp env.example .env
```

**Uredite `.env` fajl:**

```env
VITE_API_URL=http://localhost:3000/api
```

---

### KORAK 5: Pokretanje aplikacije

Otvorite **2 terminala**:

**Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev
```

Trebalo bi da vidite:
```
🚀 Server je pokrenut na: http://localhost:3000
📚 Swagger dokumentacija: http://localhost:3000/api/docs
✅ Prisma povezan sa bazom podataka
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Trebalo bi da vidite:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## ✅ Verifikacija

### 1. Proverite Backend

Otvorite browser i idite na:

- **Health check**: http://localhost:3000/api
  - Trebalo bi da vidite: `{"status":"ok","message":"Mini ERP API je aktivan",...}`

- **Swagger dokumentacija**: http://localhost:3000/api/docs
  - Ovde možete videti sve API endpoints

### 2. Proverite Frontend

Otvorite browser i idite na:

- **Frontend aplikacija**: http://localhost:5173
  - Trebalo bi da vidite login stranicu

### 3. Proverite Database

```bash
# Otvorite Prisma Studio
cd backend
npm run prisma:studio
```

Ili direktno u PostgreSQL:

```bash
# Ako koristite Docker
docker exec -it mini-erp-db psql -U mini_erp -d mini_erp

# Listu tabela
\dt

# Izlaz
\q
```

---

## 🐛 Troubleshooting

### Problem: "Port 5432 is already in use"

**Rešenje:** Već imate PostgreSQL pokrenut lokalno.

Opcije:
1. Zaustavite lokalni PostgreSQL i koristite Docker
2. Promenite port u `docker-compose.yml` (npr. `5433:5432`)
3. Koristite lokalni PostgreSQL umesto Docker-a

### Problem: "Cannot connect to database"

**Rešenje:**

1. Proverite da li je PostgreSQL pokrenut:
   ```bash
   docker ps  # za Docker
   # ili
   sudo service postgresql status  # za lokalni PostgreSQL
   ```

2. Proverite `DATABASE_URL` u `.env` fajlu
3. Proverite da li ste pokrenuli `npm run prisma:migrate`

### Problem: "Module not found" greška

**Rešenje:**

```bash
# Obrišite node_modules i reinstalirajte
rm -rf node_modules package-lock.json
npm install
```

### Problem: Frontend ne može da se poveže sa Backend-om

**Rešenje:**

1. Proverite da li je backend pokrenut na portu 3000
2. Proverite `VITE_API_URL` u `frontend/.env`
3. Proverite CORS konfiguraciju u `backend/src/main.ts`

### Problem: Prisma migracije ne rade

**Rešenje:**

```bash
# Reset baze (OPREZ: briše sve podatke!)
npm run prisma:migrate reset

# Ili ručno
npm run prisma:generate
npm run prisma:migrate dev --name init
```

---

## 📚 Korisni linkovi

- **Swagger API docs**: http://localhost:3000/api/docs
- **Prisma Studio**: http://localhost:5555 (pokreće se sa `npm run prisma:studio`)
- **Frontend dev**: http://localhost:5173
- **React Query DevTools**: Dostupne u donjem desnom uglu frontend aplikacije

---

## 🎯 Sledeći koraci

Sada kada je projekat pokrenut, možete:

1. **Testirati API** preko Swagger dokumentacije
2. **Kreirati prvi account** preko frontend-a
3. **Dodati test podatke** (klijente, fakture)
4. **Početi sa razvojem** prema planu

---

## 💡 Development Tips

### Hot Reload

- **Backend**: Automatski restartuje server kada sačuvate fajl
- **Frontend**: Automatski osvežava browser (Vite HMR)

### Debugging

**Backend:**
```bash
npm run start:debug
```
Zatim attach debugger u VS Code.

**Frontend:**
- Koristite React DevTools extension
- Koristite TanStack Query DevTools (već uključeno)

### Database Changes

Kada promenite `prisma/schema.prisma`:

```bash
npm run prisma:migrate dev --name <ime_migracije>
npm run prisma:generate
```

---

Sve je sada spremno za razvoj! 🚀
