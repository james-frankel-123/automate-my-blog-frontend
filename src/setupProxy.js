const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy all /api requests to backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      ws: true, // Enable WebSocket/EventSource proxying
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, _res) => {
        console.log(`[Proxy] ${req.method} ${req.url} → http://localhost:3001${req.url}`);
      }
    })
  );
};
