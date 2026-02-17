// ChartWorkerManager - Web Worker Management Service
// Mission: Offload heavy scoring and sorting logic to a Web Worker
// Uses shared scoringUtils for consistent logic with worker

import { sortAgents } from './scoringUtils';

export class ChartWorkerManager {
  constructor() {
    this.worker = null;
    this.requestQueue = new Map();
    this.isInitialized = false;
    this.workerReady = false;
    this.fallbackToMainThread = false;
    
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

  async initialize() {
    if (this.isInitialized) return this.workerReady;

    try {
      this.worker = new Worker(new URL('../workers/scoring.worker.js', import.meta.url), { type: 'module' });

      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      const initSuccess = await this.waitForWorkerInitialization(3000);
      
      if (initSuccess) {
        this.workerReady = true;
        this.isInitialized = true;
        this.fallbackToMainThread = false;
        this.metrics.workerReady = true;
        console.log('[ChartWorkerManager] Worker initialized successfully');
        return true;
      } else {
        throw new Error('Timeout waiting for worker initialization');
      }
    } catch (e) {
      console.warn('[ChartWorkerManager] Worker initialization failed, falling back to main thread', e);
      this.fallbackToMainThread = true;
      this.isInitialized = true;
      this.metrics.workerReady = false;
      return false;
    }
  }

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
        if (event.data.type === 'initialized') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            this.worker.removeEventListener('message', messageHandler);
            resolve(true);
          }
        }
      };
      this.worker.addEventListener('message', messageHandler);
    });
  }

  handleWorkerMessage(event) {
    const response = event.data;
    if (response.type === 'initialized') return;
    
    const requestItem = this.requestQueue.get(response.id);
    if (!requestItem) return;

    clearTimeout(requestItem.timeoutId);
    this.requestQueue.delete(response.id);
    this.metrics.totalRequests++;
    
    if (response.type === 'error') {
      this.metrics.failedRequests++;
      requestItem.reject(new Error(response.error || 'Worker error'));
    } else {
      this.metrics.successfulRequests++;
      requestItem.resolve(response);
    }
  }

  handleWorkerError(error) {
    console.error('[ChartWorkerManager] Worker error:', error);
    this.fallbackToMainThread = true;
    this.workerReady = false;
    this.metrics.workerReady = false;
    this.requestQueue.forEach(item => item.reject(new Error('Worker error')));
    this.requestQueue.clear();
  }

  async sendRequest(request, timeoutMs = 10000) {
    if (this.fallbackToMainThread || !this.workerReady) {
      throw new Error('Worker unavailable');
    }

    const requestId = `${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestWithId = { ...request, id: requestId };

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.requestQueue.delete(requestId);
        this.metrics.failedRequests++;
        reject(new Error(`Worker request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.requestQueue.set(requestId, { resolve, reject, timeoutId });

      try {
        this.worker.postMessage(requestWithId);
      } catch (error) {
        clearTimeout(timeoutId);
        this.requestQueue.delete(requestId);
        reject(error);
      }
    });
  }

  async processData(agents, scenario) {
    const startTime = performance.now();
    try {
      if (this.fallbackToMainThread) throw new Error('Fallback active');

      const response = await this.sendRequest({
        type: 'process_data',
        data: agents,
        scenario
      });

      if (response.type === 'process_result') {
        const latency = performance.now() - startTime;
        this.updateLatencyMetrics(latency);
        return response.result;
      }
      throw new Error('Unexpected response type');
    } catch (error) {
      console.warn('[ChartWorkerManager] Falling back to main thread calculation', error);
      return this.processDataOnMainThread(agents, scenario);
    }
  }

  // Main thread fallback - uses shared sortAgents for consistency
  processDataOnMainThread(agents, scenario) {
    return sortAgents(agents, scenario);
  }

  updateLatencyMetrics(latency) {
    this.metrics.avgLatency = this.metrics.avgLatency === 0 
      ? latency 
      : (this.metrics.avgLatency * 0.7 + latency * 0.3);
  }

  // Get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Check if worker is available
  isWorkerAvailable() {
    return this.workerReady && !this.fallbackToMainThread;
  }

  // Health check
  async checkHealth() {
    if (!this.workerReady) {
      return {
        status: 'unhealthy',
        workerType: 'scoring',
        memory: 'unknown',
        latency: null,
        timestamp: Date.now()
      };
    }

    try {
      const response = await this.sendRequest({ type: 'health_check' }, 5000);
      return {
        status: 'healthy',
        workerType: 'scoring',
        memory: response.result?.memory || 'unknown',
        latency: this.metrics.avgLatency,
        timestamp: response.result?.timestamp || Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        workerType: 'scoring',
        memory: 'unknown',
        latency: null,
        timestamp: Date.now()
      };
    }
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
      this.isInitialized = false;
      this.metrics.workerReady = false;
    }
  }
}

export default ChartWorkerManager.getInstance();
