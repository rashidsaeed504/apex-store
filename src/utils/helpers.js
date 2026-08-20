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

export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
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
