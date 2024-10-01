// server/server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3010; // Ensure this matches your client configuration

// Enable CORS for all routes
app.use(cors());

// Parse JSON and text request bodies
app.use(express.json());
app.use(express.text()); // For parsing text/plain bodies

// Initialize SQLite database (using a file-based database)
const db = new sqlite3.Database('./data.db');

// Create tables
db.serialize(() => {
  // Create settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
});

// Define the base directory for file storage
const BASE_DIR = path.join(__dirname, 'uploads');

// Ensure the base directory exists
if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

// Helper function to sanitize and validate paths
function getSafePath(userPath) {
  const safePath = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return safePath;
}

// API Endpoints

// ==================== SETTINGS ENDPOINTS ====================

// Save a setting
app.post('/api/settings', (req, res) => {
  const { key, value } = req.body;
  const stmt = db.prepare('REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, JSON.stringify(value), function (err) {
    if (err) {
      console.error('Error saving setting:', err);
      res.status(500).send('Error saving setting');
    } else {
      res.send('Setting saved');
    }
  });
});

// Retrieve a setting
app.get('/api/settings/:key', (req, res) => {
  const key = req.params.key;
  db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
    if (err) {
      console.error('Error retrieving setting:', err);
      res.status(500).send('Error retrieving setting');
    } else {
      res.json(row ? JSON.parse(row.value) : null);
    }
  });
});

// ==================== FILES ENDPOINTS ====================

// Read a file
app.get('/api/files/:filePath(*)', (req, res) => {
  const filePath = decodeURIComponent(req.params.filePath);
  console.log(`GET /api/files - filePath: ${filePath}`);
  const safeFilePath = getSafePath(filePath);
  const fullPath = path.join(BASE_DIR, safeFilePath);
  console.log(`GET /api/files - fullPath: ${fullPath}`);

  fs.readFile(fullPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).send(`Error reading file: ${err.message}`);
    } else {
      res.send(data);
    }
  });
});

// Create or update a file
app.put('/api/files/:filePath(*)', (req, res) => {
  const filePath = decodeURIComponent(req.params.filePath);
  const safeFilePath = getSafePath(filePath);
  const fullPath = path.join(BASE_DIR, safeFilePath);

  // Ensure the directory exists
  const dir = path.dirname(fullPath);
  fs.mkdir(dir, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating directory:', err);
      res.status(500).send('Error creating directory');
    } else {
      fs.writeFile(fullPath, req.body, 'utf8', (err) => {
        if (err) {
          console.error('Error writing file:', err);
          res.status(500).send('Error writing file');
        } else {
          res.send('File saved');
        }
      });
    }
  });
});

// Delete a file
app.delete('/api/files/:filePath(*)', (req, res) => {
  const filePath = decodeURIComponent(req.params.filePath);
  const safeFilePath = getSafePath(filePath);
  const fullPath = path.join(BASE_DIR, safeFilePath);

  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      res.status(500).send('Error deleting file');
    } else {
      res.send('File deleted');
    }
  });
});

// ==================== DIRECTORIES ENDPOINTS ====================

// List files and directories
app.get('/api/directories/:folderPath(*)?', (req, res) => {
  const folderPath = decodeURIComponent(req.params.folderPath || '');
  const safeFolderPath = getSafePath(folderPath);
  const directoryPath = path.join(BASE_DIR, safeFolderPath);

  fs.stat(directoryPath, (err, stats) => {
    if (err) {
      console.error('Error accessing path:', err);
      res.status(500).send('Error accessing path');
    } else if (!stats.isDirectory()) {
      res.status(400).send('Path is not a directory');
    } else {
      fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
        if (err) {
          console.error('Error reading directory:', err);
          res.status(500).send('Error reading directory');
        } else {
          const fileList = files.map((file) => ({
            name: file.name,
            path: path.posix.join(folderPath, file.name),
            isDirectory: file.isDirectory(),
          }));
          res.json(fileList);
        }
      });
    }
  });
});

// Create a folder
app.post('/api/directories/:folderPath(*)', (req, res) => {
  const folderPath = decodeURIComponent(req.params.folderPath);
  const safeFolderPath = getSafePath(folderPath);
  const fullPath = path.join(BASE_DIR, safeFolderPath);

  fs.mkdir(fullPath, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating folder:', err);
      res.status(500).send('Error creating folder');
    } else {
      res.send('Folder created');
    }
  });
});

// Delete a folder
app.delete('/api/directories/:folderPath(*)', (req, res) => {
  const folderPath = decodeURIComponent(req.params.folderPath);
  const safeFolderPath = getSafePath(folderPath);
  const fullPath = path.join(BASE_DIR, safeFolderPath);

  fs.rm(fullPath, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error('Error deleting folder:', err);
      res.status(500).send('Error deleting folder');
    } else {
      res.send('Folder deleted');
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});
