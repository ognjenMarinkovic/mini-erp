# 📧 Email Notifikacije - Setup Guide

## ✅ Šta je implementirano:

1. **EmailService** - Kompletan servis za slanje email-ova
2. **NodeMailer** integracija
3. **2 tipa email-ova:**
   - ⚠️ Prekoračene fakture (overdue notifications)
   - ✅ Potvrda uplate (payment confirmations)
4. **Profesionalni HTML template-i**
5. **Automatski cron job** (svaki dan u 9:00)
6. **Test endpoint** za proveru konfiguracije

---

## 🚀 Kako aktivirati email-ove:

### **Korak 1: Instalacija NodeMailer**

```bash
# U terminalu:
cd "/Users/og/Desktop/Mini erp/backend"
npm install nodemailer @types/nodemailer
```

### **Korak 2: Gmail App Password (PREPORUČENO)**

1. **Idi na**: https://myaccount.google.com/apppasswords
2. **Uloguj se** sa Gmail nalogom
3. **Kreiraj App Password**:
   - App: "Mail"
   - Device: "Mini ERP"
4. **Kopiraj** 16-character password (npr: `xxxx xxxx xxxx xxxx`)

### **Korak 3: Ažuriraj `.env` fajl**

```bash
# backend/.env

# Dodaj na kraj fajla:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tvoj-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx    # App password sa koraka 2
```

**VAŽNO:** Koristi **App Password**, NE tvoju regularnu lozinku!

---

## 🧪 Testiranje:

### **1. Restart backend-a**

Nakon što instaliraš NodeMailer i dodaš SMTP podatke:

```bash
# Backend će automatski reload-ovati (ako je start:dev aktivan)
# Ili restartuj manuelno
npm run start:dev
```

### **2. Test Email**

```bash
# Šalje test email na tvoju adresu
curl -X POST "http://localhost:3000/api/notifications/test-email?email=tvoj-email@gmail.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Očekivani response:**
```json
{
  "success": true,
  "message": "Test email poslat na tvoj-email@gmail.com"
}
```

### **3. Provera prekoračenih faktura**

```bash
curl -X POST http://localhost:3000/api/notifications/check-overdue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "overdueCount": 2,
  "emailNotifications": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

---

## 📊 Kako sistem radi:

```
┌─────────────────────────────────────────┐
│  Cron Job - svaki dan u 9:00 ujutru   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Pronalazi fakture sa dueDate < today  │
│  i status = PENDING/PARTIAL            │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Ažurira status na OVERDUE             │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Šalje EMAIL svakom klijentu           │
│  (ako ima email adresu)                │
└─────────────────────────────────────────┘
```

---

## 📧 Email template-i:

### **1. Prekoračena faktura**

```
⚠️ PODSETNIK O PREKORAČENOJ FAKTURI

Poštovani [Ime klijenta],

Obaveštavamo Vas da je faktura prekoračila rok plaćanja.

┌──────────────────────────┐
│  Prekoračenje: X dana    │
└──────────────────────────┘

Detalji fakture:
• Broj fakture: INV-2026-001
• Datum izdavanja: 15.01.2026
• Rok plaćanja: 30.01.2026
• Iznos: 150,000.00 RSD

Molimo Vas da izvršite uplatu u najkraćem roku.
```

### **2. Potvrda uplate**

```
✅ POTVRDA UPLATE

Poštovani [Ime klijenta],

Zahvaljujemo se na izvršenoj uplati!

Detalji uplate:
• Faktura: INV-2026-001
• Iznos uplate: 150,000.00 RSD
• Datum uplate: 15.01.2026
• Status: Plaćeno u potpunosti

Hvala na poverenju!
```

---

## 🔧 Alternativni SMTP provajderi:

### **Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### **Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### **SendGrid (za production):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

---

## ⚠️ Troubleshooting:

### **Email se ne šalje:**

1. **Proveri backend logove:**
   ```bash
   tail -f /path/to/backend/logs
   ```

2. **Proveri SMTP kredencijale:**
   - Gmail: Koristiš li App Password?
   - 2FA: Da li je omogućen?
   - Less Secure Apps: Isključi (koristi App Password)

3. **Test transporter:**
   ```bash
   # Pozovi test endpoint
   POST /api/notifications/test-email?email=test@example.com
   ```

### **"Authentication failed" greška:**

- **Gmail**: Omogući "Less secure app access" ili koristi App Password
- **Outlook**: Proveri da li je 2FA omogućen
- **Firewall**: Proveri da port 587 nije blokiran

### **"Connection timeout":**

- Proveri internet konekciju
- Pokušaj port 465 umesto 587
- Proveri firewall postavke

---

## 📝 API Endpoints:

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/notifications/check-overdue` | POST | Manuelna provera + slanje email-ova |
| `/api/notifications/test-email?email=xxx` | POST | Test email konfiguracije |

---

## 🎯 Feature-i:

✅ HTML email template-i (responsive)  
✅ Srpska lokalizacija  
✅ Automatski cron job (9:00)  
✅ Potvrda uplate (payment confirmation)  
✅ Error handling i retry logika  
✅ Logovanje svih email-ova  
✅ Test endpoint za debugging  

---

## 🚀 Production Tips:

1. **Koristi SendGrid/Mailgun** (umesto Gmail) za veću pouzdanost
2. **Email queue** (Bull/Redis) za async slanje
3. **Rate limiting** - ne šalji previše email-ova odjednom
4. **Unsubscribe link** - dodaj opciju za opt-out
5. **Email tracking** - prati deliverability i open rates

---

## 📊 Statistika:

Nakon što instaliraš i konfiguriše, možeš videti:

```bash
# Backend logovi
[NotificationsService] Found 3 overdue invoices
[NotificationsService] Updated 3 invoices to OVERDUE status
[NotificationsService] Sending 3 overdue notifications...
[EmailService] Email sent to klijent@example.com for invoice INV-001
[EmailService] Email sent to firma@example.com for invoice INV-002
[EmailService] Email sent to partner@example.com for invoice INV-003
[NotificationsService] Email notifications sent: 3 successful, 0 failed
```

---

**Spreman za slanje email-ova! 📧🚀**
