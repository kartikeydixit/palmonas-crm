import http from "k6/http";
import { check, sleep } from "k6";

// Configure base URL via environment variable, default to localhost API
const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  scenarios: {
    normal_load: {
      executor: "constant-vus",
      vus: 20,
      duration: "1m",
      exec: "scenarioNormal"
    },
    peak_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "1m", target: 100 },
        { duration: "30s", target: 0 }
      ],
      exec: "scenarioPeak"
    },
    stress_test: {
      executor: "ramping-arrival-rate",
      startRate: 20,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { target: 50, duration: "30s" },
        { target: 100, duration: "30s" },
        { target: 200, duration: "30s" },
        { target: 0, duration: "30s" }
      ],
      exec: "scenarioStress"
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.01"], // <1% errors
    http_req_duration: ["p(95)<500"] // 95% of requests < 500ms
  }
};

// Helper to login once per VU and reuse token
function login() {
  const payload = JSON.stringify({
    email: "admin@palmonas.local",
    password: "Admin@12345"
  });

  const res = http.post(`${BASE_URL}/auth/login`, payload, {
    headers: { "content-type": "application/json" }
  });

  check(res, {
    "login status is 200": (r) => r.status === 200
  });

  const body = res.json();
  return body.accessToken;
}

function listOrders(token) {
  const res = http.get(`${BASE_URL}/orders?page=1&limit=20`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  check(res, {
    "orders status is 200": (r) => r.status === 200,
    "orders response time p(95) < 500ms": (r) => r.timings.duration < 500
  });
}

export function scenarioNormal() {
  const token = login();
  listOrders(token);
  sleep(1);
}

export function scenarioPeak() {
  const token = login();
  listOrders(token);
  sleep(0.5);
}

export function scenarioStress() {
  const token = login();
  listOrders(token);
  sleep(0.2);
}

