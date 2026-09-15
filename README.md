# GovAI - Multilingual Government Scheme Assistant

GovAI is a multilingual government-scheme discovery platform built with **React**, **Vite**, and a **Java backend API** backed by a **MySQL Database**.

---

## Project Structure

```text
├── src/                  # React frontend source code
├── public/               # Static frontend assets
├── backend/              # Java Backend API
│   ├── src/              # Java source code (CapstoneServer.java, Database.java)
│   ├── lib/              # MySQL JDBC Connector jar
│   └── schema.sql        # MySQL database & table schema
├── package.json          # Node dependencies & Vite scripts
└── vite.config.js        # Vite build & proxy configuration
```

---

## Prerequisites

- **Node.js** (v18+) & **npm**
- **Java JDK** (17+)
- **MySQL Server** (5.5+ or 8.x)

---

## Database Setup (MySQL)

1. Start your MySQL server on `localhost:3306`.
2. The Java backend will **automatically create** the database `govai_db` and tables (`users`, `login_logs`) on startup.
3. If you want to import or inspect manually:
   ```bash
   mysql -u root -p < backend/schema.sql
   ```

### Environment Variables (Optional):
- `DB_HOST`: default `localhost`
- `DB_PORT`: default `3306`
- `DB_NAME`: default `govai_db`
- `DB_USER`: default `root`
- `DB_PASSWORD`: default `MySQL` (or configured password)
- `PORT`: default `8080`

---

## Running Locally

### 1. Start the Java Backend Server
```powershell
# Compile
javac -encoding UTF-8 -cp "backend/lib/*" -d "backend/bin" backend/src/module-info.java backend/src/govai/*.java

# Run
java -cp "backend/bin;backend/lib/*" govai.CapstoneServer
```
Backend runs at `http://localhost:8080`.

### 2. Start the Frontend Dev Server
```powershell
npm install
npm run dev
```
Open the Vite URL (e.g. `http://localhost:5173`) in your browser.

---

## Website Deployment

1. **Frontend**: Deploy to Vercel, Netlify, or GitHub Pages.
   Set environment variable:
   ```text
   VITE_API_URL=https://your-backend-domain.example.com/api
   ```
2. **Backend**: Deploy Java server and MySQL database to Render, Railway, AWS, or Docker.
