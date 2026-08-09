# 🔐 Developer Admin Mode - Setup & Integration Guide

## Overview

The Developer Admin Mode is a secure, access-controlled interface that allows developers to:
- Upload images and videos
- Save content permanently (immutable storage)
- Manage temporary files (auto-cleanup on logout)
- Access audit logs
- Control session with automatic timeouts

## 🔑 Key Features

### Security
- **Cryptographic Access Codes**: SHA-256 validated 12-character codes
- **Session Tokens**: 32-byte random tokens with 1-hour expiry
- **Audit Logging**: Complete access history
- **Auto-Cleanup**: Temporary files deleted when mode is locked

### Media Management
- **Supported Images**: JPG, PNG, GIF, WebP, SVG
- **Supported Videos**: MP4, WebM, OGG
- **Max File Size**: 500MB per file
- **Permanent Storage**: Immutable once saved

### Session Management
- **Timeout**: 1 hour of inactivity
- **Session Token**: Cryptographically secure
- **Real-time Timer**: Shows remaining session time
- **Auto-Lock**: Automatic logout on expiry

---

## 📦 Installation

### 1. Install Dependencies

```bash
npm install express multer crypto fs path
```

### 2. Add to Server (server.js or index.js)

```javascript
const express = require('express');
const { router: developerRouter, adminMode } = require('./src/backend/developer-api');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Developer Admin Routes
app.use('/api/developer', developerRouter);

// Serve permanent media files
app.get('/api/media/:fileId', (req, res) => {
  const media = adminMode.uploadedMedia.find(
    m => m.id === req.params.fileId && m.isPermanent
  );
  if (!media) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(media.permanentPath);
});

// Create storage directories
const fs = require('fs').promises;
(async () => {
  await fs.mkdir('/storage/permanent', { recursive: true });
  await fs.mkdir('/storage/temp', { recursive: true });
})();

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📋 Access developer admin mode at /admin');
  console.log('🔐 Developer access code:', adminMode.accessCode);
});
```

### 3. Add Frontend Component to App

```jsx
import DeveloperAdminMode from './components/DeveloperAdminMode';

function App() {
  return (
    <Routes>
      {/* Your other routes */}
      <Route path="/admin" element={<DeveloperAdminMode />} />
    </Routes>
  );
}
```

---

## 🚀 First Time Setup

### Step 1: Get Your Access Code

When the server starts, the access code is displayed:

```
🔐 Developer access code: aB3dEf9G-7429
```

**⚠️ IMPORTANT**: Save this code securely in a password manager. It will not be shown again.

Or retrieve it programmatically:

```javascript
const code = adminMode.accessCode;
console.log('Access code:', code);
```

### Step 2: Access Admin Panel

1. Navigate to: `http://localhost:3000/admin`
2. Enter your access code
3. Click "🔓 Unlock"

### Step 3: Start Managing Media

You're now in Developer Mode with a 1-hour session.

---

## 📊 API Endpoints

### Authentication

#### POST `/api/developer/unlock`
Unlock developer mode with access code

```bash
curl -X POST http://localhost:3000/api/developer/unlock \
  -H "Content-Type: application/json" \
  -d '{"accessCode": "aB3dEf9G-7429"}'
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Developer mode unlocked",
  "sessionToken": "a1b2c3d4...",
  "sessionExpiry": "2026-08-09T19:13:20.000Z"
}
```

#### POST `/api/developer/lock`
Lock developer mode and cleanup temp files

```bash
curl -X POST http://localhost:3000/api/developer/lock \
  -H "x-developer-token: a1b2c3d4..."
```

### Media Upload

#### POST `/api/developer/upload`
Upload image or video (temporary)

```bash
curl -X POST http://localhost:3000/api/developer/upload \
  -H "x-developer-token: a1b2c3d4..." \
  -F "file=@image.jpg" \
  -F "username=developer"
```

**Response:**
```json
{
  "success": true,
  "message": "✅ File uploaded (temporary)",
  "fileId": "a1b2c3d4e5f6...",
  "preview": "data:image/jpeg;base64,..."
}
```

#### POST `/api/developer/save/:fileId`
Save file permanently (cannot be removed)

```bash
curl -X POST http://localhost:3000/api/developer/save/a1b2c3d4e5f6 \
  -H "x-developer-token: a1b2c3d4..."
```

**Response:**
```json
{
  "success": true,
  "message": "💾 File saved permanently - cannot be removed",
  "fileId": "a1b2c3d4e5f6",
  "path": "/storage/permanent/a1b2c3d4e5f6.jpg",
  "accessUrl": "/api/media/a1b2c3d4e5f6"
}
```

#### POST `/api/developer/discard/:fileId`
Discard temporary file

```bash
curl -X POST http://localhost:3000/api/developer/discard/a1b2c3d4e5f6 \
  -H "x-developer-token: a1b2c3d4..."
```

### Media Management

#### GET `/api/developer/media`
Get uploaded media with filters

```bash
curl http://localhost:3000/api/developer/media \
  -H "x-developer-token: a1b2c3d4..."
```

**Query Parameters:**
- `isPermanent=true` - Only permanent files
- `isPermanent=false` - Only temporary files
- `type=image` - Only images
- `type=video` - Only videos

#### GET `/api/developer/status`
Get admin panel status

```bash
curl http://localhost:3000/api/developer/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "isLocked": false,
    "sessionActive": true,
    "sessionExpiry": "2026-08-09T19:13:20.000Z",
    "uploadedMedia": {
      "total": 5,
      "permanent": 3,
      "temporary": 2
    },
    "tempFilesCount": 2
  }
}
```

#### GET `/api/developer/logs`
Get audit log

```bash
curl http://localhost:3000/api/developer/logs \
  -H "x-developer-token: a1b2c3d4..."
```

#### GET `/api/media/:fileId`
Serve permanent media file (public)

```bash
curl http://localhost:3000/api/media/a1b2c3d4e5f6 > image.jpg
```

---

## 🔒 Security Best Practices

### 1. Protect Your Access Code
- ✅ Store in secure password manager
- ✅ Change periodically
- ❌ Don't share via email/chat
- ❌ Don't commit to git

### 2. Session Management
- Sessions expire after 1 hour
- Always lock when done
- Audit log tracks all actions

### 3. Permanent Files
- Cannot be deleted once saved
- Backup before saving
- Use meaningful filenames

### 4. Monitoring
- Check audit logs regularly
- Monitor failed unlock attempts
- Review upload history

---

## 📝 Workflow Example

```javascript
// 1. Initialize (server startup)
const adminMode = new DeveloperAdminMode();
console.log('Access code:', adminMode.accessCode);

// 2. Unlock (frontend)
const unlock = await fetch('/api/developer/unlock', {
  method: 'POST',
  body: JSON.stringify({ accessCode: 'aB3dEf9G-7429' })
});
const { sessionToken } = await unlock.json();

// 3. Upload file (frontend)
const upload = await fetch('/api/developer/upload', {
  method: 'POST',
  headers: { 'x-developer-token': sessionToken },
  body: formData // file upload
});
const { fileId } = await upload.json();

// 4. Save permanently (frontend)
const save = await fetch(`/api/developer/save/${fileId}`, {
  method: 'POST',
  headers: { 'x-developer-token': sessionToken }
});
const { accessUrl } = await save.json();

// 5. Access file (anytime)
const file = await fetch(accessUrl);
const blob = await file.blob();

// 6. Lock (frontend)
await fetch('/api/developer/lock', {
  method: 'POST',
  headers: { 'x-developer-token': sessionToken }
});
// Temp files auto-cleaned
```

---

## 🐛 Troubleshooting

### Invalid Access Code
- Check for typos (case-sensitive)
- Verify the entire code including checksum
- Get a new code if lost

### Session Expired
- Session lasts 1 hour
- Unlock again with access code
- Check admin panel status

### Upload Failed
- Check file size (max 500MB)
- Verify file type is supported
- Check server storage permissions

### Files Not Showing
- Ensure session is valid
- Check `isPermanent` filter
- Review audit logs

---

## 📊 Audit Log Format

Each audit entry contains:

```json
{
  "timestamp": "2026-08-09T18:13:20.000Z",
  "action": "MEDIA_UPLOADED_TEMP",
  "data": {
    "fileId": "a1b2c3d4e5f6...",
    "mimeType": "image/jpeg"
  },
  "ipAddress": "192.168.1.1"
}
```

### Audit Actions
- `ACCESS_CODE_GENERATED` - New code created
- `DEVELOPER_MODE_UNLOCKED` - Mode unlocked
- `DEVELOPER_MODE_LOCKED` - Mode locked
- `MEDIA_UPLOADED_TEMP` - File uploaded (temp)
- `MEDIA_SAVED_PERMANENT` - File saved (permanent)
- `FILE_DISCARDED` - Temp file deleted
- `TEMP_FILES_CLEANED` - All temp files cleaned
- `FAILED_UNLOCK_ATTEMPT` - Invalid code attempt

---

## 🎯 Production Deployment

### Environment Variables

```bash
# .env
ADMIN_MODE_SESSION_TIMEOUT=3600000
STORAGE_PATH=/data/storage
MAX_FILE_SIZE=524288000
ALLOWED_FILE_TYPES=image/*,video/*
```

### Nginx Configuration

```nginx
server {
  location /api/developer {
    proxy_pass http://localhost:3000;
    # Rate limiting
    limit_req zone=api burst=10 nodelay;
  }
  
  location /api/media {
    proxy_pass http://localhost:3000;
    # Caching for permanent files
    expires 365d;
  }
}
```

### Database Integration

For production, store media metadata in database:

```javascript
// Option: Use MongoDB/PostgreSQL instead of in-memory storage
await db.media.insertOne({
  fileId: 'a1b2c3d4...',
  originalName: 'image.jpg',
  mimeType: 'image/jpeg',
  size: 2048000,
  isPermanent: true,
  savedAt: new Date(),
  path: '/storage/permanent/a1b2c3d4.jpg'
});
```

---

## 📞 Support

For issues or questions:
1. Check audit logs
2. Review error messages
3. Check server logs
4. Contact development team

---

**Made with ❤️ for Fracturepedia**
