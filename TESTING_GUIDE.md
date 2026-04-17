# Testing Guide for Day 12 Cloud Deployment Labs

## Introduction

This guide provides step-by-step instructions for testing each Day 12 lab individually or in sequence. The labs build a production-ready AI agent, covering concepts from localhost development to cloud deployment.

### Prerequisites
- Python 3.11+
- Docker and Docker Compose
- Git (for cloud deployments)
- Mock LLM (no real API keys needed)
- Workspace root: `/home/dwcks/Projects/day12_ha-tang-cloud_va_deployment`

### How to Use This Guide
- **Individual Testing**: Test each lab separately to verify specific features.
- **Sequential Testing**: Follow the "End-to-End Workflow" at the end for full integration.
- Commands assume you're in the lab directory unless specified.
- Expected outputs are marked with `✅` for success criteria.

---

## Lab 01: Localhost vs Production (30 min)

**Objective**: Understand dev/prod gaps; implement 12-factor app principles (env vars, JSON logging, health checks).

**Key Concepts**: Config management, graceful shutdown, anti-patterns.

**Prerequisites**: None.

### Testing Steps
1. **Test Develop Version (Anti-Patterns)**:
   ```
   cd 01-localhost-vs-production/develop
   pip install -r requirements.txt
   python app.py
   ```
   - In another terminal: `curl -X POST http://localhost:8000/ask -H "Content-Type: application/json" -d '{"question": "Hello"}'`

2. **Test Production Version**:
   ```
   cd ../production
   cp .env.example .env
   pip install -r requirements.txt
   python app.py
   ```
   - Health: `curl http://localhost:8000/health`
   - Ready: `curl http://localhost:8000/ready`
   - Ask: `curl -X POST http://localhost:8000/ask -H "Content-Type: application/json" -d '{"question": "Hello"}'`

### Expected Outputs and Verification
- **Develop**: Runs on hardcoded localhost:8000; logs print secrets; no health/ready endpoints.
- **Production**: Binds to 0.0.0.0 (reads PORT env); JSON logs; health returns `{"status": "ok", ...}`; ready returns `{"ready": true}`.
- ✅ Criteria: No hardcoded values; env vars used; logging structured; shutdown graceful (SIGTERM logs "shutdown complete").

**Common Issues**: Port 8000 in use—kill process or change PORT in .env.

---

## Lab 02: Docker Containerization (45 min)

**Objective**: Containerize app with multi-stage builds and orchestration.

**Key Concepts**: Dockerfile layers, multi-stage, Docker Compose.

**Prerequisites**: Lab 01 completed.

### Testing Steps
1. **Test Develop (Basic Dockerfile)**:
   ```
   cd 02-docker/develop
   docker build -f Dockerfile -t my-agent:develop .
   docker run -p 8000:8000 my-agent:develop
   ```
   - Test: `curl -X POST http://localhost:8000/ask -H "Content-Type: application/json" -d '{"question": "What is Docker?"}'`
   - Size: `docker images my-agent:develop`

2. **Test Production (Multi-Stage + Compose)**:
   ```
   cd ../production
   docker compose up
   ```
   - Health: `curl http://localhost/health`
   - Ask: `curl -X POST http://localhost/ask -H "Content-Type: application/json" -d '{"question": "Explain microservices"}'`
   - Scale: `docker compose up --scale agent=3` (check logs: `docker compose logs agent`)

### Expected Outputs and Verification
- **Develop**: Image ~1GB; basic response; single-stage.
- **Production**: Image <500MB; stack runs (agent, redis, qdrant, nginx); load balances; health/ready work.
- ✅ Criteria: Multi-stage reduces size; Compose orchestrates; scaling distributes requests (logs show distribution).

**Common Issues**: Image build fails—check Dockerfile syntax; port conflicts—stop other containers.

---

## Lab 03: Cloud Deployment (45 min)

**Objective**: Deploy to cloud platforms.

**Key Concepts**: PaaS deployment, env vars, public URLs.

**Prerequisites**: Labs 01-02; GitHub repo (for Render).

### Testing Steps
1. **Railway Deployment**:
   ```
   cd 03-cloud-deployment/railway
   npm i -g @railway/cli
   railway login
   railway init
   railway variables set PORT=8000 AGENT_API_KEY=my-secret-key
   railway up
   ```
   - Get URL: `railway domain`
   - Test: `curl http://<domain>/health` and ask endpoint.

2. **Render Deployment**: Push code to GitHub, connect via Render dashboard (use `render.yaml`), set env vars, deploy automatically.

3. **Cloud Run (Optional)**: `gcloud builds submit --config cloudbuild.yaml .`

### Expected Outputs and Verification
- Public URL active; health `{"status": "ok"}`; agent responds; env vars work.
- ✅ Criteria: Deploy succeeds; URL accessible; structured logs; no hardcoded values.

**Common Issues**: Railway CLI auth—re-login; Render build fails—check .env vars.

---

## Lab 04: API Security (40 min)

**Objective**: Secure API with auth, rate limiting, cost guard.

**Key Concepts**: Authentication, throttling, budget protection.

**Prerequisites**: Lab 01-03.

### Testing Steps
1. **Test Develop (API Key)**:
   ```
   cd 04-api-gateway/develop
   python app.py
   ```
   - No key: `curl -X POST http://localhost:8000/ask -H "Content-Type: application/json" -d '{"question": "Hello"}'` (401)
   - With key: Add `-H "X-API-Key: secret-key-123"` (200)

2. **Test Production (JWT + Limits)**:
   ```
   cd ../production
   python app.py
   ```
   - Get token: `curl -X POST http://localhost:8000/auth/token -H "Content-Type: application/json" -d '{"username": "admin", "password": "secret"}'`
   - Use token: `curl -X POST http://localhost:8000/ask -H "Authorization: Bearer <token>" ...`
   - Rate limit: Loop 20 requests (429 after 10); cost guard: Simulate over-budget (402).

### Expected Outputs and Verification
- **Develop**: 401 without key; 200 with key.
- **Production**: JWT token; rate limits (429); cost blocks (402); usage tracked.
- ✅ Criteria: Auth fails without creds; limits enforced; Redis state persists.

**Common Issues**: Token expired—re-auth; rate reset—wait 60s.

---

## Lab 05: Scaling & Reliability (40 min)

**Objective**: Ensure app scales and handles failures.

**Key Concepts**: Stateless design, probes, load balancing.

**Prerequisites**: Lab 01-04.

### Testing Steps
1. **Test Develop (Health Checks)**:
   ```
   cd 05-scaling-reliability/develop
   python app.py & PID=$!
   ```
   - Health: `curl http://localhost:8000/health`
   - Ready: `curl http://localhost:8000/ready`
   - Shutdown: `kill -TERM $PID`

2. **Test Production (Stateless + Scaling)**:
   ```
   cd ../production
   docker compose up --scale agent=3
   ```
   - Health/ready: As above.
   - Stateless: Run `python test_stateless.py` (session continuity).
   - Load: Loop 10 curls; check logs.

### Expected Outputs and Verification
- **Develop**: Health shows uptime; shutdown finishes.
- **Production**: Sessions in Redis; scaling distributes; kill instance—state OK.
- ✅ Criteria: Probes 200/503; shutdown logs complete; stateless verified.

**Common Issues**: Scaling fails—check resources; state loss—verify Redis.

---

## Lab 06: Lab Complete (60 min)

**Objective**: Full production-ready agent.

**Key Concepts**: Integration of all features.

**Prerequisites**: All previous labs.

### Testing Steps
1. **Local Testing**:
   ```
   cd 06-lab-complete
   cp .env.example .env
   docker compose up
   ```
   - Health: `curl http://localhost/health`
   - Ask: `curl -H "X-API-Key: <from .env>" -X POST http://localhost/ask -H "Content-Type: application/json" -d '{"question": "What is deployment?"}'`

2. **Readiness Check**:
   ```
   python check_production_ready.py
   ```

3. **Cloud Deploy**:
   - Railway: `railway login && railway init && railway variables set ... && railway up`
   - Render: Push to GitHub, deploy via dashboard.
   - Test public URL.

### Expected Outputs and Verification
- Local: Stack runs; all features work.
- Checker: 100% pass (✅ all items).
- Deploy: Public URL functional.
- ✅ Criteria: All labs' criteria met; production-ready.

**Common Issues**: Checker fails—fix Dockerfile/.env; deploy errors—check logs.

---

## End-to-End Testing Workflow

1. Complete Labs 01-05 individually (localhost testing).
2. Integrate: Use production Dockerfile from 02 for 03-06.
3. Deploy in 06: Railway/Render, test all endpoints.
4. Full Check: Run checker and verify cloud functionality.

## Appendices

- **Glossary**: 12-factor app (external config), multi-stage build (layered images).
- **Resources**: Docker docs, Railway CLI guide.
- **Checklist**: ✅ for each lab's criteria.

For issues, check `TROUBLESHOOTING.md` or logs.