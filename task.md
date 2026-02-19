# Palmonas Senior SDE Assignment

## Overview

Design and implement an admin CRM portal to manage customer orders from multiple e-commerce platforms (organic website, Amazon, Blinkit, etc.). Demonstrate expertise in system architecture, full-stack development, containerization, system resilience, and integration of AI tools for workflow enhancement.

---

## Task Description

### Core Objective

- Build an MVP (Minimum Viable Product) of an admin portal to view and manage orders coming from various sale channels with production-grade reliability and security.

---

## Deliverables

### 1. Codebase (Frontend + Backend + Container)

Complete, containerized application with the following components:

### Required Features

- **Multi-platform order aggregation** from at least 3 sale channels
- **Order management dashboard** with filtering, sorting, and search
- **Order status tracking** and updates
- **User authentication and authorization** for admin users
- **RESTful API** or GraphQL implementation
- **Database integration** with proper schema design

### Architecture Requirements

- **Microservices or modular monolith** approach
- **Containerization** using Docker (Docker Compose for multi-service setup)
- **Database** (PostgreSQL, MongoDB, or similar)
- **API documentation** (Swagger/OpenAPI preferred)

---

### 2. System Resilience & Hardening Features

### Error Handling & Recovery

- **Comprehensive error handling** at all layers (API, service, database)
- **Retry logic** for external API calls (exponential backoff)
- **Circuit breaker pattern** for third-party integrations (e.g., Amazon, Blinkit APIs)
- **Fallback mechanisms** when external services are unavailable
- **Dead letter queues** or error logging for failed operations
- **Graceful degradation** - system should remain partially functional even if some services fail

### Monitoring & Observability

- **Structured logging** with appropriate log levels
- **Health check endpoints** for all services
- **Metrics collection** (request count, response time, error rates)
- **Request tracing** (correlation IDs across services)

---

### 3. Initialization Complexity & Lifecycle Management

### Application Startup

- **Graceful startup sequence** with dependency checking
- **Database migration** automation (on startup or separate command)
- **Configuration validation** before service starts
- **Pre-flight health checks** (database connectivity, external API availability)
- **Startup readiness probe** - service should signal when it's ready to accept traffic

### Application Shutdown

- **Graceful shutdown** handling (SIGTERM, SIGINT)
- **Connection draining** - complete in-flight requests before shutdown
- **Resource cleanup** (database connections, file handles, background jobs)
- **Maximum shutdown timeout** configuration

### Configuration Management

- **Environment-based configuration** (dev, staging, production)
- **Configuration schema validation**
- **Hot reload capabilities** (where applicable)
- **Feature flags** for enabling/disabling functionality

---

### 4. Performance & Load Testing Requirements

### Performance Targets

- **Response time**: 95th percentile under 500ms for API calls
- **Throughput**: Support at least 100 concurrent users
- **Database queries**: Optimized with proper indexing (< 100ms for common queries)
- **Connection pooling** for database and external services

### Load Testing Implementation

- **Load test suite** using tools like:
    - k6, Apache JMeter, or Locust
    - Test scenarios included for:
        - Normal load (expected traffic)
        - Peak load (2-3x normal traffic)
        - Stress testing (find breaking point)
- **Performance benchmarks documented** in technical documentation
- **Caching strategy** implemented (Redis, in-memory, or CDN)
- **Rate limiting** on API endpoints

### Optimization

- **Database query optimization** with EXPLAIN analysis
- **Pagination** for large data sets
- **Lazy loading** and efficient data fetching
- **Background job processing** for heavy operations (webhooks, bulk updates)

---

### 5. Security Hardening

### Authentication & Authorization

- **JWT or session-based authentication**
- **Role-based access control (RBAC)**
- **Password hashing** (bcrypt, argon2)
- **Token expiration and refresh** mechanism
- **API key management** for third-party integrations

### Secrets Management

- **No hardcoded secrets** in codebase
- **Environment variables** or secret management tools (Vault, AWS Secrets Manager)
- **Encrypted secrets** in configuration files
- **Secret rotation** capability documented

### API Security

- **Input validation and sanitization**
- **SQL injection prevention** (parameterized queries/ORM)
- **XSS protection** (content security policy, output encoding)
- **CSRF protection** for state-changing operations
- **Rate limiting** to prevent abuse
- **CORS configuration** properly set
- **Security headers** (HSTS, X-Frame-Options, etc.)

### Network & Infrastructure Security

- **Container security** best practices (non-root user, minimal base image)
- **Secrets not in Docker images or logs**
- **HTTPS/TLS** for all external communication
- **Dependency vulnerability scanning** (npm audit, Snyk, etc.)

---

### 6. Technical Documentation

Your technical document should cover:

### System Design

- **Architecture diagram** (high-level and component-level)
- **Database schema** with entity relationships
- **API contract** documentation
- **Data flow diagrams** for critical operations
- **Integration architecture** for external platforms

### Resilience & Reliability

- **Error handling strategy**
- **Retry and circuit breaker configuration**
- **Failover scenarios** and handling
- **Monitoring and alerting strategy**

### Performance & Scalability

- **Load testing results** and analysis
- **Performance bottlenecks** identified and addressed
- **Scaling strategy** (horizontal/vertical)
- **Caching strategy** and implementation

### Security

- **Authentication/authorization flow**
- **Secrets management approach**
- **Security threat model** and mitigations
- **Compliance considerations** (if any)

### Development & Deployment

- **Local setup instructions** (step-by-step)
- **Docker/container setup** and orchestration
- **CI/CD pipeline** (if implemented)
- **Environment configuration** guide

### Assumptions & Trade-offs

- **List of assumptions** made during development
- **Technology choices** and rationale
- **Known limitations** and future improvements
- **Trade-offs** between features, performance, and time

### AI Tools Usage

- **Specific AI tools used** (e.g., GitHub Copilot, ChatGPT, Claude)
- **Use cases** for each tool (code generation, debugging, documentation)
- **Productivity impact** assessment
- **Code sections** generated/assisted by AI (be transparent)

---

## Evaluation Criteria

### Core Functionality (25%)

- Feature completeness and correctness
- User experience and interface design
- API design and implementation

### System Architecture (20%)

- Design patterns and best practices
- Modularity and maintainability
- Scalability considerations

### Resilience & Reliability (20%)

- Error handling and recovery mechanisms
- Graceful degradation implementation
- Monitoring and observability

### Performance & Security (20%)

- Load testing implementation and results
- Security best practices
- Optimization techniques

### Code Quality (10%)

- Code organization and readability
- Testing coverage (unit, integration)
- Documentation quality

### DevOps & Deployment (5%)

- Containerization quality
- Ease of setup and deployment
- Configuration management

---

## Submission Guidelines

1. **GitHub Repository** with:
    - Clean commit history
    - README.md with setup instructions
    - .env.example file with required environment variables
    - Docker Compose file for easy local setup
2. **Technical Documentation** (PDF or Markdown):
    - System design diagrams
    - All sections mentioned above
    - Clear and professional presentation
3. **Demo** (optional but recommended):
    - Video walkthrough (5-10 minutes)
    - Live demo deployment link
4. **Load Testing Results**:
    - Test scenarios and scripts
    - Performance metrics and analysis
    - Screenshots or reports from testing tools

# AI Tools

You are encouraged to leverage any AI tool of your choice—such as Claude, ChatGPT, Gemini, or others—for various aspects of this assignment.

# Deadline

You have 72 Hours post you have recived the assignment