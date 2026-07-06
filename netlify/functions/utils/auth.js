// Secure JWT Helper and Cookie Parser for Netlify Serverless Functions
// Written in compliance with 00_GLOBAL_RULES.md (Decisions 002: JWT HttpOnly Cookie)

const crypto = require('crypto');

// Secret Key for JWT Signature
const JWT_SECRET = process.env.JWT_SECRET || 'spoken-english-secured-token-2026';

// Parse raw Request Cookie Header
function parseCookies(headers) {
  const list = {};
  const rc = headers.cookie || headers.Cookie;

  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
    });
  }

  return list;
}

// Generate secure JWT Token string (expires in 24 hours)
function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const base64Url = (str) => {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours validity
  }));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT signature and expiration
function verifyToken(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;

    // Verify HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null; // Invalid signature
    }

    // Decode and parse payload JSON
    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf8')
    );

    // Validate Expiration
    if (decodedPayload.exp && (Date.now() / 1000) > decodedPayload.exp) {
      return null; // Expired token
    }

    return decodedPayload;
  } catch (error) {
    return null; // Parsing or syntax failure
  }
}

// Helper to authenticate a Netlify handler request
// Returns decoded payload if authenticated, else returns null
function authenticateRequest(event) {
  const cookies = parseCookies(event.headers);
  const token = cookies.token;
  return verifyToken(token);
}

module.exports = {
  parseCookies,
  generateToken,
  verifyToken,
  authenticateRequest
};
