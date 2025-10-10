require('dotenv').config();
// Phone Scanner Server - Enables phone camera scanning for desktop
const express = require('express');
// WebSocket import removed - not currently used
const multer = require('multer');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');
const { Server } = require('socket.io');

class PhoneScannerServer {
  constructor(mainWindow, port = 3785) {
    this.mainWindow = mainWindow;
    this.port = port;
    this.app = express();
    this.connections = new Map();
    this.activeSessions = new Map();
    this.pendingScans = new Map();

    // Generate unique device ID for this desktop
    this.deviceId = this.generateDeviceId();

    // Setup express middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();

    // Setup WebSocket
    this.setupWebSocket();

    // Generate SSL certificate for HTTPS (required for camera access)
    this.sslOptions = this.generateSSLCertificate();
  }

  generateDeviceId() {
    const machineId = crypto
      .createHash('sha256')
      .update(os.hostname() + os.platform() + os.cpus()[0].model)
      .digest('hex')
      .substring(0, 12);
    return machineId;
  }

  generateSSLCertificate() {
    // For production, use proper SSL certificates
    // For development, we'll use self-signed certificates
    try {
      const forge = require('node-forge');
      const pki = forge.pki;

      // Generate key pair
      const keys = pki.rsa.generateKeyPair(2048);
      const cert = pki.createCertificate();

      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

      const attrs = [
        {
          name: 'commonName',
          value: 'localhost',
        },
        {
          name: 'organizationName',
          value: 'Mic Browser',
        },
      ];

      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      cert.sign(keys.privateKey);

      return {
        key: pki.privateKeyToPem(keys.privateKey),
        cert: pki.certificateToPem(cert),
      };
    } catch (error) {
      console.log('SSL generation failed, using HTTP:', error);
      return null;
    }
  }

  setupMiddleware() {
    // Serve static files (mobile interface)
    this.app.use(express.static(path.join(__dirname, 'mobile-scanner')));

    // Parse JSON bodies
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // CORS for mobile access
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // File upload handling
    const storage = multer.memoryStorage();
    this.upload = multer({
      storage: storage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'active',
        deviceId: this.deviceId,
        sessions: this.activeSessions.size,
      });
    });

    // Generate QR code for mobile connection
    this.app.get('/qr-code', async (req, res) => {
      try {
        const sessionToken = this.generateSessionToken();
        const connectionUrl = await this.getConnectionUrl(sessionToken);

        const qrCodeDataUrl = await QRCode.toDataURL(connectionUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#667eea',
            light: '#ffffff',
          },
        });

        res.json({
          qrCode: qrCodeDataUrl,
          url: connectionUrl,
          token: sessionToken,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Mobile scanner interface
    this.app.get('/scan/:token', (req, res) => {
      const token = req.params.token;

      if (!this.activeSessions.has(token)) {
        // Create new session
        this.activeSessions.set(token, {
          created: Date.now(),
          deviceInfo: req.headers['user-agent'],
          connected: false,
        });
      }

      // Serve mobile scanner HTML
      res.send(this.getMobileScannerHTML(token));
    });

    // Receive scanned image from phone
    this.app.post('/upload/:token', this.upload.single('image'), async (req, res) => {
      try {
        const token = req.params.token;
        const session = this.activeSessions.get(token);

        if (!session) {
          return res.status(401).json({ error: 'Invalid session' });
        }

        const imageData = req.file.buffer;
        const metadata = {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          timestamp: Date.now(),
          deviceInfo: session.deviceInfo,
          documentType: req.body.documentType || 'auto',
        };

        // Save temporarily
        const tempPath = path.join(os.tmpdir(), `scan_${Date.now()}_${req.file.originalname}`);
        fs.writeFileSync(tempPath, imageData);

        // Send to main window for processing
        this.mainWindow.webContents.send('phone-scan-received', {
          path: tempPath,
          metadata: metadata,
          imageData: imageData.toString('base64'),
        });

        // Store for retrieval
        this.pendingScans.set(token, {
          path: tempPath,
          metadata: metadata,
        });

        res.json({
          success: true,
          message: 'Image received and processing',
          scanId: token,
        });

        // Notify via WebSocket if connected
        if (this.io) {
          this.io.to(token).emit('scan-complete', {
            status: 'success',
            metadata: metadata,
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get scan status
    this.app.get('/status/:token', (req, res) => {
      const token = req.params.token;
      const session = this.activeSessions.get(token);
      const pendingScan = this.pendingScans.get(token);

      res.json({
        connected: session ? session.connected : false,
        hasPendingScan: !!pendingScan,
        sessionActive: !!session,
      });
    });

    // Batch upload support
    this.app.post('/batch-upload/:token', this.upload.array('images', 10), async (req, res) => {
      try {
        const token = req.params.token;
        const session = this.activeSessions.get(token);

        if (!session) {
          return res.status(401).json({ error: 'Invalid session' });
        }

        const results = [];
        for (const file of req.files) {
          const tempPath = path.join(os.tmpdir(), `batch_${Date.now()}_${file.originalname}`);
          fs.writeFileSync(tempPath, file.buffer);

          results.push({
            path: tempPath,
            originalName: file.originalname,
            size: file.size,
          });
        }

        // Send batch to main window
        this.mainWindow.webContents.send('phone-batch-scan', {
          files: results,
          count: results.length,
        });

        res.json({
          success: true,
          processed: results.length,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupWebSocket() {
    // Create HTTP/HTTPS server based on SSL availability
    if (this.sslOptions) {
      this.server = https.createServer(this.sslOptions, this.app);
    } else {
      this.server = http.createServer(this.app);
    }

    // Setup Socket.IO for real-time communication
    this.io = new Server(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log('Mobile device connected:', socket.id);

      socket.on('authenticate', (token) => {
        const session = this.activeSessions.get(token);
        if (session) {
          session.connected = true;
          session.socketId = socket.id;
          socket.join(token);

          socket.emit('authenticated', {
            deviceId: this.deviceId,
            desktopName: os.hostname(),
          });

          // Notify desktop
          this.mainWindow.webContents.send('phone-connected', {
            token: token,
            deviceInfo: session.deviceInfo,
          });
        }
      });

      socket.on('camera-stream', (data) => {
        // Handle live camera stream for real-time scanning
        this.mainWindow.webContents.send('phone-camera-frame', data);
      });

      socket.on('disconnect', () => {
        console.log('Mobile device disconnected:', socket.id);

        // Find and update session
        for (const [token, session] of this.activeSessions) {
          if (session.socketId === socket.id) {
            session.connected = false;
            this.mainWindow.webContents.send('phone-disconnected', { token });
            break;
          }
        }
      });
    });
  }

  generateSessionToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  async getConnectionUrl(token) {
    const addresses = this.getNetworkAddresses();
    const protocol = this.sslOptions ? 'https' : 'http';

    // Prefer local network address
    const host = addresses.local || addresses.localhost;
    return `${protocol}://${host}:${this.port}/scan/${token}`;
  }

  getNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = {
      localhost: 'localhost',
      local: null,
      public: null,
    };

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (!addresses.local) {
            addresses.local = iface.address;
          }
        }
      }
    }

    return addresses;
  }

  getMobileScannerHTML(token) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <title>Mic Browser - Mobile Scanner</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            color: white;
            overflow-x: hidden;
        }

        .header {
            padding: 20px;
            text-align: center;
            background: rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
        }

        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }

        .status {
            font-size: 14px;
            opacity: 0.9;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .scanner-container {
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .camera-view {
            width: 100%;
            max-width: 400px;
            aspect-ratio: 4/3;
            background: rgba(0,0,0,0.3);
            border-radius: 20px;
            position: relative;
            overflow: hidden;
            margin-bottom: 30px;
        }

        #video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 20px;
        }

        #canvas {
            display: none;
        }

        .camera-overlay {
            position: absolute;
            inset: 20px;
            border: 2px dashed rgba(255,255,255,0.5);
            border-radius: 12px;
            pointer-events: none;
            animation: scan 2s infinite;
        }

        @keyframes scan {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }

        .controls {
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
            max-width: 400px;
        }

        .capture-btn {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,255,255,0.3);
            color: white;
            padding: 18px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            -webkit-tap-highlight-color: transparent;
        }

        .capture-btn:active {
            transform: scale(0.95);
            background: rgba(255,255,255,0.3);
        }

        .capture-btn.processing {
            background: rgba(74,222,128,0.3);
            border-color: rgba(74,222,128,0.5);
            pointer-events: none;
        }

        .capture-icon {
            width: 30px;
            height: 30px;
            background: white;
            border-radius: 50%;
            position: relative;
        }

        .capture-icon::after {
            content: '';
            position: absolute;
            inset: 8px;
            background: #667eea;
            border-radius: 50%;
        }

        .file-input-wrapper {
            position: relative;
        }

        .file-input {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }

        .file-btn {
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 15px;
            border-radius: 15px;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .options {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
        }

        .option-chip {
            background: rgba(255,255,255,0.1);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            border: 1px solid rgba(255,255,255,0.2);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .option-chip.active {
            background: rgba(255,255,255,0.3);
            border-color: white;
        }

        .preview-modal {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            padding: 20px;
        }

        .preview-modal.active {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .preview-image {
            max-width: 100%;
            max-height: 60vh;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .preview-actions {
            display: flex;
            gap: 15px;
        }

        .preview-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
        }

        .success-message {
            background: rgba(74,222,128,0.2);
            border: 1px solid rgba(74,222,128,0.5);
            padding: 15px;
            border-radius: 12px;
            margin-top: 20px;
            text-align: center;
            display: none;
        }

        .success-message.active {
            display: block;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .camera-switch {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.5);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
        }

        @media (max-height: 600px) {
            .camera-view {
                max-height: 200px;
            }
            .header {
                padding: 10px;
            }
            .header h1 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 Mic Browser Scanner</h1>
        <div class="status">
            <span class="status-dot"></span>
            <span>Connected to Desktop</span>
        </div>
    </div>

    <div class="scanner-container">
        <div class="camera-view">
            <video id="video" autoplay playsinline></video>
            <canvas id="canvas"></canvas>
            <div class="camera-overlay"></div>
            <div class="camera-switch" onclick="switchCamera()">🔄</div>
        </div>

        <div class="controls">
            <button class="capture-btn" id="captureBtn" onclick="captureImage()">
                <span class="capture-icon"></span>
                <span>Scan Document</span>
            </button>

            <div class="file-input-wrapper">
                <input type="file" class="file-input" id="fileInput" accept="image/*" onchange="handleFileSelect(event)">
                <div class="file-btn">
                    <span>📁</span>
                    <span>Choose from Gallery</span>
                </div>
            </div>
        </div>

        <div class="options">
            <div class="option-chip active" data-type="auto">Auto Detect</div>
            <div class="option-chip" data-type="drivers_license">Driver's License</div>
            <div class="option-chip" data-type="id_card">ID Card</div>
            <div class="option-chip" data-type="document">Document</div>
        </div>

        <div class="success-message" id="successMessage">
            ✅ Sent to desktop successfully!
        </div>
    </div>

    <div class="preview-modal" id="previewModal">
        <img class="preview-image" id="previewImage">
        <div class="preview-actions">
            <button class="preview-btn" onclick="confirmScan()">✓ Send to Desktop</button>
            <button class="preview-btn" onclick="cancelScan()">✗ Retake</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const token = '${token}';
        let socket = null;
        let stream = null;
        let currentCamera = 'environment';
        let documentType = 'auto';
        let capturedImage = null;

        // Initialize socket connection
        function initSocket() {
            socket = io();
            
            socket.on('connect', () => {
                console.log('Connected to desktop');
                socket.emit('authenticate', token);
            });

            socket.on('authenticated', (data) => {
                console.log('Authenticated with:', data.desktopName);
            });

            socket.on('scan-complete', (data) => {
                showSuccess();
            });
        }

        // Initialize camera
        async function initCamera() {
            try {
                const constraints = {
                    video: {
                        facingMode: currentCamera,
                        width: { ideal: 1920 },
                        height: { ideal: 1440 }
                    }
                };

                stream = await navigator.mediaDevices.getUserMedia(constraints);
                const video = document.getElementById('video');
                video.srcObject = stream;
            } catch (error) {
                console.error('Camera error:', error);
                alert('Camera access is required for scanning. Please enable camera permissions.');
            }
        }

        // Switch camera (front/back)
        async function switchCamera() {
            currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            await initCamera();
        }

        // Capture image from camera
        function captureImage() {
            const video = document.getElementById('video');
            const canvas = document.getElementById('canvas');
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);

            canvas.toBlob((blob) => {
                capturedImage = blob;
                const url = URL.createObjectURL(blob);
                showPreview(url);
            }, 'image/jpeg', 0.9);
        }

        // Show preview modal
        function showPreview(imageUrl) {
            const modal = document.getElementById('previewModal');
            const previewImage = document.getElementById('previewImage');
            
            previewImage.src = imageUrl;
            modal.classList.add('active');
        }

        // Confirm and send scan
        async function confirmScan() {
            if (!capturedImage) return;

            const captureBtn = document.getElementById('captureBtn');
            captureBtn.classList.add('processing');
            captureBtn.innerHTML = '<span>⏳</span><span>Sending...</span>';

            const formData = new FormData();
            formData.append('image', capturedImage, 'scan.jpg');
            formData.append('documentType', documentType);

            try {
                const response = await fetch(\`/upload/\${token}\`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    showSuccess();
                    cancelScan();
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Failed to send image. Please try again.');
            } finally {
                captureBtn.classList.remove('processing');
                captureBtn.innerHTML = '<span class="capture-icon"></span><span>Scan Document</span>';
            }
        }

        // Cancel scan and close preview
        function cancelScan() {
            const modal = document.getElementById('previewModal');
            modal.classList.remove('active');
            capturedImage = null;
        }

        // Handle file selection from gallery
        async function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            capturedImage = file;
            const url = URL.createObjectURL(file);
            showPreview(url);
        }

        // Show success message
        function showSuccess() {
            const message = document.getElementById('successMessage');
            message.classList.add('active');
            
            setTimeout(() => {
                message.classList.remove('active');
            }, 3000);
        }

        // Document type selection
        document.querySelectorAll('.option-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.option-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                documentType = chip.dataset.type;
            });
        });

        // Initialize on page load
        window.addEventListener('load', () => {
            initSocket();
            initCamera();
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (socket) {
                socket.disconnect();
            }
        });
    </script>
</body>
</html>`;
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.port, '0.0.0.0', () => {
          const addresses = this.getNetworkAddresses();
          console.log(`Phone scanner server running on:`);
          console.log(`  Local: http://${addresses.local}:${this.port}`);
          console.log(`  Localhost: http://localhost:${this.port}`);

          resolve({
            port: this.port,
            addresses: addresses,
            deviceId: this.deviceId,
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
    if (this.io) {
      this.io.close();
    }

    // Clean up sessions
    this.activeSessions.clear();
    this.pendingScans.clear();
  }

  // Clean up old sessions periodically
  cleanupSessions() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [token, session] of this.activeSessions) {
      if (now - session.created > timeout && !session.connected) {
        this.activeSessions.delete(token);
        this.pendingScans.delete(token);
      }
    }
  }
}

module.exports = PhoneScannerServer;
