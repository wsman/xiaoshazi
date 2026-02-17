/**
 * xiaoshazi Prometheus Metrics
 * Exposes /metrics endpoint with core application metrics
 */

const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register, prefix: 'xiaoshazi_' });

// ============================================
// Custom Application Metrics
// ============================================

// HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'xiaoshazi_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'xiaoshazi_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Active connections gauge
const activeConnections = new client.Gauge({
  name: 'xiaoshazi_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

// Socket.io connections
const socketConnections = new client.Gauge({
  name: 'xiaoshazi_socket_connections',
  help: 'Number of active Socket.io connections',
  registers: [register],
});

// Redis connection status
const redisConnected = new client.Gauge({
  name: 'xiaoshazi_redis_connected',
  help: 'Redis connection status (1 = connected, 0 = disconnected)',
  registers: [register],
});

// API response time gauge (for quick checks)
const apiResponseTime = new client.Gauge({
  name: 'xiaoshazi_api_response_time_ms',
  help: 'Last API response time in milliseconds',
  labelNames: ['route'],
  registers: [register],
});

// Error counter by type
const errorsTotal = new client.Counter({
  name: 'xiaoshazi_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route'],
  registers: [register],
});

// ============================================
// Middleware Functions
// ============================================

/**
 * Create metrics middleware for Express
 * @param {object} options - Configuration options
 * @returns {Function} Express middleware
 */
function metricsMiddleware(options = {}) {
  const { excludePaths = ['/metrics', '/health'] } = options;

  return (req, res, next) => {
    // Skip metrics endpoints
    if (excludePaths.includes(req.path)) {
      return next();
    }

    const startTime = Date.now();
    const route = req.route ? req.route.path : req.path;

    // Increment active connections
    activeConnections.inc();

    // Capture response finish event
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const statusCode = res.statusCode.toString();
      const labels = {
        method: req.method,
        route: route,
        status_code: statusCode,
      };

      // Record metrics
      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, duration);

      // Update response time gauge
      apiResponseTime.set({ route }, (Date.now() - startTime));

      // Track errors (4xx and 5xx)
      if (res.statusCode >= 400) {
        const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
        errorsTotal.inc({ type: errorType, route });
      }

      // Decrement active connections
      activeConnections.dec();
    });

    next();
  };
}

/**
 * Update Redis connection status
 * @param {boolean} connected - Connection status
 */
function updateRedisStatus(connected) {
  redisConnected.set(connected ? 1 : 0);
}

/**
 * Update Socket.io connections
 * @param {number} count - Number of connections
 */
function updateSocketConnections(count) {
  socketConnections.set(count);
}

// ============================================
// Metrics Endpoint
// ============================================

/**
 * Get metrics for /metrics endpoint
 * @returns {Promise<string>} Metrics in Prometheus format
 */
async function getMetrics() {
  return register.metrics();
}

/**
 * Get metrics as JSON
 * @returns {Promise<object>} Metrics data
 */
async function getMetricsAsJson() {
  return register.getSingleMetricAsJSON('xiaoshazi_http_requests_total');
}

// ============================================
// Health Check Data
// ============================================

/**
 * Get health check data with metrics
 * @returns {object} Health status
 */
function getHealthData() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    metrics: {
      httpRequestsTotal: httpRequestsTotal.values.length,
      activeConnections: activeConnections.values,
    },
    redis: {
      connected: redisConnected.values[0]?.value === 1,
    },
  };
}

module.exports = {
  register,
  client,

  // Metrics
  httpRequestsTotal,
  httpRequestDuration,
  activeConnections,
  socketConnections,
  redisConnected,
  apiResponseTime,
  errorsTotal,

  // Middleware
  metricsMiddleware,

  // Helpers
  updateRedisStatus,
  updateSocketConnections,
  getMetrics,
  getMetricsAsJson,
  getHealthData,
};
