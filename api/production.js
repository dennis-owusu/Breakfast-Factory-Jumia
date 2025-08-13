// This script sets NODE_ENV to production and starts the server

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

// Start the server
console.log('Starting server in production mode...');

// Import the main server file (using dynamic import for ES modules)
import('./index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});