import { createHash, timingSafeEqual } from 'node:crypto';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'"
].join('; ');

function hash(value) {
  return createHash('sha256').update(value).digest();
}

export function createAdminAuthentication(password) {
  const expectedCredentials = password ? hash(`admin:${password}`) : undefined;

  return function requireAdmin(req, res, next) {
    if (!expectedCredentials) {
      return res.status(503).json({
        error: 'Flag management is disabled. Configure FLAGS_ADMIN_PASSWORD locally.'
      });
    }

    const authorization = req.get('Authorization') ?? '';
    let credentials = '';
    if (authorization.startsWith('Basic ')) {
      credentials = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
    }

    // Equal-length hashes allow constant-time comparison without exposing passwords.
    if (!timingSafeEqual(hash(credentials), expectedCredentials)) {
      res.set('WWW-Authenticate', 'Basic realm="Release Lab flags", charset="UTF-8"');
      return res.status(401).json({
        error: 'Sign in as admin using your local flag-management password'
      });
    }

    next();
  };
}

export function requireSameOrigin(req, res, next) {
  const origin = req.get('Origin');
  const expectedOrigin = `${req.protocol}://${req.get('Host')}`;
  const isPanelRequest = req.get('X-Requested-With') === 'ReleaseLab';
  const hasForeignOrigin = origin && origin !== expectedOrigin;

  if (!isPanelRequest || hasForeignOrigin) {
    return res.status(403).json({
      error: 'Only same-origin flag-management requests are accepted'
    });
  }

  next();
}

export function setResponseHeaders(_req, res, next) {
  res.set({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': CONTENT_SECURITY_POLICY
  });
  next();
}

export function handleError(error, _req, res, _next) {
  const status = [400, 404, 409, 413].includes(error.status) ? error.status : 500;
  let message = error.message;

  if (status === 500) {
    message = 'Internal server error';
  } else if (error.type === 'entity.parse.failed') {
    message = 'Invalid JSON request';
  }

  res.status(status).json({ error: message });
}
