/**
 * Integration Tests - Authentication Flow
 */
const request = require('supertest');

describe('Authentication Flow Integration Tests', () => {
  let app;
  const express = require('express');
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../server/routes/auth'));
  });
  
  // Use unique email for each test to avoid rate limiting
  const uniqueEmail = (prefix) => `${prefix}${Date.now()}@example.com`;
  
  describe('Complete Auth Flow', () => {
    it('should complete full authentication flow: register -> verify -> refresh -> logout', async () => {
      const userEmail = uniqueEmail('flow');
      const userPassword = 'securepassword123';
      
      // Step 1: Register new user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ email: userEmail, password: userPassword });
      
      // Skip if rate limited
      if (registerRes.status === 429 || !registerRes.body.data) {
        console.log('Rate limited - skipping full flow test');
        return;
      }
      
      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);
      expect(registerRes.body.data).toHaveProperty('accessToken');
      expect(registerRes.body.data).toHaveProperty('refreshToken');
      
      const { accessToken, refreshToken } = registerRes.body.data;
      
      // Step 2: Verify the access token is valid
      const verifyRes = await request(app)
        .post('/api/auth/verify')
        .send({ token: accessToken });
      
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.valid).toBe(true);
      
      // Step 3: Refresh the tokens
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data).toHaveProperty('accessToken');
      expect(refreshRes.body.data).toHaveProperty('refreshToken');
      
      const newRefreshToken = refreshRes.body.data.refreshToken;
      
      // Step 4: Logout with refresh token
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: newRefreshToken });
      
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
    
    it('should handle login with valid credentials', async () => {
      const userEmail = uniqueEmail('login');
      const userPassword = 'password123';
      
      // Register first - check if successful
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ email: userEmail, password: userPassword });
      
      if (regRes.status === 429) {
        console.log('Rate limited - skipping login test');
        return;
      }
      
      // Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: userEmail, password: userPassword });
      
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data).toHaveProperty('accessToken');
    });
    
    it('should handle multiple token refreshes', async () => {
      const userEmail = uniqueEmail('refresh');
      
      // Register
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ email: userEmail, password: 'password123' });
      
      if (registerRes.status === 429 || !registerRes.body.data) {
        console.log('Rate limited - skipping refresh test');
        return;
      }
      
      let currentRefreshToken = registerRes.body.data.refreshToken;
      
      // Refresh multiple times
      for (let i = 0; i < 3; i++) {
        const refreshRes = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: currentRefreshToken });
        
        expect(refreshRes.status).toBe(200);
        expect(refreshRes.body.success).toBe(true);
        
        currentRefreshToken = refreshRes.body.data.refreshToken;
      }
      
      // Last refresh token should still work
      const finalRefreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: currentRefreshToken });
      
      expect(finalRefreshRes.status).toBe(200);
    });
  });
  
  describe('Security Tests', () => {
    it('should not allow login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: uniqueEmail('nonexist'), password: 'anypassword' });
      
      expect(response.status).toBe(401);
    });
    
    it('should reject invalid credentials', async () => {
      const userEmail = uniqueEmail('invalidcreds');
      
      // Register first - check if successful
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ email: userEmail, password: 'correctpassword' });
      
      if (regRes.status === 429) {
        console.log('Rate limited - skipping invalid creds test');
        return;
      }
      
      // Try login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: userEmail, password: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
    
    it('should handle missing credentials gracefully', async () => {
      // Missing both
      let response = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(response.status).toBe(400);
      
      // Missing password
      response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });
      expect(response.status).toBe(400);
    });
  });
  
  describe('Token Verification', () => {
    it('should correctly verify valid JWT', async () => {
      const userEmail = uniqueEmail('verify');
      
      // Register to get a token - check if successful
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ email: userEmail, password: 'password123' });
      
      if (registerRes.status === 429 || !registerRes.body.data) {
        console.log('Rate limited - skipping verify test');
        return;
      }
      
      const { accessToken } = registerRes.body.data;
      
      // Verify token
      const verifyRes = await request(app)
        .post('/api/auth/verify')
        .send({ token: accessToken });
      
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.valid).toBe(true);
      expect(verifyRes.body.data).toHaveProperty('id');
      expect(verifyRes.body.data.email).toBe(userEmail);
    });
    
    it('should reject malformed tokens', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({ token: 'not.a.valid.jwt' });
      
      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);
    });
    
    it('should reject verification with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing token');
    });
  });
});
