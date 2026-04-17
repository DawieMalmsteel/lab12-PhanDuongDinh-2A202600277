# Delivery Checklist — Day 12 Lab Submission

> **Student Name:** Phan Dương Định
> **Student ID:** 2A202600277
> **Date:** 17/4/2026

---

## Submission Requirements

Submit a **GitHub repository** containing:

### 1. Mission Answers (40 points)

**Day 12 Lab - Mission Answers**

## Part 1: Localhost vs Production

### Exercise 1.1: Anti-patterns found

1. **Hardcoded API Key** - `OPENAI_API_KEY = "sk-hardcoded-fake-key-never-do-this"` (line 17)
2. **Hardcoded Database Password** - `DATABASE_URL = "postgresql://admin:password123@localhost:5432/mydb"` (line 18)
3. **Localhost Binding** - `host="localhost"` instead of `0.0.0.0` (line 51)
4. **Logging Secrets** - `print(f"[DEBUG] Using key: {OPENAI_API_KEY}")` exposes secrets (line 34)
5. **No Health Check** - Missing `/health` endpoint for platform monitoring
6. **No Graceful Shutdown** - No SIGTERM handling for clean container stops

### Exercise 1.3: Comparison table

| Feature | Develop | Production | Why Important? |
|---------|---------|------------|----------------|
| Config | Hardcoded in code | From env vars | Deploy anywhere, any environment |
| Secrets | In source code | In env vars | Security - secrets not in git |
| Port | 8000 fixed | From PORT env | Platform compatibility |
| Health check | None | /health + /ready | Platform monitoring & restart |
| Shutdown | Sudden stop | Graceful (SIGTERM) | Complete in-flight requests |
| Logging | print() statements | JSON structured | Log aggregation & parsing |
| Host binding | localhost | 0.0.0.0 | Container networking |
| Debug mode | Always on | From env | Security in production |

---

## Part 2: Docker

### Exercise 2.1: Dockerfile questions

1. **Base image:** `python:3.11` (develop) / `python:3.11-slim` (production)
2. **Working directory:** `/app`
3. **COPY requirements.txt first:** Docker caches layers - if requirements unchanged, pip install step is cached
4. **CMD vs ENTRYPOINT:**
   - CMD: Can be overridden at runtime with `docker run <args>`
   - ENTRYPOINT: Fixed, arguments appended

### Exercise 2.3: Image size comparison

- **Develop (single-stage):** ~800 MB
- **Production (multi-stage):** 244 MB
- **Difference:** 69.5% reduction

**Multi-stage benefits:**
- Stage 1 (builder): Has pip, gcc, build tools for compiling dependencies
- Stage 2 (runtime): Only Python runtime + installed packages
- Result: Smaller image, fewer attack surfaces

---

## Part 3: Cloud Deployment

### Exercise 3.1: Vercel Deployment (Primary - Preferred)

**Deployment URL:** https://lab12-phan-duong-dinh-2-a202600277.vercel.app/

**Image:**
![deploy success](./deploy.png)
![application image](./deploy2.png)

**Platform:** Vercel (Frontend - React + Vite)

**Project Structure:**
```
v2/
├── src/
│   ├── App.tsx           # Main React component
│   ├── lib/
│   │   ├── gemini.ts     # Gemini AI integration
│   │   └── weather.ts    # Weather data utilities
│   └── main.tsx          # Entry point
├── index.html
├── package.json          # Dependencies
├── vite.config.ts        # Vite configuration
└── .env.example          # Environment template
```

**Technology Stack:**
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Google Gemini AI API
- Motion (animations)

**Features:**
- Weather forecast chatbot
- Vietnamese language support
- Beautiful UI with weather icons
- Real-time weather data

**Test Commands:**
```bash
# Open in browser
open https://lab12-phan-duong-dinh-2-a202600277.vercel.app/

# Or use curl
curl -s https://lab12-phan-duong-dinh-2-a202600277.vercel.app/
# Returns: HTML page with React app
```

### Exercise 3.2: Railway Deployment (Alternative - Backend API)

**Platform:** Railway (PaaS - Backend API)

**Files configured:**
- ✅ railway.toml (exists)
- ✅ healthcheckPath = /health
- ✅ startCommand configured

**Local Backend (Docker Compose):**
```bash
# Chạy backend local
cd 06-lab-complete/v1
docker compose up -d

# Test backend
curl http://localhost:8000/health
# Result: {"status":"ok","version":"1.0.0","environment":"staging"...}

# Test với API key
curl -H "X-API-Key: dev-key-change-me-in-production" \
     -X POST http://localhost:8000/ask \
     -H "Content-Type: application/json" \
     -d '{"question": "What is Docker?"}'
```

**Railway Deploy Commands:**
```bash
npm i -g @railway/cli
railway login
railway init
railway variables set ENVIRONMENT=staging
railway variables set AGENT_API_KEY=your-secret-key
railway variables set REDIS_URL=redis://redis:6379/0
railway up
railway domain
```

### Exercise 3.3: Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│  https://lab12-phan-duong-dinh-2-a202600277.vercel.app │
│                                                          │
│  React App → Google Gemini AI API                       │
└─────────────────────────────────────────────────────────┘

In local:
┌─────────────────────────────────────────────────────────┐
│              Railway / Local (Backend API)               │
│                                                          │
│  FastAPI Agent                                           │
│  ├── /health (GET)                                      │
│  ├── /ask (POST) - X-API-Key required                  │
│  ├── /ready (GET)                                      │
│  └── /metrics (GET)                                     │
│                                                          │
│  Features:                                               │
│  ├── Rate limiting (20 req/min)                        │
│  ├── Cost guard ($5/day)                               │
│  ├── JWT/Auth support                                  │
│  └── Redis session storage                             │
└─────────────────────────────────────────────────────────┘
```

### Exercise 3.4: Render & Cloud Run (Additional Options)

**Render deployment:**
- ✅ render.yaml exists with services definition
- ✅ healthCheckPath: /health
- ✅ autoDeploy: true

**Cloud Run (CI/CD):**
- ✅ cloudbuild.yaml - CI/CD pipeline (test → build → push → deploy)
- ✅ service.yaml - Cloud Run service definition

---

## Part 4: API Security

### Exercise 4.1-4.3: Test results

**API Key Authentication:**
```bash
# Without key - returns 401
curl -X POST http://localhost:8000/ask -H "Content-Type: application/json" -d '{"question":"Hello"}'
# Result: {"detail":"Invalid or missing API key. Include header: X-API-Key: <your-key>"}

# With key - returns 200
curl -H "X-API-Key: dev-key-change-me-in-production" -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" -d '{"question":"What is Docker?"}'
# Result: {"question":"What is Docker?","answer":"Container là cách đóng gói app để chạy ở mọi nơi...","model":"gpt-4o-mini"}
```

**JWT Authentication:**
- ✅ Token endpoint: `/auth/token` (POST)
- ✅ Token validation: `verify_token` dependency
- ✅ Demo credentials: student/demo123, teacher/teach456

**Rate Limiting:**
- ✅ 429 response when limit exceeded
- ✅ Sliding window algorithm in rate_limiter.py
- ✅ Headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After

### Exercise 4.4: Cost guard implementation

**Approach:**
1. Track daily spending per user in memory (or Redis in production)
2. Calculate cost based on token usage: `(input_tokens/1000)*0.00015 + (output_tokens/1000)*0.0006`
3. Check budget before processing request
4. Return 503 when budget exhausted
5. Reset budget daily at midnight

**Implementation location:** `v1/app/main.py:75-88`

---

## Part 5: Scaling & Reliability

### Exercise 5.1-5.5: Implementation notes

**Health Check Implementation:**
- `/health` endpoint returns status, uptime, version, environment
- Checks memory usage with psutil
- Returns "ok" or "degraded" based on checks

**Readiness Check Implementation:**
- `/ready` endpoint returns 503 if `_is_ready` is False
- Used by load balancer to route traffic

**Graceful Shutdown Implementation:**
- SIGTERM signal handler in `v1/app/main.py:297-298`
- Tracks `in_flight_requests` during lifespan
- Waits for in-flight requests to complete before exiting
- uvicorn `timeout_graceful_shutdown=30`

**Stateless Design:**
- Session data stored in Redis: `session:{session_id}`
- TTL-based expiration (3600 seconds)
- Any instance can serve any request

**Load Balancing:**
- Nginx with round-robin distribution
- 3 agent replicas in docker-compose.yml
- Redis shared across instances for state

---

## Part 6: Full Source Code - Lab 06 Complete (60 points)

## Project Structure

```
06-lab-complete/
├── v1/                        # Backend (FastAPI) - Docker deployment
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py          # 55 lines - 12-factor config
│   │   └── main.py           # 313 lines - Full FastAPI implementation
│   ├── utils/
│   │   └── mock_llm.py       # Mock LLM
│   ├── Dockerfile             # 49 lines - Multi-stage, non-root
│   ├── docker-compose.yml     # 33 lines - agent + redis
│   ├── requirements.txt       # 7 packages
│   ├── .env                   # Local (gitignored)
│   ├── .env.example          # Template
│   ├── .dockerignore
│   ├── railway.toml           # Railway config
│   ├── render.yaml            # Render config
│   ├── check_production_ready.py # 142 lines - Verification script
│   └── README.md              # 100 lines
│
├── v2/                        # Frontend (React) - Vercel deployment
│   ├── src/
│   │   ├── App.tsx           # Weather chatbot UI (273 lines)
│   │   ├── main.tsx          # Entry point
│   │   ├── index.css         # Tailwind styles
│   │   └── lib/
│   │       ├── gemini.ts     # Gemini AI integration
│   │       └── weather.ts    # Weather utilities
│   ├── index.html
│   ├── package.json           # Dependencies
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .gitignore
│   ├── metadata.json
│   └── README.md
│
└── DAY12_DELIVERY_CHECKLIST.md  # This file
```

## v1/ Backend (FastAPI)

### File: v1/app/main.py (313 lines)

**Endpoints:**
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | No | Root info |
| `/health` | GET | No | Liveness probe |
| `/ready` | GET | No | Readiness probe |
| `/ask` | POST | Yes | AI agent endpoint |
| `/metrics` | GET | Yes | Usage metrics |
| `/docs` | GET | No | API docs (dev only) |

**Features implemented:**
- ✅ 12-factor config (app/config.py:55 lines)
- ✅ API Key authentication (X-API-Key header)
- ✅ Rate limiting (20 req/min sliding window)
- ✅ Cost guard ($5.0/day budget)
- ✅ Health check + Readiness probe
- ✅ Graceful shutdown (SIGTERM handler)
- ✅ Structured JSON logging (json.dumps)
- ✅ CORS middleware
- ✅ Security headers (X-Content-Type-Options, X-Frame-Options)
- ✅ Input validation (Pydantic)
- ✅ Mock LLM integration

### File: v1/app/config.py (55 lines)

**Environment Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| HOST | 0.0.0.0 | Server binding |
| PORT | 8000 | Server port |
| ENVIRONMENT | development | Environment mode |
| DEBUG | false | Debug mode |
| APP_NAME | Production AI Agent | App name |
| APP_VERSION | 1.0.0 | App version |
| OPENAI_API_KEY | "" | OpenAI API key |
| LLM_MODEL | gpt-4o-mini | LLM model |
| AGENT_API_KEY | dev-key-change-me | API key for auth |
| JWT_SECRET | dev-jwt-secret | JWT secret |
| ALLOWED_ORIGINS | * | CORS origins |
| RATE_LIMIT_PER_MINUTE | 20 | Rate limit |
| DAILY_BUDGET_USD | 5.0 | Daily budget |
| REDIS_URL | "" | Redis connection |

### File: v1/Dockerfile (49 lines)

**Multi-stage Build:**
```dockerfile
# Stage 1: Builder
FROM python:3.11-slim AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y gcc libpq-dev
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim AS runtime
RUN groupadd -r agent && useradd -r -g agent -d /app agent
COPY --from=builder /root/.local /home/agent/.local
COPY app/ ./app/
COPY utils/ ./utils/
USER agent
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### File: v1/docker-compose.yml (33 lines)

**Services:**
- `agent`: FastAPI application (port 8000)
- `redis`: Redis cache (port 6379)

**Features:**
- Health checks for both services
- Dependency: agent waits for redis to be healthy
- Restart policy: unless-stopped

### Dependencies (v1/requirements.txt)
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.9.0
pyjwt==2.9.0
python-dotenv==1.0.1
redis==5.1.0
psutil==6.0.0
```

---

## v2/ Frontend (React - Vercel)

### Technology Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Google Gemini AI** - AI integration
- **Motion** - Animations

### Features
- Weather forecast chatbot (SkyCast AI)
- Vietnamese language interface
- Beautiful weather icons
- Real-time weather data
- Chat history with bot responses

### Deployment
- **Platform:** Vercel
- **URL:** https://lab12-phan-duong-dinh-2-a202600277.vercel.app/

---

## Docker Requirements Check

| Requirement | Standard | Actual | Status |
|-------------|----------|--------|--------|
| Multi-stage build | Required | AS builder + AS runtime | ✅ |
| Non-root user | Required | USER agent | ✅ |
| HEALTHCHECK | Required | 30s interval | ✅ |
| Slim base image | Required | python:3.11-slim | ✅ |
| Image size | < 500 MB | **244 MB** | ✅ |

---

## Verification Results

```bash
# Run from v1/ directory
$ cd 06-lab-complete/v1
$ python check_production_ready.py

=======================================================
  Production Readiness Check — Day 12 Lab
=======================================================

📁 Required Files
  ✅ Dockerfile exists
  ✅ docker-compose.yml exists
  ✅ .dockerignore exists
  ✅ .env.example exists
  ✅ requirements.txt exists
  ✅ railway.toml or render.yaml exists

🔒 Security
  ✅ .env in .gitignore
  ✅ No hardcoded secrets in code

🌐 API Endpoints (code check)
  ✅ /health endpoint defined
  ✅ /ready endpoint defined
  ✅ Authentication implemented
  ✅ Rate limiting implemented
  ✅ Graceful shutdown (SIGTERM)
  ✅ Structured logging (JSON)

🐳 Docker
  ✅ Multi-stage build
  ✅ Non-root user
  ✅ HEALTHCHECK instruction
  ✅ Slim base image
  ✅ .dockerignore covers .env
  ✅ .dockerignore covers __pycache__

=======================================================
  Result: 20/20 checks passed (100%)
  🎉 PRODUCTION READY!
=======================================================
```

---

## API Test Results

```bash
# Docker status
$ docker compose ps
NAME                      STATUS
06-lab-complete-agent-1    healthy (healthy)
06-lab-complete-redis-1   healthy (healthy)

# Image size
$ docker images 06-lab-complete-agent
REPOSITORY              TAG    SIZE
06-lab-complete-agent   latest 244MB

# Health check
$ curl http://localhost:8000/health
{"status":"ok","version":"1.0.0","environment":"staging","uptime_seconds":...}

# Readiness check
$ curl http://localhost:8000/ready
{"ready":true}

# API without auth (expect 401)
$ curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"Hello"}'
{"detail":"Invalid or missing API key..."}

# API with auth (expect 200)
$ curl -X POST http://localhost:8000/ask \
  -H "X-API-Key: dev-key-change-me-in-production" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is Docker?"}'
{"question":"What is Docker?","answer":"Container là cách đóng gói...","model":"gpt-4o-mini",...}

# Metrics
$ curl http://localhost:8000/metrics \
  -H "X-API-Key: dev-key-change-me-in-production"
{"uptime_seconds":...,"total_requests":...,"error_count":0,...}
```

---

## Deployment Summary

| Platform | Component | URL | Status |
|----------|-----------|-----|--------|
| **Vercel** | Frontend | https://lab12-phan-duong-dinh-2-a202600277.vercel.app/ | ✅ |
| **Docker** | Backend | http://localhost:8000 | ✅ |
| **Railway** | Backend | (config ready) | ⏳ Optional |

---

## Line Counts Summary

| File | Lines |
|------|-------|
| v1/app/main.py | 313 |
| v1/app/config.py | 55 |
| v1/Dockerfile | 49 |
| v1/docker-compose.yml | 33 |
| v1/check_production_ready.py | 142 |
| v1/requirements.txt | 7 |
| **v1 Total** | **~600** |
| v2/src/App.tsx | 273 |
| v2/package.json | 36 |
| **v2 Total** | **~300** |

---

## Pre-Submission Checklist

- [x] Repository structure complete (v1/ + v2/)
- [x] Mission Answers completed with all exercises
- [x] All source code in `06-lab-complete/` directory
- [x] README.md has clear setup instructions
- [x] No `.env` file committed (only `.env.example`)
- [x] No hardcoded secrets in code
- [x] Health endpoint returns 200 OK
- [x] API key authentication working (401 without, 200 with)
- [x] Rate limiting implemented
- [x] Docker build successful
- [x] Production readiness: 20/20 checks passed
- [x] Vercel deployment working
- [x] Frontend app structure complete (v2/ with React + Vite)

---

## Production Readiness Check Results

```
=======================================================
  Production Readiness Check — Day 12 Lab
=======================================================

📁 Required Files
  ✅ Dockerfile exists
  ✅ docker-compose.yml exists
  ✅ .dockerignore exists
  ✅ .env.example exists
  ✅ requirements.txt exists
  ✅ railway.toml or render.yaml exists

🔒 Security
  ✅ .env in .gitignore
  ✅ No hardcoded secrets in code

🌐 API Endpoints (code check)
  ✅ /health endpoint defined
  ✅ /ready endpoint defined
  ✅ Authentication implemented
  ✅ Rate limiting implemented
  ✅ Graceful shutdown (SIGTERM)
  ✅ Structured logging (JSON)

🐳 Docker
  ✅ Multi-stage build
  ✅ Non-root user
  ✅ HEALTHCHECK instruction
  ✅ Slim base image
  ✅ .dockerignore covers .env
  ✅ .dockerignore covers __pycache__

=======================================================
  Result: 20/20 checks passed (100%)
  🎉 PRODUCTION READY!
=======================================================
```

---

## Self-Test Verification

```bash
# 1. Health check ✅
curl http://localhost:8000/health
# {"status":"ok","version":"1.0.0","environment":"staging"...}

# 2. Authentication required ✅
curl http://localhost:8000/ask
# {"detail":"Invalid or missing API key..."}

# 3. With API key works ✅
curl -H "X-API-Key: dev-key-change-me-in-production" \
     http://localhost:8000/ask -X POST \
     -d '{"question":"Hello"}'
# {"question":"Hello","answer":"...","model":"gpt-4o-mini"...}

# 4. Docker status ✅
docker compose ps
# 06-lab-complete-agent-1   healthy
# 06-lab-complete-redis-1   healthy

# 5. Image size ✅
docker images 06-lab-complete-agent
# REPOSITORY         TAG    SIZE
# 06-lab-complete-agent  latest  244MB

# 6. Vercel Frontend ✅
curl -s https://lab12-phan-duong-dinh-2-a202600277.vercel.app/
# Returns: HTML page with SkyCast AI weather chatbot
```

---

## Submission

**GitHub Repository:** (Cần tạo và push lên GitHub)

**Public Deployments:**
- **Frontend (Vercel):** https://lab12-phan-duong-dinh-2-a202600277.vercel.app/
- **Backend (Local Docker):** http://localhost:8000

```bash
git init
git add .
git commit -m "Day 12 Lab - Production-ready AI Agent with Docker, Auth, Rate Limiting + Vercel Frontend"
git remote add origin https://github.com/your-username/day12-agent-deployment.git
git push -u origin main
```

**Deadline:** 17/4/2026

---

## Quick Tips

1. Test your public URL from a different device
2. Make sure repository is public or instructor has access
3. Include screenshots of working deployment
4. Write clear commit messages
5. Test all commands work
6. No secrets in code or commit history
7. Run `python check_production_ready.py` before submission

---

## Need Help?

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review [CODE_LAB.md](CODE_LAB.md)
- Ask in office hours
- Post in discussion forum

---

**Good luck! 🚀**
