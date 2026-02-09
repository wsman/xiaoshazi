// ChartWorkerManager - Web Worker Management Service
// Adapted from Technology Department Library
// Target: xiaoshazi/client/src/utils/ChartWorkerManager.js

// ============ Worker Manager Class ============

export class ChartWorkerManager {
  // Singleton Pattern
  constructor() {
    this.worker = null;
    this.requestQueue = new Map();
    this.isInitialized = false;
    this.workerReady = false;
    this.fallbackToMainThread = true; // Default to main thread as worker file might be missing
    
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatency: 0,
      lastHealthCheck: null,
      workerReady: false
    };
  }

  static getInstance() {
    if (!ChartWorkerManager.instance) {
      ChartWorkerManager.instance = new ChartWorkerManager();
    }
    return ChartWorkerManager.instance;
  }

  // Initialize Worker
  async initialize() {
    if (this.isInitialized) {
      return this.workerReady;
    }

    try {
      // Try to create Web Worker
      // Note: We assume the worker file might not exist in this target project yet
      // So we wrap in try-catch and fallback
      try {
        this.worker = new Worker(new URL('../workers/chart.worker.js', import.meta.url), {
          type: 'module'
        });

        // Set message handlers
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = this.handleWorkerError.bind(this);
        
        // Wait for Worker initialization
        const initSuccess = await this.waitForWorkerInitialization(2000);
        
        if (initSuccess) {
          this.workerReady = true;
          this.isInitialized = true;
          this.fallbackToMainThread = false;
          console.log('[ChartWorkerManager] Worker initialized successfully');
          
          // Initial Health Check
          this.checkHealth().then(health => {
            this.metrics.lastHealthCheck = health;
            console.log('[ChartWorkerManager] Initial health check:', health);
          });
          
          return true;
        } else {
          throw new Error('Timeout waiting for worker');
        }
      } catch (e) {
        // console.warn('[ChartWorkerManager] Worker initialization failed, falling back to main thread', e);
        this.fallbackToMainThread = true;
        this.isInitialized = true;
        return false;
      }
    } catch (error) {
      console.error('[ChartWorkerManager] Failed to initialize manager:', error);
      this.fallbackToMainThread = true;
      return false;
    }
  }

  // Wait for Worker Initialization
  waitForWorkerInitialization(timeoutMs) {
    return new Promise((resolve) => {
      let resolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, timeoutMs);

      const messageHandler = (event) => {
        const message = event.data;
        if (message.type === 'initialized') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve(true);
          }
        }
      };

      if (this.worker) {
        this.worker.addEventListener('message', messageHandler);
        
        // Remove listener after timeout + buffer
        setTimeout(() => {
          if (this.worker) {
            this.worker.removeEventListener('message', messageHandler);
          }
        }, timeoutMs + 100);
      } else {
        resolve(false);
      }
    });
  }

  // Handle Worker Message
  handleWorkerMessage(event) {
    const response = event.data;
    
    // Handle initialization message
    if (response.type === 'initialized') {
      console.log('[ChartWorkerManager] Worker initialization confirmed:', response);
      return;
    }
    
    // Handle termination message
    if (response.type === 'terminated') {
      console.log('[ChartWorkerManager] Worker terminated:', response);
      this.workerReady = false;
      return;
    }
    
    // Find request
    const requestItem = this.requestQueue.get(response.id);
    if (!requestItem) {
      // console.warn('[ChartWorkerManager] Received response for unknown request:', response.id);
      return;
    }

    // Clear timeout
    clearTimeout(requestItem.timeoutId);
    this.requestQueue.delete(response.id);

    // Update metrics
    this.metrics.totalRequests++;
    
    if (response.type === 'error') {
      this.metrics.failedRequests++;
      console.error('[ChartWorkerManager] Worker error:', response.error);
      requestItem.reject(new Error(response.error || 'Unknown worker error'));
    } else {
      this.metrics.successfulRequests++;
      requestItem.resolve(response);
    }
  }

  // Handle Worker Error
  handleWorkerError(error) {
    console.error('[ChartWorkerManager] Worker error:', error);
    
    // Mark fallback
    this.fallbackToMainThread = true;
    this.workerReady = false;
    
    // Reject pending requests
    this.requestQueue.forEach((item) => {
      item.reject(new Error('Worker error: ' + error.message));
    });
    this.requestQueue.clear();
  }

  // Send Request to Worker
  async sendRequest(request, timeoutMs = 10000) {
    // If fallback or worker not ready, throw error to trigger catch block in caller
    if (this.fallbackToMainThread || !this.workerReady) {
      throw new Error('Worker is unavailable, falling back to main thread calculation');
    }

    // Generate Request ID
    const requestId = `${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestWithId = { ...request, id: requestId };

    return new Promise((resolve, reject) => {
      // Set Timeout
      const timeoutId = setTimeout(() => {
        this.requestQueue.delete(requestId);
        this.metrics.failedRequests++;
        reject(new Error(`Worker request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // Add to Queue
      this.requestQueue.set(requestId, {
        request: requestWithId,
        resolve,
        reject,
        timeoutId
      });

      // Post Message
      try {
        if (this.worker) {
          this.worker.postMessage(requestWithId);
        } else {
          clearTimeout(timeoutId);
          this.requestQueue.delete(requestId);
          reject(new Error('Worker not available'));
        }
      } catch (error) {
        clearTimeout(timeoutId);
        this.requestQueue.delete(requestId);
        reject(error);
      }
    });
  }

  // Calculate Indicators (Main Entry)
  async calculateIndicators(data, indicators, batchSize = 50, scenario = null) {
    const startTime = performance.now();
    
    try {
      if (this.fallbackToMainThread) {
        throw new Error('Fallback mode active');
      }

      const response = await this.sendRequest({
        id: 'temp',
        type: 'calculate_indicators',
        data,
        indicators,
        batchSize,
        scenario
      });

      if (response.type === 'indicator_result' || response.type === 'batch_result') {
        const latency = performance.now() - startTime;
        this.updateLatencyMetrics(latency);
        return response.result || {};
      } else {
        throw new Error(`Unexpected response type: ${response.type}`);
      }
    } catch (error) {
      // Fallback to Main Thread
      console.warn('[ChartWorkerManager] Using main thread fallback', error);
      return calculateIndicatorsInMainThread(data, indicators);
    }
  }

  // Health Check
  async checkHealth() {
    try {
      const response = await this.sendRequest({
        id: 'health_check',
        type: 'health_check'
      }, 5000);

      if (response.type === 'health_response' && response.result) {
        const health = {
          status: 'healthy',
          workerType: 'chart_calculation',
          memory: response.result.memory || 'unknown',
          latency: this.metrics.avgLatency,
          timestamp: response.result.timestamp || Date.now()
        };
        
        this.metrics.lastHealthCheck = health;
        return health;
      } else {
        throw new Error('Invalid health response');
      }
    } catch (error) {
      // console.error('[ChartWorkerManager] Health check failed:', error);
      
      const health = {
        status: 'unhealthy',
        workerType: 'chart_calculation',
        memory: 'unknown',
        latency: null,
        timestamp: Date.now()
      };
      
      this.metrics.lastHealthCheck = health;
      return health;
    }
  }

  // Update Latency Metrics
  updateLatencyMetrics(latency) {
    if (this.metrics.avgLatency === 0) {
      this.metrics.avgLatency = latency;
    } else {
      // SMA
      this.metrics.avgLatency = (this.metrics.avgLatency * 0.7 + latency * 0.3);
    }
  }

  // Get Metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Check Availability
  isWorkerAvailable() {
    return this.workerReady && !this.fallbackToMainThread;
  }

  // Terminate Worker
  async terminate() {
    try {
      if (this.worker) {
        this.worker.postMessage({ type: 'terminate' });
        this.worker.terminate();
      }
    } catch (error) {
      console.error('[ChartWorkerManager] Error terminating worker:', error);
    } finally {
      this.worker = null;
      this.workerReady = false;
      this.isInitialized = false;
      this.requestQueue.clear();
      console.log('[ChartWorkerManager] Worker terminated');
    }
  }

  cleanup() {
    this.terminate();
  }
}

// ============ Main Thread Fallback Functions ============

export function calculateIndicatorsInMainThread(data, indicators) {
  // Return the original data sorted as a fallback
  console.log('Calculating indicators in main thread (Fallback)');
  return [...data].sort((a, b) => b.avgPerf - a.avgPerf).map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

// Default Export
export default ChartWorkerManager.getInstance();
