// APEX STORE — Utility Functions

// Central WhatsApp business number — single source of truth
export const WHATSAPP_NUMBER = '923465539086';

export const formatPrice = (price) => {
  if (price === undefined || price === null || isNaN(price)) return 'PKR 0';
  return `PKR ${Number(price).toLocaleString('en-PK')}`;
};

export const calculateDiscount = (originalPrice, price) => {
  if (!originalPrice || !price || originalPrice <= 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  const cut = text.substring(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.5) {
    return cut.substring(0, lastSpace).replace(/[,.:;!—\-]+$/, '').trim() + '...';
  }
  return cut.replace(/[,.:;!—\-]+$/, '').trim() + '...';
};

export const truncateWords = truncateText;

/**
 * Generate a clean, natural 2–3 line product excerpt without cutting mid-word
 */
export const getShortDescription = (text, maxLength = 165) => {
  if (!text || typeof text !== 'string') return '';
  
  const clean = text
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length <= maxLength) return clean;

  const cut = clean.substring(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  
  const result = lastSpace > maxLength * 0.5 ? cut.substring(0, lastSpace) : cut;
  return result.replace(/[,.:;!—\-]+$/, '').trim() + '...';
};

export const slugify = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const safeParseItems = (raw) => {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (!raw) return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch (e) {
      return [];
    }
  }
  if (typeof raw === 'object') return [raw];
  return [];
};
