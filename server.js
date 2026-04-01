const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 7001;
const TARGET_URL = 'http://154.64.2.5:3000';

app.use(cors());

// Internal PWA static assets - isolated to avoid shadowing target site assets
app.use('/_pwa', express.static(path.join(__dirname, 'public', '_pwa')));

// Main Entry Point
app.get('/', (req, res, next) => {
    // If the request comes from the iframe (mirroring mode)
    if (req.query.mirror === 'true') {
        return next();
    }
    // Otherwise, serve the PWA installation shell
    res.sendFile(path.join(__dirname, 'public', '_pwa', 'index.html'));
});

// Proxy everything else to the target server
app.use('/', createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
    onProxyRes: function (proxyRes, req, res) {
        // Strip security headers that prevent framing/mirroring
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['x-content-type-options'];
        
        // Ensure cookies are passed through and accessible
        if (proxyRes.headers['set-cookie']) {
            proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => 
                cookie.replace(/; SameSite=Lax/g, '; SameSite=None; Secure')
            );
        }
    },
    onProxyReq: function (proxyReq, req, res) {
        // Ensure the host header matches the target
        proxyReq.setHeader('host', new URL(TARGET_URL).host);
    },
    onError: function (err, req, res) {
        console.error('Proxy Error:', err);
        res.status(500).send('Erro no Servidor Espelho: Não foi possível conectar ao servidor de destino.');
    }
}));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mirror server running at http://0.0.0.0:${PORT}`);
    console.log(`Mirroring: ${TARGET_URL}`);
});
