/**
 * localizationMiddleware.js
 * Detects and sets the user's language preference
 */

const { t } = require('../utils/i18n');

function localizationMiddleware(req, res, next) {
  // Get language from query, cookie, or Accept-Language header
  const lang = req.query.lang
    || req.cookies?.lang
    || req.headers['accept-language']?.split(',')[0]?.split('-')[0]
    || 'en';

  // Validate language (only 'en' and 'ar' are supported)
  const supportedLanguages = ['en', 'ar'];
  req.language = supportedLanguages.includes(lang) ? lang : 'en';

  // Add translation function to request
  req.t = (key, params = {}) => t(key, req.language, params);

  // Add to response locals for EJS templates
  res.locals.lang = req.language;
  res.locals.t = req.t;

  next();
}

module.exports = localizationMiddleware;
