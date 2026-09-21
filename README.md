# AI-Based Fake Identity & Document Screening System

A production-style document analysis and anti-tampering verification platform built with React, Node.js (Express), Python (FastAPI), MongoDB, and Docker.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS (`/frontend`)
- **Backend**: Node.js + Express + Mongoose + JWT (`/backend`)
- **AI Service**: Python + FastAPI + PyTorch + OpenCV + PaddleOCR + XGBoost + PyZBar (`/ai-service`)
- **Database**: MongoDB (`mongodb://localhost:27017/identity_screening`)

## Quick Start (Docker Compose)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Express Backend: http://localhost:5000/api/health
- FastAPI AI Engine: http://localhost:8000/health
