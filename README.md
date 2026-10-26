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

### Deploy to Render

1. Push the project to GitHub and create a new Blueprint from the repository in the [Render Dashboard](https://dashboard.render.com).
2. Render reads `render.yaml` to create the static frontend and Java API. The frontend is configured to use the API service URL automatically.
3. Enter your hosted MySQL connection values when Render prompts for `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. Keep these values in Render's environment settings; do not commit them.
4. After both services finish deploying, open the frontend's `onrender.com` URL. The API health endpoint is available at `/api/health` on the backend URL.

Render does not provide a managed MySQL database, so provide an existing hosted MySQL instance. For other hosts, set `VITE_API_URL` to the backend base URL ending in `/api`.
