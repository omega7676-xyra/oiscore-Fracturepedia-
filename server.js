/**
 * Server Integration Example
 * Add this to your main server file (server.js or index.js)
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { router: developerRouter, adminMode } = require('./src/backend/developer-api');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// CORS (if needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-developer-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// ==================== STORAGE SETUP ====================

// Create required directories
async function initializeStorage() {
  try {
    await fs.mkdir('/storage/permanent', { recursive: true });
    await fs.mkdir('/storage/temp', { recursive: true });
    console.log('✅ Storage directories initialized');
  } catch (error) {
    console.error('❌ Failed to initialize storage:', error);
  }
}

// ==================== API ROUTES ====================

// Developer Admin API
app.use('/api/developer', developerRouter);

// Serve permanent media files (public endpoint)
app.get('/api/media/:fileId', (req, res) => {
  const media = adminMode.uploadedMedia.find(
    m => m.id === req.params.fileId && m.isPermanent
  );
  
  if (!media) {
    return res.status(404).json({
      success: false,
      message: '❌ Media not found'
    });
  }
  
  // Set cache headers for permanent files
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(media.permanentPath);
});

// Admin panel page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    adminMode: {
      isLocked: adminMode.isLocked,
      sessionActive: adminMode.isSessionValid(adminMode.sessionToken)
    }
  });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    // Initialize storage
    await initializeStorage();
    
    // Generate and log access code
    const accessCode = adminMode.accessCode;
    console.log('\n' +
      '╔═══════════════════════════════════════╗\n' +
      '║  🔐 DEVELOPER ADMIN MODE INITIALIZED   ║\n' +
      '╠═══════════════════════════════════════╣\n' +
      `║  Access Code: ${accessCode.padEnd(26)}  ║\n` +
      '║  ⚠️  SAVE THIS CODE SECURELY           ║\n' +
      '║  It will not be shown again           ║\n' +
      '╠═══════════════════════════════════════╣\n' +
      `║  Admin URL: http://localhost:${PORT}/admin${' '.repeat(7)}║\n` +
      `║  API Base: http://localhost:${PORT}/api/developer║\n` +
      '╠═══════════════════════════════════════╣\n' +
      '║  📂 Storage Directories:               ║\n' +
      '║  - /storage/permanent (immutable)    ║\n' +
      '║  - /storage/temp (auto-cleaned)     ║\n' +
      '╚═══════════════════════════════════════╝\n'
    );
    
    // Start server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📋 Visit http://localhost:${PORT}/admin to access developer mode\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ==================== GRACEFUL SHUTDOWN ====================

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  try {
    // Lock admin mode and cleanup
    adminMode.lock();
    console.log('✅ Admin mode locked and cleaned up');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
  process.exit(0);
});

// ==================== EXPORT ====================

if (require.main === module) {
  startServer();
}

module.exports = { app, adminMode, startServer };
