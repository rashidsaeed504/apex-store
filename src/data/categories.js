// APEX STORE — Category Data (4 Main Categories System)

export const categories = [
  {
    id: 1,
    name: 'HEADSETS',
    slug: 'headsets',
    description: 'High-performance wireless earbuds, noise-cancelling headphones & spatial audio gear.',
    shortDescription: 'Headphones & Earbuds',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    icon: 'Headphones',
    subcategories: ['Earbuds', 'AirPods', 'Headphones'],
    productCount: 4,
  },
  {
    id: 2,
    name: 'SMART WATCHES',
    slug: 'smart-watches',
    description: 'High-tech smartwatches, AMOLED fitness trackers & classic timepieces.',
    shortDescription: 'Smartwatches & Fitness',
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
    icon: 'Watch',
    subcategories: ['Smart Watches', 'Fitness Watches', 'Classic Watches'],
    productCount: 3,
  },
  {
    id: 3,
    name: 'CREATOR KIT',
    slug: 'creator-kit',
    description: 'Professional studio microphones, video lighting, stands & creator equipment.',
    shortDescription: 'Microphones & Lighting',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&auto=format&fit=crop&q=80',
    icon: 'Video',
    subcategories: ['Microphones', 'Video Lights', 'Ring Lights', 'Tripods & Stands', 'Phone Mounts', 'Creator Accessories'],
    productCount: 2,
  },
  {
    id: 4,
    name: 'ACCESSORIES',
    slug: 'accessories',
    description: 'Fast chargers, braided cables, power banks, adapters & premium tech gear.',
    shortDescription: 'Chargers, Cables & Gear',
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&auto=format&fit=crop&q=80',
    icon: 'Cable',
    subcategories: ['Chargers', 'Cables', 'Power Banks', 'Adapters', 'Mobile Accessories', 'Laptop Accessories', 'Other Accessories'],
    productCount: 8,
  },
];

export const getCategoryBySlug = (slug) => categories.find((c) => c.slug === slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
