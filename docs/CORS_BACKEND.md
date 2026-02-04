# CORS: Backend configuration required

When the frontend is served from a different origin than the backend (e.g. `https://www.automatemyblog.com` → `https://automate-my-blog-backend.vercel.app`), the **backend** must send CORS headers or the browser will block responses.

## Error you may see

```
Access to fetch at 'https://automate-my-blog-backend.vercel.app/api/...' from origin 'https://www.automatemyblog.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Fix (backend only)

Configure the backend (e.g. `automate-my-blog-backend` on Vercel) to allow the frontend origin:

- **Allowed origin:** `https://www.automatemyblog.com` (and optionally `https://automatemyblog.com` if you use both)
- **Response header:** `Access-Control-Allow-Origin: https://www.automatemyblog.com` (or `*` for public APIs)

### Examples

**Node/Express:** Use the `cors` middleware and allow your frontend origin:

```js
const cors = require('cors');
app.use(cors({ origin: ['https://www.automatemyblog.com', 'https://automatemyblog.com'] }));
```

**Vercel (`vercel.json`):** Add headers for API routes:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://www.automatemyblog.com" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Authorization, Content-Type" }
      ]
    }
  ]
}
```

**Preflight:** If the backend receives `OPTIONS` requests, respond with `204` and the same CORS headers so the browser can complete the actual request.

---

The frontend cannot fix CORS; the server must send the `Access-Control-Allow-Origin` header (or allow the origin in its CORS config).
