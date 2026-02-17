/**
 * Integration Tests - Redis Connection
 */

describe('Redis Integration Tests', () => {
  let redisClient;
  let isRedisConnected = false;
  
  beforeAll(async () => {
    try {
      const redis = require('redis');
      const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
      
      redisClient = redis.createClient({
        url: REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });
      
      redisClient.on('error', (err) => {
        console.error('Redis connection error:', err.message);
      });
      
      await redisClient.connect();
      isRedisConnected = true;
      console.log('Redis connected for tests');
    } catch (error) {
      console.warn('Redis not available for integration tests:', error.message);
      isRedisConnected = false;
    }
  });
  
  afterAll(async () => {
    if (redisClient && isRedisConnected) {
      try {
        await redisClient.quit();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
  
  describe('Redis Connection', () => {
    it('should connect to Redis server', async () => {
      if (!isRedisConnected) {
        console.log('Skipping Redis connection test - Redis not available');
        return;
      }
      
      expect(redisClient.isOpen).toBe(true);
    });
    
    it('should ping Redis server', async () => {
      if (!isRedisConnected) {
        console.log('Skipping Redis ping test - Redis not available');
        return;
      }
      
      const result = await redisClient.ping();
      expect(result).toBe('PONG');
    });
    
    it('should set and get value', async () => {
      if (!isRedisConnected) {
        console.log('Skipping Redis set/get test - Redis not available');
        return;
      }
      
      const testKey = 'test:unit:xiaoshazi';
      const testValue = 'test-value-' + Date.now();
      
      await redisClient.set(testKey, testValue);
      const result = await redisClient.get(testKey);
      
      expect(result).toBe(testValue);
      
      // Cleanup
      await redisClient.del(testKey);
    });
    
    it('should set and get JSON value', async () => {
      if (!isRedisConnected) {
        console.log('Skipping Redis JSON test - Redis not available');
        return;
      }
      
      const testKey = 'test:json:xiaoshazi';
      const testData = { name: 'test', value: 123, timestamp: Date.now() };
      
      await redisClient.set(testKey, JSON.stringify(testData));
      const result = await redisClient.get(testKey);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual(testData);
      
      // Cleanup
      await redisClient.del(testKey);
    });
    
    it('should handle setEx with expiration', async () => {
      if (!isRedisConnected) {
        console.log('Skipping Redis setEx test - Redis not available');
        return;
      }
      
      const testKey = 'test:expiry:xiaoshazi';
      const testValue = 'expiry-test';
      
      await redisClient.setEx(testKey, 10, testValue);
      const result = await redisClient.get(testKey);
      
      expect(result).toBe(testValue);
      
      // TTL should be around 10 seconds
      const ttl = await redisClient.ttl(testKey);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);
      
      // Cleanup
      await redisClient.del(testKey);
    });
    
    it('should check if key exists', async () => {
      if (!isRedisConnected) {
        console.log('Skipping Redis exists test - Redis not available');
        return;
      }
      
      const testKey = 'test:exists:xiaoshazi';
      
      // Key should not exist initially
      let exists = await redisClient.exists(testKey);
      expect(exists).toBe(0);
      
      // Set and check again
      await redisClient.set(testKey, 'value');
      exists = await redisClient.exists(testKey);
      expect(exists).toBe(1);
      
      // Cleanup
      await redisClient.del(testKey);
    });
    
    it('should delete keys', async () => {
      if (!isRedisConnected) {
        console.log('Skipping Redis del test - Redis not available');
        return;
      }
      
      const testKey = 'test:delete:xiaoshazi';
      
      await redisClient.set(testKey, 'value');
      let exists = await redisClient.exists(testKey);
      expect(exists).toBe(1);
      
      await redisClient.del(testKey);
      exists = await redisClient.exists(testKey);
      expect(exists).toBe(0);
    });
  });
  
  describe('Redis App Data', () => {
    it('should handle agent rankings data', async () => {
      if (!isRedisConnected) {
        console.log('Skipping agent rankings test - Redis not available');
        return;
      }
      
      const testKey = 'xiaoshazi:agent:rankings:test';
      const mockData = [
        { id: 'agent1', score: 100, name: 'Test Agent 1' },
        { id: 'agent2', score: 90, name: 'Test Agent 2' }
      ];
      
      await redisClient.setEx(testKey, 1800, JSON.stringify(mockData));
      const result = await redisClient.get(testKey);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual(mockData);
      
      // Cleanup
      await redisClient.del(testKey);
    });
  });
});
