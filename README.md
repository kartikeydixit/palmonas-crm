# Palmonas Admin CRM (MERN) — MVP

Admin CRM portal to aggregate and manage orders across multiple sales channels (Website, Amazon, Blinkit).

## Quickstart (Docker)

### Prerequisites
- Docker & Docker Compose installed
- Ports 4000, 4010, 4020, 5173, 27017, 6379 available

### Setup Steps

1. **Copy environment file:**
```bash
cp .env.example .env
```

2. **Edit `.env` file** (optional - defaults work for local dev):
```bash
# Set JWT secrets (required for production)
JWT_ACCESS_SECRET=your-secret-key-min-16-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-16-chars
```

3. **Start all services:**
```bash
docker compose up --build
```

This will start:
- **MongoDB** (port 27017)
- **Redis** (port 6379)
- **Mock Channels API** (port 4010) - simulates Amazon/Blinkit/Website APIs
- **Backend API** (port 4000)
- **Worker** (port 4020) - background sync jobs
- **Frontend** (port 5173)

4. **Access the application:**
- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000
- **API Docs (Swagger)**: http://localhost:4000/docs
- **Metrics (Prometheus)**: http://localhost:4000/metrics
- **Health Check**: http://localhost:4000/healthz
- **Readiness**: http://localhost:4000/readyz

### Default Admin User

On first run, the API automatically creates a default admin:
- **Email**: `admin@palmonas.local`
- **Password**: `Admin@12345`

## Features Implemented

### ✅ Core Functionality
- **Multi-platform order aggregation** from 3 channels (Website, Amazon, Blinkit)
- **Order management dashboard** with:
  - Filtering by channel and status
  - Search by order ID, customer name, phone
  - Sorting and pagination
  - Status updates (admin only)
- **User authentication** with JWT (access + refresh tokens)
- **Role-based access control** (admin/viewer)
- **RESTful API** with OpenAPI/Swagger documentation

### ✅ System Resilience
- **Circuit breaker pattern** for external channel APIs
- **Retry logic** with exponential backoff (via BullMQ)
- **Fallback to cache** when external services fail
- **Graceful degradation** - system remains functional if channels are down
- **Structured logging** with correlation IDs
- **Health & readiness probes** for all services
- **Metrics collection** (Prometheus format)

### ✅ Security
- **JWT authentication** with token expiration
- **Password hashing** (bcrypt)
- **Rate limiting** on API endpoints
- **CORS** configuration
- **Security headers** (Helmet)
- **Input validation** (Zod schemas)
- **No hardcoded secrets** (environment variables)

### ✅ Performance
- **Redis caching** for order lists (30s TTL)
- **Database indexing** on common query fields
- **Pagination** for large datasets
- **Connection pooling** (MongoDB, Redis)

### ✅ Lifecycle Management
- **Graceful startup** with dependency checks
- **Pre-flight health checks** (database, Redis, external APIs)
- **Graceful shutdown** (SIGTERM/SIGINT handling)
- **Configuration validation** on startup
- **Feature flags** support

## Repo Structure

```
.
├── backend/          # Express API (TypeScript)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/      # Authentication & authorization
│   │   │   ├── orders/    # Order management
│   │   │   ├── health/    # Health checks
│   │   │   └── integrations/ # Channel adapters
│   │   └── lib/           # Shared utilities
├── worker/          # Background job processor (BullMQ)
│   └── src/
│       ├── jobs/          # Sync job handlers
│       └── integrations/  # Channel adapters
├── mock-channels/   # Mock external APIs (3 platforms)
├── frontend/        # React admin portal (Vite)
├── load-test/       # k6 load test scripts (TODO)
└── docs/            # Technical documentation (TODO)
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user (protected)

### Orders
- `GET /orders` - List orders (filtering, sorting, pagination)
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id/status` - Update order status (admin only)

### System
- `GET /healthz` - Liveness probe
- `GET /readyz` - Readiness probe
- `GET /metrics` - Prometheus metrics
- `GET /docs` - Swagger API documentation

## Usage Workflow

1. **Login** to the frontend with default admin credentials
2. **Sync orders** from channels using the "Sync" buttons
3. **View orders** in the dashboard
4. **Filter/search** orders by channel, status, or text
5. **Update status** (admin only) using the dropdown in the table

## Development

### Local Development (without Docker)

Each service can be run independently:

**Backend:**
```bash
cd backend
npm install
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Worker:**
```bash
cd worker
npm install
npm run build
npm start
```

**Mock Channels:**
```bash
cd mock-channels
npm install
npm run build
npm start
```

## Testing

### Manual Testing
1. Start all services via Docker Compose
2. Login to frontend
3. Trigger sync jobs for each channel
4. Verify orders appear in dashboard
5. Test filtering, searching, pagination
6. Update order status (admin)

### Load Testing
Load test scripts will be added in `load-test/` directory using k6.

## Notes

- This is an MVP built to satisfy the assignment requirements in `task.md`
- Production-grade patterns implemented: retries, circuit breakers, correlation IDs, health checks, metrics, rate limiting, RBAC
- All services are containerized and orchestrated via Docker Compose
- MongoDB and Redis data persist in Docker volumes

