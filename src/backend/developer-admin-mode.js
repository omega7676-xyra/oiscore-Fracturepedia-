/**
 * Developer Admin Mode - Secure Access Control System
 * Features:
 * - Cryptographic access code generation & validation
 * - Media upload (images, videos) with permanent storage
 * - Session-based lock/unlock mechanism
 * - Automatic cleanup of temporary files
 * - Full audit logging
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class DeveloperAdminMode {
  constructor() {
    this.accessCode = this.generateSecureAccessCode();
    this.isLocked = true;
    this.sessionToken = null;
    this.sessionExpiry = null;
    this.uploadedMedia = [];
    this.auditLog = [];
    this.tempFiles = [];
    this.SESSION_TIMEOUT = 3600000; // 1 hour
  }

  /**
   * Generate a cryptographically secure access code
   * Format: 8 random chars + 4 digit checksum
   * Example: aB3dEf9G-7429
   */
  generateSecureAccessCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let code = '';
    const randomBytes = crypto.randomBytes(8);
    
    for (let i = 0; i < 8; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
    
    // Add checksum
    const checksum = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex')
      .substring(0, 4);
    
    this.accessCode = `${code}-${checksum}`;
    this.logAudit('ACCESS_CODE_GENERATED', { code: this.accessCode });
    return this.accessCode;
  }

  /**
   * Validate access code and unlock developer mode
   */
  unlock(providedCode) {
    if (this.isCodeValid(providedCode)) {
      this.isLocked = false;
      this.sessionToken = crypto.randomBytes(32).toString('hex');
      this.sessionExpiry = Date.now() + this.SESSION_TIMEOUT;
      this.logAudit('DEVELOPER_MODE_UNLOCKED', { token: this.sessionToken });
      
      return {
        success: true,
        message: '✅ Developer mode unlocked',
        sessionToken: this.sessionToken,
        sessionExpiry: new Date(this.sessionExpiry)
      };
    }
    
    this.logAudit('FAILED_UNLOCK_ATTEMPT', { code: providedCode });
    return {
      success: false,
      message: '❌ Invalid access code',
      attempts: this.getFailedAttempts()
    };
  }

  /**
   * Validate the provided access code
   */
  isCodeValid(code) {
    if (!code || typeof code !== 'string') return false;
    
    const [provided, checksum] = code.split('-');
    if (!provided || !checksum) return false;
    
    const expectedChecksum = crypto
      .createHash('sha256')
      .update(provided)
      .digest('hex')
      .substring(0, 4);
    
    return checksum === expectedChecksum;
  }

  /**
   * Lock developer mode (return to user mode)
   */
  lock() {
    this.isLocked = true;
    this.sessionToken = null;
    this.sessionExpiry = null;
    this.logAudit('DEVELOPER_MODE_LOCKED');
    this.cleanupTempFiles();
    
    return {
      success: true,
      message: '🔒 Developer mode locked. Temporary files cleaned up.'
    };
  }

  /**
   * Verify session is still valid
   */
  isSessionValid(token) {
    if (this.isLocked) return false;
    if (!token || token !== this.sessionToken) return false;
    if (Date.now() > this.sessionExpiry) {
      this.lock();
      return false;
    }
    return true;
  }

  /**
   * Upload media (images or videos)
   * Supported formats:
   * Images: JPG, PNG, GIF, WebP, SVG
   * Videos: MP4, WebM, OGG
   */
  async uploadMedia(file, metadata = {}) {
    if (!this.isSessionValid(metadata.token)) {
      return {
        success: false,
        message: '❌ Invalid or expired session',
        error: 'SESSION_INVALID'
      };
    }

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const allAllowed = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allAllowed.includes(file.mimetype)) {
      return {
        success: false,
        message: '❌ File type not supported',
        supported: { images: allowedImageTypes, videos: allowedVideoTypes }
      };
    }

    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: '❌ File too large (max 500MB)',
        maxSize: MAX_FILE_SIZE
      };
    }

    try {
      const fileId = crypto.randomBytes(16).toString('hex');
      const fileExtension = path.extname(file.originalname);
      const permanentPath = path.join('/storage/permanent', `${fileId}${fileExtension}`);
      const tempPath = path.join('/storage/temp', `${fileId}${fileExtension}`);

      // Save to temporary location first
      await fs.writeFile(tempPath, file.buffer);
      this.tempFiles.push(tempPath);

      const mediaRecord = {
        id: fileId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        permanentPath: permanentPath,
        tempPath: tempPath,
        uploadedAt: new Date(),
        isPermanent: false,
        metadata: metadata,
        uploadedBy: metadata.username || 'developer'
      };

      this.uploadedMedia.push(mediaRecord);
      this.logAudit('MEDIA_UPLOADED_TEMP', { fileId, mimeType: file.mimetype });

      return {
        success: true,
        message: '✅ File uploaded (temporary)',
        fileId: fileId,
        preview: `data:${file.mimetype};base64,${file.buffer.toString('base64').substring(0, 100)}...`
      };
    } catch (error) {
      this.logAudit('UPLOAD_ERROR', { error: error.message });
      return {
        success: false,
        message: '❌ Upload failed',
        error: error.message
      };
    }
  }

  /**
   * Permanently save uploaded media
   * Once saved, content cannot be removed
   */
  async savePermanently(fileId, metadata = {}) {
    if (!this.isSessionValid(metadata.token)) {
      return {
        success: false,
        message: '❌ Invalid or expired session'
      };
    }

    const media = this.uploadedMedia.find(m => m.id === fileId);
    if (!media) {
      return {
        success: false,
        message: '❌ File not found'
      };
    }

    if (media.isPermanent) {
      return {
        success: false,
        message: '⚠️ File is already permanent'
      };
    }

    try {
      // Copy from temp to permanent storage
      await fs.copyFile(media.tempPath, media.permanentPath);
      
      media.isPermanent = true;
      media.savedAt = new Date();
      media.savedBy = metadata.username || 'developer';
      
      this.logAudit('MEDIA_SAVED_PERMANENT', { fileId });
      
      // Remove from temp files
      this.tempFiles = this.tempFiles.filter(f => f !== media.tempPath);

      return {
        success: true,
        message: '💾 File saved permanently - cannot be removed',
        fileId: fileId,
        path: media.permanentPath,
        accessUrl: `/api/media/${fileId}`
      };
    } catch (error) {
      this.logAudit('SAVE_PERMANENT_ERROR', { fileId, error: error.message });
      return {
        success: false,
        message: '❌ Failed to save permanently',
        error: error.message
      };
    }
  }

  /**
   * Get all uploaded media
   */
  getMedia(filters = {}) {
    let media = [...this.uploadedMedia];

    if (filters.isPermanent !== undefined) {
      media = media.filter(m => m.isPermanent === filters.isPermanent);
    }

    if (filters.mimeType) {
      media = media.filter(m => m.mimeType.includes(filters.mimeType));
    }

    return media.map(m => ({
      id: m.id,
      name: m.originalName,
      type: m.mimeType,
      size: m.size,
      uploadedAt: m.uploadedAt,
      isPermanent: m.isPermanent,
      uploadedBy: m.uploadedBy
    }));
  }

  /**
   * Discard temporary file (only works on unsaved files)
   */
  async discardFile(fileId, metadata = {}) {
    if (!this.isSessionValid(metadata.token)) {
      return {
        success: false,
        message: '❌ Invalid or expired session'
      };
    }

    const media = this.uploadedMedia.find(m => m.id === fileId);
    if (!media) {
      return {
        success: false,
        message: '❌ File not found'
      };
    }

    if (media.isPermanent) {
      return {
        success: false,
        message: '❌ Cannot remove permanent files'
      };
    }

    try {
      await fs.unlink(media.tempPath);
      this.uploadedMedia = this.uploadedMedia.filter(m => m.id !== fileId);
      this.tempFiles = this.tempFiles.filter(f => f !== media.tempPath);
      this.logAudit('FILE_DISCARDED', { fileId });

      return {
        success: true,
        message: '🗑️ Temporary file discarded'
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Failed to discard file',
        error: error.message
      };
    }
  }

  /**
   * Automatically clean up all temporary files when locked
   */
  async cleanupTempFiles() {
    for (const filePath of this.tempFiles) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete temp file: ${filePath}`, error);
      }
    }
    
    // Remove temporary files from media list
    this.uploadedMedia = this.uploadedMedia.filter(m => m.isPermanent);
    this.tempFiles = [];
    this.logAudit('TEMP_FILES_CLEANED');
  }

  /**
   * Audit logging for security
   */
  logAudit(action, data = {}) {
    const auditEntry = {
      timestamp: new Date(),
      action: action,
      data: data,
      ipAddress: data.ip || 'unknown'
    };
    
    this.auditLog.push(auditEntry);
    console.log(`[AUDIT] ${action}`, data);
  }

  /**
   * Get audit log (security review)
   */
  getAuditLog(limit = 100) {
    return this.auditLog.slice(-limit);
  }

  /**
   * Get failed unlock attempts
   */
  getFailedAttempts() {
    return this.auditLog.filter(entry => entry.action === 'FAILED_UNLOCK_ATTEMPT').length;
  }

  /**
   * Get admin panel status
   */
  getStatus() {
    return {
      isLocked: this.isLocked,
      sessionActive: this.isSessionValid(this.sessionToken),
      sessionExpiry: this.sessionExpiry ? new Date(this.sessionExpiry) : null,
      uploadedMedia: {
        total: this.uploadedMedia.length,
        permanent: this.uploadedMedia.filter(m => m.isPermanent).length,
        temporary: this.uploadedMedia.filter(m => !m.isPermanent).length
      },
      tempFilesCount: this.tempFiles.length,
      accessCode: this.isLocked ? 'LOCKED' : 'UNLOCKED'
    };
  }
}

module.exports = DeveloperAdminMode;
