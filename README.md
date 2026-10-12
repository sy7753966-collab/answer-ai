# AI Answer Grader 🎓

An explainable, rubric-based student answer evaluation platform equipped with bias and fairness analytics, teacher scoring studio, and comprehensive assessment reports.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vercel](https://img.shields.io/badge/deploy-Vercel-black.svg)
![React](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-61dafb.svg)
![Node](https://img.shields.io/badge/backend-Express%205-green.svg)

---

## ✨ Features

- **Rule-Engine & Explainable Grading**: Transparent, criteria-based evaluation of free-text student responses against structured marking schemes and concept maps.
- **Fairness & Bias Lab**: Benchmark analytics detecting length bias, keyword bias, short-answer penalties, and correlation with teacher marking.
- **Teacher Rubric Studio**: Interactive rubric designer for configuring point criteria, keywords, alternative phrasing, and concept groups.
- **Question Bank**: Manage question prompts, difficulty levels, target subjects, and time limits.
- **Dual Storage Support**:
  - **Zero-Config Demo Mode**: Works immediately in-memory out of the box on Vercel without provisioning a database.
  - **PostgreSQL Mode**: Seamlessly switches to Postgres (Neon, Supabase, Vercel Postgres) whenever `DATABASE_URL` is configured.

---

## 🚀 One-Click Deployment to Vercel

### Step 1: Import Repository
1. Navigate to [Vercel](https://vercel.com).
2. Click **Add New...** ➜ **Project**.
3. Import this GitHub repository (`answer-ai`).

### Step 2: Deployment Configuration
Vercel automatically detects Vite:
- **Framework Preset**: Vite
- **Root Directory**: `./` (leave default)
- **Build Command**: `vite build`
- **Output Directory**: `dist`

### Step 3: Environment Variables (Optional)
The application works immediately in zero-config mode. To persist data to PostgreSQL:
- `DATABASE_URL`: Your PostgreSQL connection string (e.g. from Neon, Supabase, or Vercel Postgres).

Click **Deploy**! 🎉

---

## 🛠️ Project Structure

```
├── api/                    # Vercel Serverless Function entrypoint (/api/*)
├── server/                 # Express backend with rubric grading rule engine
├── src/                    # React 19 + Tailwind CSS frontend application
├── public/                 # Static assets (favicons, etc.)
├── lib/                    # Shared API client and database contracts
├── vite.config.ts          # Vite build configuration
└── vercel.json             # Vercel SPA and API routing configuration
```

---

## 📄 License

MIT
