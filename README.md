<div align="center">
  <h1>🌤️ InRisk Climate Explorer</h1>
  <p><i>A Production-Ready Full-Stack Climate Data Investigation Platform</i></p>

---

## ****📖 Project Context & Architecture Decisions****

****This project is a minimal viable product (MVP) developed for the **InRisk Labs Full Stack Engineer Case Study**. It is designed to ingest, store, and visualize historical climate data using high-resolution weather APIs and scalable cloud object storage.****

### ****🏗️ Design Decisions & Alternatives Used****

****To strictly adhere to the "zero-cost / free-tier" requirement without compromising on production-grade architecture, the following strategic decisions were made:****

1. ******Backend Deployment (Render + Docker vs GCP Cloud Run):**- *Why:* My GCP and AWS free tiers are currently exhausted/unavailable. To perfectly simulate the behavior of **GCP Cloud Run**, I containerized the FastAPI application using Docker and deployed it to **Render**.
   - *The Sleep-State Hack:* Render's free tier aggressively spins down containers after 15 minutes of inactivity (causing 2-minute cold starts). To ensure a flawless experience for the reviewer, I implemented an **UptimeRobot** ping hitting the API health check every **5 minutes**. This guarantees the Docker container remains awake 24/7 with zero cold starts, perfectly mimicking a persistent GCP Cloud Run instance.

   ****
2. ******Cloud Storage (Supabase S3 vs AWS S3):**- *Why:* Instead of risking native AWS billing, I utilized **Supabase's S3-compatible object storage**. The backend still uses the exact same AWS `boto3` SDK, ensuring the codebase is instantly transferrable to native AWS S3 simply by changing the environment keys.

   ****
3. ******Frontend Deployment (Vercel):**- *Why:* Deployed as a serverless static site on Vercel's global CDN for lightning-fast Edge delivery. A Reverse Proxy (`VITE_API_URL`) handles CORS and routes traffic seamlessly to the Render backend.

   ****

---

## ****✨ Core Features & Functionality****

### ****1. Robust Backend Engineering (FastAPI)****

- ******Dynamic API Routing:** Intelligently routes between Open-Meteo's Forecast API (for recent data) and the Archive API (for data > 92 days) to prevent 400 Bad Requests.****
- ******Strict Validation:** Uses Pydantic to mathematically enforce coordinate boundaries (`lat ∈ [-90, 90]`, `lon ∈ [-180, 180]`) and enforces the $\le$ 31-day fetch limits.****
- ******Data Lifecycle Management:** Automatically sweeps and deletes cached S3 files older than 30 days to optimize storage costs, fulfilling the cloud lifecycle requirement.****

### ****2. Professional Dashboard UI (React + Vite + Tailwind)****

- ******Glassmorphism Aesthetic:** A sleek, fully responsive dashboard built with modern aesthetic tokens.****
- ******Interactive Mapping:** Features a collapsible Leaflet map with reverse geocoding to visually search and select target coordinates.****
- ******Advanced Visualization:** Utilizes Recharts for dynamic, multi-axis charting (max/min temperatures overlaid with precipitation bars).****
- ******Paginated Data Table:** A comprehensive data table strictly exposing daily variables with **10/20/50 rows-per-page** pagination.****
- ******Client-Side Export:** One-click instant `.csv` downloads generated entirely within the browser.****

---

## ****🛠️ Tech Stack****

- ******Frontend:** React (Vite), Tailwind CSS, Recharts, Leaflet, Lucide-React****
- ******Backend:** Python 3.10+, FastAPI, Uvicorn, Boto3 (AWS SDK), HTTPX****
- ******Infrastructure:** S3 Object Storage (Supabase Free Tier)****
- ******DevOps:** Docker, Docker Compose, Render (Backend), Vercel (Frontend), UptimeRobot (Keep-Alive)****

---

## ****📦 Local Setup Instructions****

****If you wish to pull this repository and run it locally, follow these steps:****

### ****1. Environment Variables****

****Create a `.env` file in the `backend/` directory with your S3 credentials (if testing your own bucket), or request my testing keys:****

### ****Option A: Docker Compose (Recommended)****

****The easiest way to run the entire stack locally is using Docker Compose. Ensure the Docker daemon is running on your machine.****

- ******Frontend:** `http://localhost:5173`****
- ******Backend API:** `http://localhost:8000`****

### ****Option B: Manual Setup****

******Backend Initialization:******

******Frontend Initialization:******

---

## ****🔮 Future Roadmap & ML Expansion (Project Scope)****

****While this MVP successfully demonstrates a complete end-to-end data ingestion and visualization pipeline, it serves as the foundational stepping stone for a true **InRisk Labs Climate Platform**.****

****If deployed in an enterprise environment, I would expand this architecture to include:****

1. ******Machine Learning Integrations:** Pipe the stored historical S3 data into managed ML services (like AWS SageMaker or GCP Vertex AI) to train predictive models for localized flood risks, crop yield damages, or temperature anomalies.****
2. ******Automated Batch Ingestion:** Implement Airflow or Celery workers to asynchronously fetch and aggregate planetary weather data across thousands of coordinates nightly, eliminating user-triggered fetch delays.****
3. ******Advanced Geospatial Analytics:** Transition from simple Leaflet maps to heavily optimized vector tile servers (Mapbox GL JS/PostGIS) to visualize massive climate risk heatmaps layered over property insurance zones.****
4. ******Authentication & Multi-Tenancy:** Secure the API with JWT (OAuth2) allowing enterprise clients to have isolated, encrypted S3 buckets for their specific risk-analysis queries.****
