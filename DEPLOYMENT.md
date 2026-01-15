# Mini ERP - Deployment Guide

## 🚀 Production Deployment

### Opcija 1: Docker Compose (Preporučeno)

**Kompletna aplikacija sa jednom komandom:**

```bash
# 1. Kloniraj repo
git clone <repo-url>
cd Mini\ erp

# 2. Kreiraj .env fajlove
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Ažuriraj production vrednosti u .env fajlovima
# backend/.env
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/mini_erp
JWT_SECRET=<your-super-secret-key>

# frontend/.env
VITE_API_URL=http://localhost:3000/api

# 4. Build i pokreni sve servise
docker-compose up -d --build

# 5. Proveri status
docker-compose ps

# 6. Pristupi aplikaciji
# Frontend: http://localhost
# Backend API: http://localhost:3000/api
# Swagger docs: http://localhost:3000/api/docs
```

**Komande za upravljanje:**

```bash
# Zaustavi sve servise
docker-compose down

# Vidi logove
docker-compose logs -f

# Restart servisa
docker-compose restart backend
docker-compose restart frontend

# Ukloni sve (uključujući volume)
docker-compose down -v
```

---

### Opcija 2: Separate Deploy

#### Backend (Railway / Render)

1. **Kreiraj PostgreSQL bazu:**
   - Railway: Add PostgreSQL service
   - Render: Create PostgreSQL instance
   - Dobij `DATABASE_URL`

2. **Deploy backend:**

```bash
cd backend

# Build
npm run build

# Migracije
npx prisma migrate deploy

# Start
npm run start:prod
```

**Environment Variables:**
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=super-secret-key
NODE_ENV=production
PORT=3000
```

#### Frontend (Vercel / Netlify)

1. **Build lokalno ili na platformi:**

```bash
cd frontend

# Build
npm run build

# Preview
npm run preview
```

2. **Deploy:**
   - Vercel: `vercel --prod`
   - Netlify: Drag & drop `dist` folder

**Environment Variables:**
```
VITE_API_URL=https://your-backend-url.com/api
```

---

### Opcija 3: VPS (DigitalOcean / Linode)

**Server setup:**

```bash
# 1. SSH u server
ssh root@your-server-ip

# 2. Instaliraj Docker i Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose

# 3. Kloniraj projekat
git clone <repo-url>
cd mini-erp

# 4. Setup .env fajlova (kao gore)

# 5. Pokreni sa Docker Compose
docker-compose up -d --build

# 6. Setup Nginx reverse proxy (opciono)
apt install nginx certbot python3-certbot-nginx

# 7. Nginx config za domain
nano /etc/nginx/sites-available/mini-erp

# Dodaj:
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 8. Aktiviraj i restart
ln -s /etc/nginx/sites-available/mini-erp /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 9. SSL sertifikat
certbot --nginx -d yourdomain.com
```

---

## 🔧 Production Checklist

### Backend:
- [ ] Ažuriraj `JWT_SECRET` na jaku vrednost
- [ ] Postavi `NODE_ENV=production`
- [ ] Omogući CORS za frontend domain
- [ ] Setup backupa baze
- [ ] Konfiguriši rate limiting
- [ ] Setup logging (Winston/Pino)
- [ ] Konfiguriši monitoring (PM2/New Relic)

### Frontend:
- [ ] Ažuriraj `VITE_API_URL` na production backend
- [ ] Optimizuj build (code splitting)
- [ ] Setup CDN za static assets
- [ ] Konfiguriši analytics (Google Analytics)
- [ ] Test na različitim browserima

### Database:
- [ ] Automatski backupi (daily)
- [ ] Connection pooling
- [ ] Setup monitoring
- [ ] Index optimizacija

### Security:
- [ ] HTTPS (Let's Encrypt)
- [ ] Environment variables enkriptovane
- [ ] Database credentials sigurni
- [ ] Rate limiting na API
- [ ] CORS pravilno konfigurisan

---

## 📊 Monitoring

**Backend health check:**
```bash
curl http://localhost:3000/api
# Očekivano: {"status":"ok","message":"Mini ERP API is running"}
```

**Database check:**
```bash
docker exec -it mini-erp-db psql -U postgres -d mini_erp -c "SELECT COUNT(*) FROM \"User\";"
```

**Logs:**
```bash
# Backend logs
docker logs -f mini-erp-backend

# Frontend logs
docker logs -f mini-erp-frontend

# Database logs
docker logs -f mini-erp-db
```

---

## 🔄 Updates & Maintenance

**Ažuriranje aplikacije:**

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild i restart
docker-compose up -d --build

# 3. Run migrations (ako ih ima)
docker exec -it mini-erp-backend npx prisma migrate deploy
```

**Backup baze:**

```bash
# Backup
docker exec mini-erp-db pg_dump -U postgres mini_erp > backup-$(date +%Y%m%d).sql

# Restore
docker exec -i mini-erp-db psql -U postgres mini_erp < backup-20260115.sql
```

---

## 🆘 Troubleshooting

**Backend ne startuje:**
```bash
# Proveri logove
docker logs mini-erp-backend

# Proveri database connection
docker exec -it mini-erp-backend npm run prisma:studio
```

**Frontend pokazuje grešku 502:**
- Proveri da li backend radi: `curl http://localhost:3000/api`
- Proveri VITE_API_URL u frontend .env

**Database connection greška:**
- Proveri DATABASE_URL format
- Proveri da li PostgreSQL radi: `docker ps`
- Proveri credentials

---

## 📞 Support

Za dodatnu pomoć:
- Backend API docs: `http://localhost:3000/api/docs`
- GitHub Issues: <repo-url>/issues
