/**
 * Test Helper - Creates a test app instance
 */
const express = require('express');
const cors = require('cors');
const compression = require('compression');

// Create a minimal test app that mimics server.js setup
function createTestApp() {
  const app = express();
  
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Test routes will be added
  
  return app;
}

module.exports = { createTestApp };
