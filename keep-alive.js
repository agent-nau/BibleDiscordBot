import http from 'node:http';
import express from 'express';

/**
 * Creates an HTTP server with webhook endpoints
 */
export function keepAlive(port = process.env.PORT || 3000, discordClient) {
  const app = express();

  // Middleware
  app.use(express.json());

  // Regular keep-alive endpoint
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Discord Bot Status</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            .status { display: inline-flex; align-items: center; gap: 0.5rem; }
            .dot {
              width: 10px; height: 10px; background: #00ff00;
              border-radius: 50%; animation: pulse 2s infinite;
            }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🤖 Discord Bot</h1>
            <div class="status"><div class="dot"></div><span>Online</span></div>
            <p>Premium Shop System Active</p>
          </div>
        </body>
      </html>
    `);
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      discord: discordClient?.user ? 'connected' : 'disconnected'
    });
  });

  // Attach Discord client to requests for webhooks
  app.use((req, res, next) => {
    req.discordClient = discordClient;
    next();
  });


  // Bind to 0.0.0.0 explicitly for Render/Docker compatibility
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${port} (0.0.0.0)`);
  });

  return server;
}