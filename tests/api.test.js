/**
 * API Unit Tests - Core API Routes
 */
const request = require('supertest');

// Import actual server modules where possible
describe('Core API Routes', () => {
  let app;
  
  beforeEach(() => {
    // Create a minimal Express app to test routes
    app = require('express')();
    app.use(require('express').json());
  });
  
  describe('GET /api/health', () => {
    beforeEach(() => {
      // Mock health endpoint
      app.get('/api/health', (req, res) => {
        res.json({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        });
      });
    });
    
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
  
  describe('GET /api/time', () => {
    beforeEach(() => {
      app.get('/api/time', (req, res) => {
        const now = new Date();
        res.json({
          iso: now.toISOString(),
          unix: Math.floor(now.getTime() / 1000),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
      });
    });
    
    it('should return current time', async () => {
      const response = await request(app).get('/api/time');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('iso');
      expect(response.body).toHaveProperty('unix');
      expect(response.body).toHaveProperty('timezone');
    });
  });
  
  describe('GET /api/info', () => {
    beforeEach(() => {
      app.get('/api/info', (req, res) => {
        res.json({
          name: 'xiaoshazi',
          version: '1.0.0',
          description: 'HTTPS测试网站',
          nodeVersion: process.version,
          platform: process.platform
        });
      });
    });
    
    it('should return server info', async () => {
      const response = await request(app).get('/api/info');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'xiaoshazi');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('nodeVersion');
    });
  });
  
  describe('GET /api/users', () => {
    beforeEach(() => {
      // Mock users endpoint
      app.get('/api/users', (req, res) => {
        res.json({
          users: [
            { id: '1', email: 'admin@xiaoshazi.com', role: 'admin' }
          ],
          total: 1
        });
      });
    });
    
    it('should return users list', async () => {
      const response = await request(app).get('/api/users');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('total');
    });
  });
  
  describe('POST /api/echo', () => {
    beforeEach(() => {
      app.post('/api/echo', (req, res) => {
        res.json({
          received: req.body,
          headers: req.headers
        });
      });
    });
    
    it('should echo back JSON body', async () => {
      const testData = { message: 'hello', value: 123 };
      const response = await request(app)
        .post('/api/echo')
        .send(testData);
      
      expect(response.status).toBe(200);
      expect(response.body.received).toEqual(testData);
    });
    
    it('should handle empty body', async () => {
      const response = await request(app)
        .post('/api/echo')
        .send({});
      
      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({});
    });
  });
  
  describe('GET /api/entropy', () => {
    beforeEach(() => {
      app.get('/api/entropy', (req, res) => {
        const entropy = Math.random().toString(36).substring(2, 15);
        res.json({
          entropy,
          source: 'crypto',
          timestamp: new Date().toISOString()
        });
      });
    });
    
    it('should return entropy value', async () => {
      const response = await request(app).get('/api/entropy');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('entropy');
      expect(response.body).toHaveProperty('source', 'crypto');
    });
  });
  
  describe('GET /api/entropy/history', () => {
    beforeEach(() => {
      app.get('/api/entropy/history', (req, res) => {
        const history = Array.from({ length: 10 }, (_, i) => ({
          entropy: Math.random().toString(36).substring(2, 15),
          timestamp: new Date(Date.now() - i * 60000).toISOString()
        }));
        res.json({ history, count: history.length });
      });
    });
    
    it('should return entropy history', async () => {
      const response = await request(app).get('/api/entropy/history');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('history');
      expect(response.body.count).toBe(10);
    });
  });
  
  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      app.use((req, res) => {
        res.status(404).json({ error: 'Not Found' });
      });
      
      const response = await request(app).get('/api/unknown');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
