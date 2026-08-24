# 🚀 MSC Event Registration & Entrance Attendance System

An enterprise-grade, high-concurrency event registration, FIFO queue management, and QR code ticket scanning system built for the **Microsoft Student Chapter (MSC) at Marwadi University**.

![MSC Tech Symposium 2026](https://img.shields.io/badge/MSC-Event%20System-0078D4?style=for-the-badge&logo=microsoft&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

---

## ✨ Features

- 🎟️ **Instant Seat Allocation & Real-Time Capacity Counter**: Automatic real-time seat availability updates backed by PostgreSQL transactions.
- ⏳ **Automated FIFO Waiting Queue**: When total seat capacity is reached, registrations automatically enter a FIFO queue with position tracking (`#1`, `#2`, ...).
- 📧 **Automated Gmail RSVP & Schema.org Calendar Action Cards**: Sends confirmation emails containing native Google Calendar RSVP cards, inline MIME QR Code attachments (`cid:ticketqrcode`), and instant 1-click RSVP action links.
- ⏱️ **Auto-Expiring Seat Allocations**: Scheduled minute-by-minute worker automatically releases unconfirmed seats and promotes queued students FIFO.
- 📱 **Camera QR Entrance Scanner**: Integrated webcam/mobile camera QR scanner with instant check-in, manual Unique ID lookup (`MSC26-XXXX`), and duplicate scan prevention.
- 🎛️ **Full Admin Control Panel**: Complete CRUD operations (Add, Edit, View, Cancel, Permanent Hard Delete, Resend Email) with full audit logging.
- 📊 **CSV Data Export**: 1-click export of registration records to CSV.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Vite, Lucide Icons, html5-qrcode, Axios
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Nodemailer, QRCode
- **Database**: PostgreSQL (`msc_26-08-2026_event_db`)
- **Authentication**: JWT & HTTP-Only Cookie Authentication

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/MSC-Marwadi/MSC_Offline_Registration.git
cd MSC_Offline_Registration
```

### 2. Environment Setup
Create a `.env` file inside the `server/` directory based on `.env.example`:
```bash
cp server/.env.example server/.env
```
Update your database credentials and Gmail SMTP credentials in `server/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/msc_26-08-2026_event_db?schema=public"
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### 3. Install Dependencies
```bash
# Install root, client, and server dependencies
npm run install:all
```

### 4. Database Setup & Seed
```bash
cd server
npx prisma db push
npm run seed
cd ..
```

### 5. Run Development Server
```bash
npm run dev
```
- **Public Event Portal**: [http://localhost:5173](http://localhost:5173)
- **Admin Control Panel**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
  - **Email**: `admin@msc.edu`
  - **Password**: `Admin@MSC2026`

---

## 🔒 Security Notes
Environment files (`.env`) containing sensitive credentials, database passwords, and SMTP keys are strictly ignored by Git `.gitignore`. Never commit `.env` files to public repositories.

---

## 📄 License
Licensed under the MIT License. Developed for **Microsoft Student Chapter - Marwadi University**.
