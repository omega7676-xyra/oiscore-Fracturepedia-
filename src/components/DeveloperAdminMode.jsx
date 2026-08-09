import React, { useState, useRef, useEffect } from 'react';
import './DeveloperAdminMode.css';

/**
 * Developer Admin Mode UI
 * Secure interface for uploading and managing permanent media
 * Features:
 * - Access code validation
 * - Image & video upload
 * - Temporary & permanent file management
 * - Session timeout
 * - Audit logging
 */

const DeveloperAdminMode = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [sessionToken, setSessionToken] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [tempFiles, setTempFiles] = useState([]);
  const [permanentFiles, setPermanentFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const fileInputRef = useRef(null);
  const sessionTimerRef = useRef(null);

  // Session timer effect
  useEffect(() => {
    if (sessionExpiry && !isLocked) {
      sessionTimerRef.current = setInterval(() => {
        const timeLeft = sessionExpiry - Date.now();
        if (timeLeft <= 0) {
          handleLock();
          setError('⏰ Session expired. Developer mode locked.');
        }
      }, 1000);
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [sessionExpiry, isLocked]);

  /**
   * Unlock developer mode with access code
   */
  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/developer/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode })
      });

      const data = await response.json();

      if (data.success) {
        setIsLocked(false);
        setSessionToken(data.sessionToken);
        setSessionExpiry(new Date(data.sessionExpiry).getTime());
        setSuccess('🔓 ' + data.message);
        setAccessCode('');
        loadMediaFiles(data.sessionToken);
      } else {
        setError('❌ ' + data.message);
      }
    } catch (err) {
      setError('❌ Connection error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lock developer mode
   */
  const handleLock = async () => {
    if (!sessionToken) return;

    setLoading(true);
    try {
      const response = await fetch('/api/developer/lock', {
        method: 'POST',
        headers: {
          'x-developer-token': sessionToken,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setIsLocked(true);
      setSessionToken(null);
      setSessionExpiry(null);
      setTempFiles([]);
      setPermanentFiles([]);
      setUploadedFiles([]);
      setSuccess('🔒 ' + data.message);
    } catch (err) {
      setError('❌ Lock failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load uploaded media files
   */
  const loadMediaFiles = async (token) => {
    try {
      const response = await fetch('/api/developer/media', {
        headers: { 'x-developer-token': token }
      });

      const data = await response.json();
      if (data.success) {
        const temp = data.media.filter(m => !m.isPermanent);
        const permanent = data.media.filter(m => m.isPermanent);
        setTempFiles(temp);
        setPermanentFiles(permanent);
        setUploadedFiles(data.media);
      }
    } catch (err) {
      console.error('Failed to load media:', err);
    }
  };

  /**
   * Handle file selection and upload
   */
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!sessionToken) {
      setError('❌ No active session');
      return;
    }

    for (const file of files) {
      await uploadFile(file);
    }
  };

  /**
   * Upload file to server
   */
  const uploadFile = async (file) => {
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', 'developer');

    try {
      const response = await fetch('/api/developer/upload', {
        method: 'POST',
        headers: { 'x-developer-token': sessionToken },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('✅ ' + data.message);
        // Add to temp files
        setTempFiles([...tempFiles, {
          id: data.fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          isPermanent: false
        }]);
        setFilePreview(data.preview);
      } else {
        setError('❌ ' + data.message);
      }
    } catch (err) {
      setError('❌ Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save file permanently
   */
  const handleSavePermanently = async (fileId) => {
    if (!sessionToken) {
      setError('❌ No active session');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/developer/save/${fileId}`, {
        method: 'POST',
        headers: {
          'x-developer-token': sessionToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: 'developer' })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('💾 ' + data.message);
        // Move from temp to permanent
        const file = tempFiles.find(f => f.id === fileId);
        if (file) {
          file.isPermanent = true;
          setTempFiles(tempFiles.filter(f => f.id !== fileId));
          setPermanentFiles([...permanentFiles, file]);
        }
      } else {
        setError('❌ ' + data.message);
      }
    } catch (err) {
      setError('❌ Save failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Discard temporary file
   */
  const handleDiscardFile = async (fileId) => {
    if (!sessionToken) return;

    if (!window.confirm('⚠️ Are you sure? This file will be permanently deleted.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/developer/discard/${fileId}`, {
        method: 'POST',
        headers: {
          'x-developer-token': sessionToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: 'developer' })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('🗑️ ' + data.message);
        setTempFiles(tempFiles.filter(f => f.id !== fileId));
      } else {
        setError('❌ ' + data.message);
      }
    } catch (err) {
      setError('❌ Discard failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Get time remaining in session
   */
  const getTimeRemaining = () => {
    if (!sessionExpiry) return 'No session';
    const timeLeft = sessionExpiry - Date.now();
    if (timeLeft <= 0) return 'Expired';
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (isLocked) {
    return (
      <div className="admin-container locked">
        <div className="lock-screen">
          <div className="lock-icon">🔒</div>
          <h1>Developer Admin Mode</h1>
          <p>Enter access code to continue</p>

          <form onSubmit={handleUnlock} className="unlock-form">
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code..."
              className="access-code-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="unlock-btn"
              disabled={loading || !accessCode.trim()}
            >
              {loading ? '⏳ Validating...' : '🔓 Unlock'}
            </button>
          </form>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container unlocked">
      <div className="admin-header">
        <h1>🔓 Developer Admin Panel</h1>
        <div className="session-info">
          <span className="session-timer">⏱️ {getTimeRemaining()}</span>
          <button className="lock-btn" onClick={handleLock} disabled={loading}>
            🔒 Lock
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Upload Section */}
        <section className="upload-section">
          <h2>📤 Upload Media</h2>
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="file-input"
              disabled={loading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
              disabled={loading}
            >
              {loading ? '⏳ Uploading...' : '📁 Select Files'}
            </button>
            <p className="upload-hint">Drag and drop or click to select images and videos</p>
            <p className="format-hint">Supported: JPG, PNG, GIF, WebP (images) • MP4, WebM, OGG (videos)</p>
          </div>
        </section>

        {/* Temporary Files Section */}
        {tempFiles.length > 0 && (
          <section className="files-section temporary">
            <h2>📝 Temporary Files ({tempFiles.length})</h2>
            <p className="temp-notice">⚠️ These files will be deleted when you lock. Save them to make permanent.</p>
            <div className="files-grid">
              {tempFiles.map((file) => (
                <div key={file.id} className="file-card temporary">
                  <div className="file-icon">
                    {file.type.startsWith('image') ? '🖼️' : '🎬'}
                  </div>
                  <h3 className="file-name" title={file.name}>{file.name}</h3>
                  <p className="file-size">{formatFileSize(file.size)}</p>
                  <p className="file-status">🟡 Temporary</p>
                  <div className="file-actions">
                    <button
                      className="btn btn-save"
                      onClick={() => handleSavePermanently(file.id)}
                      disabled={loading}
                      title="Save this file permanently (cannot be removed)"
                    >
                      💾 Save Permanent
                    </button>
                    <button
                      className="btn btn-discard"
                      onClick={() => handleDiscardFile(file.id)}
                      disabled={loading}
                      title="Delete this temporary file"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Permanent Files Section */}
        {permanentFiles.length > 0 && (
          <section className="files-section permanent">
            <h2>✅ Permanent Files ({permanentFiles.length})</h2>
            <p className="permanent-notice">✓ These files are permanently saved and cannot be removed.</p>
            <div className="files-grid">
              {permanentFiles.map((file) => (
                <div key={file.id} className="file-card permanent">
                  <div className="file-icon">
                    {file.type.startsWith('image') ? '🖼️' : '🎬'}
                  </div>
                  <h3 className="file-name" title={file.name}>{file.name}</h3>
                  <p className="file-size">{formatFileSize(file.size)}</p>
                  <p className="file-status">🟢 Permanent</p>
                  <button
                    className="btn btn-view"
                    onClick={() => window.open(`/api/media/${file.id}`)}
                  >
                    👁️ View
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
    </div>
  );
};

export default DeveloperAdminMode;
