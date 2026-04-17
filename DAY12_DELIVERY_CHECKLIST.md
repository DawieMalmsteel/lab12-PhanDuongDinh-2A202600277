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

### Exercise 3.1: Railway deployment

**Files verified:**
- ✅ railway.toml exists with builder, startCommand, healthcheckPath
- ✅ healthcheckPath = /health
- ✅ startCommand = uvicorn app:app --host 0.0.0.0 --port $PORT

**Deployment steps completed:**
1. Railway CLI installed
2. Project configured with railway.toml
3. Environment variables set
4. Health check endpoint working

### Exercise 3.2: Render deployment

**Files verified:**
- ✅ render.yaml exists with services definition
- ✅ healthCheckPath: /health
- ✅ autoDeploy: true

### Exercise 3.3: Cloud Run (CI/CD)

**Files verified:**
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

**Implementation location:** `app/main.py:75-84`

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
- SIGTERM signal handler in `app/main.py:273`
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

### 2. Full Source Code - Lab 06 Complete (60 points)

```
06-lab-complete/
├── app/
│   ├── __init__.py
│   ├── main.py              # 285 lines - Full implementation
│   └── config.py             # 55 lines - 12-factor config
├── utils/
│   └── mock_llm.py           # Mock LLM (provided)
├── Dockerfile                # Multi-stage, non-root, HEALTHCHECK
├── docker-compose.yml        # agent + redis services
├── requirements.txt          # Dependencies
├── .env                      # Local (gitignored)
├── .env.example              # Template
├── .dockerignore             # Excludes .env, __pycache__
├── railway.toml              # Railway config
├── render.yaml               # Render config
├── check_production_ready.py  # Verification script
└── README.md                 # Setup instructions
```

**Requirements - All Met:**

| Requirement | Status | Details |
|-------------|--------|---------|
| All code runs without errors | ✅ | Verified - curl tests pass |
| Multi-stage Dockerfile | ✅ | AS builder + AS runtime |
| Image < 500 MB | ✅ | **244 MB** |
| API key authentication | ✅ | X-API-Key header |
| Rate limiting | ✅ | 20 req/min sliding window |
| Cost guard | ✅ | $5.0/day budget |
| Health + readiness checks | ✅ | /health + /ready endpoints |
| Graceful shutdown | ✅ | SIGTERM handler |
| Stateless design | ✅ | Redis session storage |
| No hardcoded secrets | ✅ | All from env vars |

---

### 3. Service Domain Link

```markdown
# Deployment Information

## Platform
Docker Compose (Local Development)

## Test Commands

### Health Check
curl http://localhost:8000/health
# Result: {"status":"ok","version":"1.0.0","environment":"staging","uptime_seconds":1133.6,"total_requests":7,"checks":{"llm":"openai"},"timestamp":"2026-04-17T10:04:55.818886+00:00"}

### Readiness Check
curl http://localhost:8000/ready
# Result: {"ready":true}

### API Test (with authentication)
curl -X POST http://localhost:8000/ask \
  -H "X-API-Key: dev-key-change-me-in-production" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Docker?"}'
# Result: {"question":"What is Docker?","answer":"Container là cách đóng gói app để chạy ở mọi nơi...","model":"gpt-4o-mini","timestamp":"..."}

### Metrics
curl http://localhost:8000/metrics -H "X-API-Key: dev-key-change-me-in-production"
# Result: {"uptime_seconds":1155.1,"total_requests":38,"error_count":0,"daily_cost_usd":0.0,"daily_budget_usd":5.0,"budget_used_pct":0.0}

## Environment Variables Set
- ENVIRONMENT=staging
- APP_NAME=Production AI Agent
- APP_VERSION=1.0.0
- REDIS_URL=redis://redis:6379/0
- AGENT_API_KEY=dev-key-change-me-in-production
- RATE_LIMIT_PER_MINUTE=20
- DAILY_BUDGET_USD=5.0
- LLM_MODEL=gpt-4o-mini
```

---

## Pre-Submission Checklist

- [x] Repository structure complete
- [x] `MISSION_ANSWERS.md` completed with all exercises
- [x] All source code in `06-lab-complete/` directory
- [x] `README.md` has clear setup instructions
- [x] No `.env` file committed (only `.env.example`)
- [x] No hardcoded secrets in code
- [x] Health endpoint returns 200 OK
- [x] API key authentication working (401 without, 200 with)
- [x] Rate limiting implemented
- [x] Docker build successful
- [x] Production readiness: 20/20 checks passed

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
```

---

## Submission

**GitHub Repository:** (Cần tạo và push lên GitHub)

```bash
git init
git add .
git commit -m "Day 12 Lab - Production-ready AI Agent with Docker, Auth, Rate Limiting"
git remote add origin https://github.com/DawieMalmsteel/lab12-PhanDuongDinh-2A202600277
git push -u origin main
```

**Deadline:** 17/4/2026

---

## Quick Tips

1. Test your public URL from a different device
2. Make sure repository is public or instructor has access
3. Include screenshots of working deployment
4. Write clear commit messages
5. Test all commands in DEPLOYMENT.md work
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
