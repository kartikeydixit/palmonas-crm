# How to Run the Application

## Prerequisites

1. **Docker & Docker Compose** installed on your system
   - Check: `docker --version` and `docker compose version`
   - Install: https://docs.docker.com/get-docker/

2. **Ports available** (4000, 4010, 4020, 5173, 27017, 6379)

## Quick Start

### Step 1: Navigate to project directory
```bash
cd /Users/kartikey/Desktop/task2
```

### Step 2: Verify environment file
The `.env` file should already exist (copied from `.env.example`). If not:
```bash
cp .env.example .env
```

### Step 3: Start all services
```bash
docker compose up --build
```

This will:
- Build all Docker images
- Start MongoDB, Redis, Mock Channels, API, Worker, and Frontend
- Show logs from all services

### Step 4: Wait for services to be healthy
Watch the logs until you see:
- `api_ready` - API is ready
- `worker_ready` - Worker is ready
- `mock_channels_ready` - Mock channels are ready

### Step 5: Access the application

Open your browser and navigate to:

- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000
- **API Docs**: http://localhost:4000/docs
- **Metrics**: http://localhost:4000/metrics
- **Health Check**: http://localhost:4000/healthz

### Step 6: Login

Use the default admin credentials:
- **Email**: `admin@palmonas.local`
- **Password**: `Admin@12345`

### Step 7: Test the application

1. **Sync orders**: Click the "Sync website", "Sync amazon", and "Sync blinkit" buttons
2. **View orders**: Orders will appear in the dashboard table
3. **Filter orders**: Use the filters (channel, status) or search box
4. **Update status**: Change order status using the dropdown (admin only)

## Troubleshooting

### Check service status
```bash
docker compose ps
```
All services should show "healthy" status.

### View logs
```bash
# All services
docker compose logs

# Specific service
docker compose logs api
docker compose logs worker
docker compose logs frontend
```

### Restart a service
```bash
docker compose restart api
```

### Stop all services
```bash
docker compose down
```

### Stop and remove volumes (clean slate)
```bash
docker compose down -v
```

### Common Issues

1. **Port already in use**
   - Stop other services using those ports
   - Or modify ports in `docker-compose.yml`

2. **Build fails**
   - Check Docker is running: `docker ps`
   - Check internet connection (needs to pull images)
   - Try: `docker compose build --no-cache`

3. **Services not starting**
   - Check logs: `docker compose logs`
   - Verify `.env` file exists and has proper values
   - Ensure MongoDB and Redis containers start first

4. **Frontend can't connect to API**
   - Check API is running: `curl http://localhost:4000/healthz`
   - Verify CORS_ORIGINS in `.env` includes `http://localhost:5173`

## Alternative: Run without Docker

If you prefer to run services individually:

### Backend API
```bash
cd backend
npm install
npm run build
MONGO_URI=mongodb://localhost:27017/palmonas REDIS_URL=redis://localhost:6379 JWT_ACCESS_SECRET=secret JWT_REFRESH_SECRET=secret npm start
```

### Worker
```bash
cd worker
npm install
npm run build
MONGO_URI=mongodb://localhost:27017/palmonas REDIS_URL=redis://localhost:6379 CHANNELS_BASE_URL=http://localhost:4010 npm start
```

### Mock Channels
```bash
cd mock-channels
npm install
npm run build
PORT=4010 npm start
```

### Frontend
```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:4000 npm run dev
```

Note: You'll need MongoDB and Redis running separately for this approach.
