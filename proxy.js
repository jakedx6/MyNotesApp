// proxy.js

const express = require('express');
const app = express();

// Middleware to enable CORS and handle preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Respond to preflight request
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

app.post('/ollama', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`Ollama server error: ${response.statusText}`);
    }

    // Stream the response body
    res.set('Content-Type', 'application/json');
    response.body.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error: ' + error.message);
  }
});

app.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});
