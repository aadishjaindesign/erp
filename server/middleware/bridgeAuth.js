/**
 * Bridge Authentication Middleware
 * Validates incoming Machine-to-Machine (M2M) API requests from external portals
 * (such as student.jainscomputer.com / LMS) using a pre-shared secret key.
 *
 * Does NOT require staff/user JWT tokens or cookies.
 */

const bridgeAuth = (req, res, next) => {
  const configuredApiKey = process.env.BRIDGE_API_KEY;

  if (!configuredApiKey) {
    console.error('❌ Bridge Auth Error: BRIDGE_API_KEY is not defined in ERP environment variables.');
    return res.status(500).json({
      success: false,
      message: 'Bridge authentication is not configured on the ERP server.',
      code: 'BRIDGE_KEY_NOT_CONFIGURED'
    });
  }

  // Header can be passed as X-API-KEY (case-insensitive in Express)
  const clientApiKey = req.get('X-API-KEY') || req.headers['x-api-key'] || req.headers['x-bridge-key'] || req.query.apiKey;

  if (!clientApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing X-API-KEY header.',
      code: 'MISSING_API_KEY'
    });
  }

  if (clientApiKey !== configuredApiKey) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid X-API-KEY provided.',
      code: 'INVALID_API_KEY'
    });
  }

  // API Key is valid, proceed
  next();
};

module.exports = bridgeAuth;

