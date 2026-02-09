// ChartWorkerManager - Web Worker Management Service
// Mission: Offload heavy scoring and sorting logic to a Web Worker

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
      lastHealthCheck: null
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
        console.log('[ChartWorkerManager] Worker initialized successfully');
        return true;
      } else {
        throw new Error('Timeout waiting for worker initialization');
      }
    } catch (e) {
      console.warn('[ChartWorkerManager] Worker initialization failed, falling back to main thread', e);
      this.fallbackToMainThread = true;
      this.isInitialized = true;
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

  processDataOnMainThread(agents, scenario) {
    // Scenario-Based Weighting Logic (Synced with Worker)
    const weighted = agents.map(item => {
        let multiplier = 1.0;
        const modelName = (item.model || '').toLowerCase();
        const modelId = (item.id || '').toLowerCase();
        const searchStr = `${modelName} ${modelId}`;

        // 1. Scenario: Coding
        if (scenario === 'coding') {
          const isBonus = searchStr.includes('coder') || searchStr.includes('sonnet 3.5') || 
                          searchStr.includes('sonnet-3-5') || searchStr.includes('deepseek-coder');
          const isWeak = searchStr.includes('flash') || searchStr.includes('mini') || 
                         searchStr.includes('turbo') || searchStr.includes('small') ||
                         searchStr.includes('haiku');

          if (isBonus) multiplier = 1.0;
          else if (isWeak) multiplier = 0.85;
          else multiplier = 0.95;
        } 
        // 2. Scenario: Reasoning
        else if (scenario === 'reasoning') {
          const isBonus = searchStr.includes('qwq') || searchStr.includes('o1') || 
                          searchStr.includes('r1') || searchStr.includes('opus');
          const isPenalty = searchStr.includes('turbo') || searchStr.includes('flash') || 
                            searchStr.includes('mini');
          
          if (isBonus) multiplier = 1.0;
          else if (isPenalty) multiplier = 0.90;
        } 
        // 3. Scenario: Creative
        else if (scenario === 'creative') {
          const isBonus = searchStr.includes('opus') || searchStr.includes('gpt-4o') || 
                          searchStr.includes('gemini pro') || searchStr.includes('gemini-pro');
          const isPenalty = searchStr.includes('coder') || searchStr.includes('math');
          
          if (isBonus) multiplier = 1.0;
          else if (isPenalty) multiplier = 0.85;
        }

        const baseScore = item.avgPerf || item.overall_score || item.score || 0;
        const newAvgPerf = parseFloat(baseScore) * multiplier;
        
        // Dynamic Tier Recalculation
        let newTier = item.tier;
        if (scenario !== 'all' && scenario) {
          if (newAvgPerf >= 85) newTier = 'S';
          else if (newAvgPerf >= 75) newTier = 'A';
          else if (newAvgPerf >= 60) newTier = 'B';
          else if (newAvgPerf >= 40) newTier = 'C';
          else newTier = 'D';
        }

        return {
          ...item,
          avgPerf: newAvgPerf,
          tier: newTier
        };
    });

    // Sort by avgPerf descending
    weighted.sort((a, b) => b.avgPerf - a.avgPerf);

    // Update ranks based on sorted order
    return weighted.map((item, index) => ({
        ...item,
        rank: index + 1
    }));
  }

  updateLatencyMetrics(latency) {
    this.metrics.avgLatency = this.metrics.avgLatency === 0 
      ? latency 
      : (this.metrics.avgLatency * 0.7 + latency * 0.3);
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
      this.isInitialized = false;
    }
  }
}

export default ChartWorkerManager.getInstance();
