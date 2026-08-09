/**
 * Developer Admin API Routes
 * Endpoints for secure developer access and media management
 */

const express = require('express');
const multer = require('multer');
const DeveloperAdminMode = require('./developer-admin-mode');

const router = express.Router();
const adminMode = new DeveloperAdminMode();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to check developer mode session
const checkDeveloperSession = (req, res, next) => {
  const token = req.headers['x-developer-token'];
  if (!adminMode.isSessionValid(token)) {
    return res.status(401).json({
      success: false,
      message: '❌ Unauthorized: Invalid or expired session'
    });
  }
  next();
};

/**
 * POST /api/developer/unlock
 * Unlock developer mode with access code
 */
router.post('/unlock', (req, res) => {
  const { accessCode } = req.body;
  const result = adminMode.unlock(accessCode);
  res.json(result);
});

/**
 * POST /api/developer/lock
 * Lock developer mode and cleanup temporary files
 */
router.post('/lock', checkDeveloperSession, (req, res) => {
  const result = adminMode.lock();
  res.json(result);
});

/**
 * POST /api/developer/upload
 * Upload image or video (saves to temporary location)
 */
router.post('/upload', checkDeveloperSession, upload.single('file'), async (req, res) => {
  const token = req.headers['x-developer-token'];
  const result = await adminMode.uploadMedia(req.file, {
    token,
    username: req.body.username || 'developer',
    ip: req.ip
  });
  res.json(result);
});

/**
 * POST /api/developer/save/:fileId
 * Save uploaded file permanently (cannot be removed)
 */
router.post('/save/:fileId', checkDeveloperSession, async (req, res) => {
  const token = req.headers['x-developer-token'];
  const result = await adminMode.savePermanently(req.params.fileId, {
    token,
    username: req.body.username || 'developer'
  });
  res.json(result);
});

/**
 * POST /api/developer/discard/:fileId
 * Discard temporary file (only unsaved files)
 */
router.post('/discard/:fileId', checkDeveloperSession, async (req, res) => {
  const token = req.headers['x-developer-token'];
  const result = await adminMode.discardFile(req.params.fileId, {
    token,
    username: req.body.username || 'developer'
  });
  res.json(result);
});

/**
 * GET /api/developer/media
 * Get all uploaded media with filters
 */
router.get('/media', checkDeveloperSession, (req, res) => {
  const filters = {};
  if (req.query.isPermanent !== undefined) {
    filters.isPermanent = req.query.isPermanent === 'true';
  }
  if (req.query.type) {
    filters.mimeType = req.query.type;
  }
  
  const media = adminMode.getMedia(filters);
  res.json({
    success: true,
    media,
    count: media.length
  });
});

/**
 * GET /api/developer/status
 * Get admin panel status
 */
router.get('/status', (req, res) => {
  const status = adminMode.getStatus();
  res.json({
    success: true,
    status
  });
});

/**
 * GET /api/developer/logs
 * Get audit log (with session verification)
 */
router.get('/logs', checkDeveloperSession, (req, res) => {
  const limit = req.query.limit || 100;
  const logs = adminMode.getAuditLog(parseInt(limit));
  res.json({
    success: true,
    logs,
    count: logs.length
  });
});

/**
 * GET /api/developer/get-code
 * Retrieve the generated access code (for first-time setup)
 * WARNING: Only call this once and save it securely!
 */
router.get('/get-code', (req, res) => {
  // In production, this should require additional authentication
  res.json({
    success: true,
    message: '⚠️ SAVE THIS CODE SECURELY - It will not be shown again',
    accessCode: adminMode.accessCode,
    warning: 'This code should be saved in a secure password manager'
  });
});

/**
 * GET /api/media/:fileId
 * Serve permanent media files (public endpoint)
 */
router.get('/media/:fileId', (req, res) => {
  const media = adminMode.uploadedMedia.find(m => m.id === req.params.fileId && m.isPermanent);
  if (!media) {
    return res.status(404).json({
      success: false,
      message: '❌ Media not found'
    });
  }
  
  res.sendFile(media.permanentPath);
});

module.exports = { router, adminMode };
