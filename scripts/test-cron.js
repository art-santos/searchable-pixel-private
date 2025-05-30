#!/usr/bin/env node

// Test script for cron job endpoint
// Usage: node scripts/test-cron.js

const https = require('https');
const http = require('http');

const isDev = process.argv.includes('--dev');
const token = process.env.CRON_SECRET_TOKEN || 'your-token-here';

const options = {
  hostname: isDev ? 'localhost' : 'your-production-domain.com',
  port: isDev ? 3000 : 443,
  path: '/api/cron/reset-usage',
  method: isDev ? 'GET' : 'POST', // GET allowed in dev
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const protocol = isDev ? http : https;

console.log(`Testing cron endpoint at ${options.hostname}:${options.port}${options.path}`);
console.log(`Using ${options.method} method`);

const req = protocol.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Cron job executed successfully!');
    } else {
      console.log('❌ Cron job failed');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end(); 