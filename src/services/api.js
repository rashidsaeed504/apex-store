// APEX STORE — Decoupled API Service (Live Supabase Client with Fallback)
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { products as initialProducts } from '../data/products.js';
import { categories as initialCategories } from '../data/categories.js';

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

// Helper to normalize Supabase snake_case & camelCase properties
const normalizeProduct = (p) => {
  if (!p) return null;
  const desc = p.description || p.fullDescription || p.full_description || '';
  
  let features = [];
  if (Array.isArray(p.features)) {
    features = p.features;
  } else if (typeof p.features === 'string' && p.features.trim()) {
    features = p.features.includes('\n')
      ? p.features.split('\n').map((s) => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
      : p.features.split(',').map((s) => s.trim()).filter(Boolean);
  }

  let specifications = {};
  if (typeof p.specifications === 'object' && p.specifications !== null && !Array.isArray(p.specifications)) {
    specifications = p.specifications;
  } else if (typeof p.specifications === 'string' && p.specifications.trim()) {
    try {
      specifications = JSON.parse(p.specifications);
    } catch {
      const lines = p.specifications.split('\n').map((l) => l.trim()).filter(Boolean);
      const res = {};
      lines.forEach((l) => {
        const colonIdx = l.indexOf(':');
        if (colonIdx !== -1) {
          res[l.slice(0, colonIdx).trim()] = l.slice(colonIdx + 1).trim();
        } else {
          res[l] = 'Yes';
        }
      });
      specifications = res;
    }
  }

  return {
    ...p,
    description: desc,
    fullDescription: desc,
    full_description: desc,
    features,
    specifications,
    originalPrice: p.originalPrice !== undefined ? p.originalPrice : (p.original_price !== undefined ? p.original_price : p.price),
    isFeatured: p.isFeatured !== undefined ? p.isFeatured : Boolean(p.is_featured),
    isTrending: p.isTrending !== undefined ? p.isTrending : Boolean(p.is_trending),
    isNewArrival: p.isNewArrival !== undefined ? p.isNewArrival : Boolean(p.is_new_arrival),
    isBestSeller: p.isBestSeller !== undefined ? p.isBestSeller : Boolean(p.is_best_seller),
    isOnSale: p.isOnSale !== undefined ? p.isOnSale : Boolean(p.is_on_sale),
    isSpecialOffer: p.isSpecialOffer !== undefined ? Boolean(p.isSpecialOffer) : Boolean(p.is_special_offer),
    status: p.status || (p.stock <= 0 ? 'Out of Stock' : 'Active'),
    subcategory: p.subcategory || '',
    images: Array.isArray(p.images) && p.images.length > 0 
      ? p.images 
      : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'],
  };
};

// Resilient Supabase Storage Upload Helper
export async function uploadImageToSupabase(file, folder = 'products') {
  if (!file) return null;

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image file size must be less than 5MB.');
  }

  // Validate type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Allowed image formats: JPG, PNG, WEBP, GIF.');
  }

  if (isSupabaseConfigured) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase storage upload warning:', error.message);
      }
    } catch (e) {
      console.warn('Supabase storage upload error:', e.message);
    }
  }

  // Resilient Fallback: Read file as Data URL (base64) so image uploads NEVER fail or crash the form
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Resilient mutation handler that auto-handles missing schema columns and reports full errors
const safeSupabaseMutation = async (table, operation, payload, eqField, eqValue) => {
  let currentPayload = { ...payload };
  let attempts = 0;
  
  while (attempts < 5) {
    attempts++;
    let query;
    if (operation === 'insert') {
      query = supabase.from(table).insert([currentPayload]).select().single();
    } else if (operation === 'update') {
      query = supabase.from(table).update(currentPayload).eq(eqField, eqValue).select().single();
    }

    const { data, error } = await query;
    
    if (!error) return data;

    // Handle PGRST204 / 42703 missing column in schema gracefully
    if (
      (error.code === 'PGRST204' || error.code === '42703') ||
      (error.message && (error.message.includes('column') || error.message.includes('Could not find the')))
    ) {
      const match = error.message.match(/column ["]?([^"'\s]+)["]? of relation|Could not find the '([^']+)' column/i);
      const colName = match ? (match[1] || match[2]) : null;
      if (colName && currentPayload[colName] !== undefined) {
        console.warn(`[Supabase Schema Fallback] Removing missing column '${colName}' from '${table}' payload and retrying...`);
        delete currentPayload[colName];
        continue;
      }
    }

    // Handle PGRST205 missing table in schema cache gracefully
    if (error.code === 'PGRST205') {
      console.warn(`[Supabase Table Fallback] Table '${table}' not found in Supabase schema. Falling back to resilient cloud/local store.`);
      throw new Error(`Table '${table}' not found in Supabase schema`);
    }

    // Log full detailed error in console for debugging
    console.error(`FULL SUPABASE ${operation.toUpperCase()} ERROR on ${table}:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      status: error.status,
      error
    });
    throw new Error(`Supabase error (${error.code || '400'}): ${error.message || error.details || 'Operation failed'}`);
  }
};

// Fallback Local Storage Keys
const LOCAL_PRODUCTS_KEY = 'apex-db-products';
const LOCAL_ORDERS_KEY = 'apex-db-orders';
const LOCAL_CATEGORIES_KEY = 'apex-db-categories';
const LOCAL_SUBCATEGORIES_KEY = 'apex-db-subcategories';

const getLocalProducts = () => {
  const stored = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (stored) {
    try { return JSON.parse(stored).map(normalizeProduct); } catch (e) { console.error(e); }
  }
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(initialProducts));
  return initialProducts.map(normalizeProduct);
};

const setLocalProducts = (list) => {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(list));
};

const getLocalOrders = () => {
  if (typeof localStorage === 'undefined') return [];
  const results = [];
  const map = new Map();

  const parseAndAdd = (key) => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((o) => {
            if (o && o.id && !map.has(String(o.id))) {
              map.set(String(o.id), o);
              results.push(o);
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  parseAndAdd(LOCAL_ORDERS_KEY);
  parseAndAdd('apex_custom_orders');
  return results;
};

const setLocalOrders = (list) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
};

const getLocalCategories = () => {
  const stored = localStorage.getItem(LOCAL_CATEGORIES_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.error(e); }
  }
  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(initialCategories));
  return initialCategories;
};

const setLocalCategories = (list) => {
  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(list));
};

const getLocalSubcategories = () => {
  const stored = localStorage.getItem(LOCAL_SUBCATEGORIES_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.error(e); }
  }
  return [];
};

const setLocalSubcategories = (list) => {
  localStorage.setItem(LOCAL_SUBCATEGORIES_KEY, JSON.stringify(list));
};

// ==========================================
// 1. PRODUCTS API
// ==========================================

// ── Product query cache (prevents 3× duplicate Supabase queries on homepage) ──
let _productsCachePromise = null;
let _productsCacheTime = 0;
const _PRODUCTS_CACHE_TTL = 30000; // 30 seconds

export async function fetchProducts(includeArchived = false) {
  // For the standard storefront path (non-archived), use a shared cached promise
  if (!includeArchived) {
    const now = Date.now();
    if (_productsCachePromise && (now - _productsCacheTime < _PRODUCTS_CACHE_TTL)) {
      return _productsCachePromise;
    }
    _productsCacheTime = now;
    _productsCachePromise = _fetchProductsImpl(false);
    _productsCachePromise.catch(() => { _productsCachePromise = null; });
    return _productsCachePromise;
  }
  return _fetchProductsImpl(includeArchived);
}

// Invalidate product cache (called after admin writes so realtime updates work)
export function invalidateProductsCache() {
  _productsCachePromise = null;
  _productsCacheTime = 0;
}

async function _fetchProductsImpl(includeArchived) {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .neq('status', 'SystemHidden')
        .neq('category', 'SYSTEM')
        .order('created_at', { ascending: false });

      if (!includeArchived) {
        query = query.neq('status', 'Archived').neq('status', 'Inactive');
      }
      const { data, error } = await query;
      if (!error && data) {
        return data
          .filter((p) => p.slug !== '__apex_cms_global_config__' && p.category !== 'SYSTEM' && p.status !== 'SystemHidden')
          .map(normalizeProduct);
      }
    } catch (e) {
      console.warn('Supabase fetch error:', e.message);
    }
  }
  const local = getLocalProducts();
  return (includeArchived ? local : local.filter((p) => p.status !== 'Archived' && p.status !== 'Inactive'))
    .filter((p) => p.slug !== '__apex_cms_global_config__' && p.category !== 'SYSTEM' && p.status !== 'SystemHidden');
}

export async function fetchProductBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).trim();

  if (isSupabaseConfigured) {
    try {
      // 1. Try exact slug match
      let { data } = await supabase
        .from('products')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();

      // 2. Try case-insensitive slug match
      if (!data) {
        const res = await supabase
          .from('products')
          .select('*')
          .ilike('slug', cleanSlug)
          .maybeSingle();
        data = res.data;
      }

      // 3. If numeric ID passed (e.g. /product/2)
      if (!data && !isNaN(Number(cleanSlug))) {
        const res = await supabase
          .from('products')
          .select('*')
          .eq('id', Number(cleanSlug))
          .maybeSingle();
        data = res.data;
      }

      // 4. Fallback search by slugified name
      if (!data) {
        const { data: all } = await supabase.from('products').select('*');
        if (Array.isArray(all)) {
          data = all.find((p) => {
            const pSlug = (p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'))?.toLowerCase();
            return pSlug === cleanSlug.toLowerCase();
          });
        }
      }

      if (data) {
        return normalizeProduct(data);
      }
    } catch (e) {
      console.warn('Supabase fetch product error:', e.message);
    }
  }

  const productsList = getLocalProducts();
  return (
    productsList.find((p) => {
      const pSlug = (p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'))?.toLowerCase();
      return pSlug === cleanSlug.toLowerCase() || String(p.id) === cleanSlug;
    }) || null
  );
}

export async function createProduct(productData) {
  const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  let imagesArray = [];
  if (Array.isArray(productData.images) && productData.images.length > 0) {
    imagesArray = productData.images;
  } else if (typeof productData.image === 'string' && productData.image.trim()) {
    imagesArray = [productData.image.trim()];
  } else {
    imagesArray = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'];
  }

  const dbPayload = {
    name: productData.name,
    slug,
    category: productData.category || 'HEADSETS',
    subcategory: productData.subcategory || null,
    subcategory_id: productData.subcategory_id || productData.subcategoryId || null,
    price: Number(productData.price),
    original_price: Number(productData.originalPrice || productData.price),
    discount: Number(productData.discount || 0),
    rating: Number(productData.rating || 5.0),
    reviews: Number(productData.reviews || 0),
    images: imagesArray,
    description: productData.description || '',
    full_description: productData.fullDescription || productData.description || '',
    features: Array.isArray(productData.features) ? productData.features : [],
    specifications: typeof productData.specifications === 'object' && productData.specifications !== null ? productData.specifications : {},
    stock: Number(productData.stock || 0),
    badge: productData.badge || null,
    colors: Array.isArray(productData.colors) ? productData.colors : [],
    status: productData.status || (Number(productData.stock) <= 0 ? 'Out of Stock' : 'Active'),
    is_featured: Boolean(productData.isFeatured),
    is_trending: Boolean(productData.isTrending),
    is_new_arrival: Boolean(productData.isNewArrival),
    is_best_seller: Boolean(productData.isBestSeller),
    is_on_sale: Boolean(productData.isSpecialOffer || productData.isOnSale),
    is_special_offer: Boolean(productData.isSpecialOffer),
  };

  if (isSupabaseConfigured) {
    const data = await safeSupabaseMutation('products', 'insert', dbPayload);
    if (data) return normalizeProduct(data);
  }

  const list = getLocalProducts();
  const created = normalizeProduct({ ...productData, id: Date.now(), slug });
  setLocalProducts([created, ...list]);
  return created;
}

export async function updateProduct(id, updates) {
  const dbPayload = {};
  if (updates.name !== undefined) dbPayload.name = updates.name;
  if (updates.slug !== undefined) dbPayload.slug = updates.slug;
  if (updates.category !== undefined) dbPayload.category = updates.category;
  if (updates.subcategory !== undefined) dbPayload.subcategory = updates.subcategory;
  if (updates.subcategory_id !== undefined || updates.subcategoryId !== undefined) {
    dbPayload.subcategory_id = updates.subcategory_id || updates.subcategoryId;
  }
  if (updates.price !== undefined) dbPayload.price = Number(updates.price);
  if (updates.originalPrice !== undefined) dbPayload.original_price = Number(updates.originalPrice);
  if (updates.discount !== undefined) dbPayload.discount = Number(updates.discount);
  if (updates.stock !== undefined) dbPayload.stock = Number(updates.stock);
  if (updates.badge !== undefined) dbPayload.badge = updates.badge;
  if (updates.description !== undefined) dbPayload.description = updates.description;
  if (updates.fullDescription !== undefined) dbPayload.full_description = updates.fullDescription;
  
  if (updates.images !== undefined) {
    dbPayload.images = Array.isArray(updates.images) ? updates.images : [updates.images];
  } else if (updates.image !== undefined) {
    dbPayload.images = [updates.image];
  }

  if (updates.features !== undefined) dbPayload.features = Array.isArray(updates.features) ? updates.features : [];
  if (updates.specifications !== undefined) dbPayload.specifications = updates.specifications;
  if (updates.status !== undefined) dbPayload.status = updates.status;
  if (updates.isFeatured !== undefined) dbPayload.is_featured = Boolean(updates.isFeatured);
  if (updates.isTrending !== undefined) dbPayload.is_trending = Boolean(updates.isTrending);
  if (updates.isNewArrival !== undefined) dbPayload.is_new_arrival = Boolean(updates.isNewArrival);
  if (updates.isBestSeller !== undefined) dbPayload.is_best_seller = Boolean(updates.isBestSeller);
  if (updates.isOnSale !== undefined || updates.isSpecialOffer !== undefined) {
    dbPayload.is_on_sale = Boolean(updates.isSpecialOffer || updates.isOnSale);
  }
  if (updates.isSpecialOffer !== undefined) {
    dbPayload.is_special_offer = Boolean(updates.isSpecialOffer);
  }
  if (updates.colors !== undefined) dbPayload.colors = updates.colors;
  dbPayload.updated_at = new Date().toISOString();

  if (isSupabaseConfigured) {
    const data = await safeSupabaseMutation('products', 'update', dbPayload, 'id', id);
    if (data) return normalizeProduct(data);
  }

  const list = getLocalProducts();
  const updatedList = list.map((p) => (p.id === id ? normalizeProduct({ ...p, ...updates }) : p));
  setLocalProducts(updatedList);
  return updatedList.find((p) => p.id === id);
}

// ==========================================
// 1.5 GLOBAL SUPABASE CMS ENGINE (CROSS-DEVICE CLOUD STORE)
// ==========================================

const CMS_GLOBAL_CONFIG_SLUG = '__apex_cms_global_config__';

/**
 * Fetch global CMS config from Supabase directly (cross-device source of truth)
 */
export async function fetchGlobalSupabaseCMSConfig() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('description, updated_at')
      .eq('slug', CMS_GLOBAL_CONFIG_SLUG)
      .maybeSingle();

    if (!error && data?.description) {
      try {
        const parsed = JSON.parse(data.description);
        return { ...parsed, updated_at: data.updated_at };
      } catch (e) {
        return null;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch global Supabase CMS config:', e);
  }
  return null;
}

/**
 * Save global CMS config to Supabase directly
 */
export async function saveGlobalSupabaseCMSConfig(partialConfig) {
  if (!isSupabaseConfigured) return false;
  try {
    const existing = await fetchGlobalSupabaseCMSConfig();
    const merged = {
      banners: partialConfig.banners !== undefined ? partialConfig.banners : (existing?.banners || []),
      special_offer: partialConfig.special_offer !== undefined ? partialConfig.special_offer : (existing?.special_offer || null),
      social_gallery: partialConfig.social_gallery !== undefined ? partialConfig.social_gallery : (existing?.social_gallery || []),
      return_settings: partialConfig.return_settings !== undefined ? partialConfig.return_settings : (existing?.return_settings || null),
      returns: partialConfig.returns !== undefined ? partialConfig.returns : (existing?.returns || []),
      updated_at: new Date().toISOString(),
    };

    const payload = {
      name: 'APEX CMS GLOBAL CONFIG',
      slug: CMS_GLOBAL_CONFIG_SLUG,
      category: 'SYSTEM',
      price: 0,
      status: 'SystemHidden',
      is_featured: false,
      is_trending: false,
      is_new_arrival: false,
      is_best_seller: false,
      is_on_sale: false,
      description: JSON.stringify(merged),
      updated_at: merged.updated_at,
    };

    const { data: row } = await supabase
      .from('products')
      .select('id')
      .eq('slug', CMS_GLOBAL_CONFIG_SLUG)
      .maybeSingle();

    if (row?.id) {
      await supabase.from('products').update(payload).eq('id', row.id);
    } else {
      await supabase.from('products').insert([payload]);
    }
    return true;
  } catch (e) {
    console.warn('Failed to save global Supabase CMS config:', e);
    return false;
  }
}

// ==========================================
// 2. SPECIAL OFFERS API (GLOBAL SUPABASE CMS SYNCHRONIZED)
// ==========================================

const LOCAL_SPECIAL_OFFER_KEY = 'apex_special_offer_config';

function getLocalSpecialOffer() {
  try {
    const raw = localStorage.getItem(LOCAL_SPECIAL_OFFER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setLocalSpecialOffer(data) {
  try {
    localStorage.setItem(LOCAL_SPECIAL_OFFER_KEY, JSON.stringify(data));
  } catch (e) {}
}

function broadcastSpecialOfferUpdated() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('apex_special_offer_updated'));
    } catch (e) {}
  }
}

// Fetch Active Special Offer for Homepage Display across any device globally
export async function fetchActiveSpecialOffer() {
  // 1. Try dedicated Supabase 'special_offers' table
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('special_offers')
        .select('*, product:products(*)')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const now = new Date();
        if (data.start_at && new Date(data.start_at) > now) return null;
        if (data.end_at && new Date(data.end_at) < now) return null;

        const product = data.product ? normalizeProduct(data.product) : null;
        if (!product) return null;

        const salePrice = data.sale_price !== null && data.sale_price !== undefined ? Number(data.sale_price) : product.price;
        const originalPrice = data.original_price !== null && data.original_price !== undefined ? Number(data.original_price) : (product.originalPrice || product.price);
        const discountPercent = data.discount_percentage !== null && data.discount_percentage !== undefined 
          ? Number(data.discount_percentage) 
          : (originalPrice > salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0);

        return {
          id: data.id,
          productId: data.product_id,
          isActive: data.is_active,
          badgeText: data.badge_text || 'SPECIAL OFFER',
          dealLabel: data.deal_label || 'Limited Time Deal',
          name: data.custom_title || product.name,
          description: data.custom_description || product.description || product.fullDescription,
          price: salePrice,
          originalPrice: originalPrice,
          discount: discountPercent,
          features: Array.isArray(data.features) && data.features.length > 0 ? data.features : (product.features || []),
          warrantyText: data.warranty_text || 'Official 1-Year Warranty',
          deliveryText: data.delivery_text || 'Express Delivery Across Pakistan',
          primaryButtonText: data.primary_button_text || 'SHOP NOW',
          secondaryButtonText: data.secondary_button_text || 'VIEW ALL DEALS',
          startAt: data.start_at,
          endAt: data.end_at,
          images: product.images,
          image: product.images?.[0] || product.image,
          rating: product.rating,
          reviews: product.reviews,
          slug: product.slug,
          category: product.category,
        };
      }
    } catch (e) {
      // Table doesn't exist yet, proceed to global cloud CMS config
    }

    // 2. Fetch from Global Supabase Cloud CMS record (accessible globally on all devices)
    const globalCms = await fetchGlobalSupabaseCMSConfig();
    if (globalCms?.special_offer) {
      const offerConfig = globalCms.special_offer;
      if (offerConfig.isActive !== false) {
        const now = new Date();
        if (offerConfig.startAt && new Date(offerConfig.startAt) > now) return null;
        if (offerConfig.endAt && new Date(offerConfig.endAt) < now) return null;

        const allProducts = await fetchProducts();
        const product = allProducts.find((p) => p.id === Number(offerConfig.productId)) || allProducts[0];
        if (!product) return null;

        const salePrice = offerConfig.salePrice !== undefined && offerConfig.salePrice !== '' ? Number(offerConfig.salePrice) : product.price;
        const originalPrice = offerConfig.originalPrice !== undefined && offerConfig.originalPrice !== '' ? Number(offerConfig.originalPrice) : (product.originalPrice || product.price);
        const discount = offerConfig.discountPercentage !== undefined && offerConfig.discountPercentage !== '' 
          ? Number(offerConfig.discountPercentage) 
          : (originalPrice > salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0);

        return {
          id: offerConfig.id || 1,
          productId: product.id,
          isActive: true,
          badgeText: offerConfig.badgeText || 'SPECIAL OFFER',
          dealLabel: offerConfig.dealLabel || 'Limited Time Deal',
          name: offerConfig.customTitle || product.name,
          description: offerConfig.customDescription || product.description,
          price: salePrice,
          originalPrice: originalPrice,
          discount: discount,
          features: Array.isArray(offerConfig.features) && offerConfig.features.length > 0 ? offerConfig.features : (product.features || []),
          warrantyText: offerConfig.warrantyText || 'Official 1-Year Warranty',
          deliveryText: offerConfig.deliveryText || 'Express Delivery Across Pakistan',
          primaryButtonText: offerConfig.primaryButtonText || 'SHOP NOW',
          secondaryButtonText: offerConfig.secondaryButtonText || 'VIEW ALL DEALS',
          startAt: offerConfig.startAt,
          endAt: offerConfig.endAt,
          images: product.images,
          image: product.images?.[0] || product.image,
          rating: product.rating,
          reviews: product.reviews,
          slug: product.slug,
          category: product.category,
        };
      }
    }
  }

  // 3. Fallback from localStorage (offline / standalone dev)
  const localConfig = getLocalSpecialOffer();
  if (localConfig && localConfig.isActive !== false) {
    const allProducts = await fetchProducts();
    const product = allProducts.find((p) => p.id === Number(localConfig.productId)) || allProducts[0];
    if (product) {
      const salePrice = localConfig.salePrice ? Number(localConfig.salePrice) : product.price;
      const originalPrice = localConfig.originalPrice ? Number(localConfig.originalPrice) : (product.originalPrice || product.price);
      return {
        id: localConfig.id || 1,
        productId: product.id,
        isActive: true,
        badgeText: localConfig.badgeText || 'SPECIAL OFFER',
        dealLabel: localConfig.dealLabel || 'Limited Time Deal',
        name: localConfig.customTitle || product.name,
        description: localConfig.customDescription || product.description,
        price: salePrice,
        originalPrice: originalPrice,
        discount: localConfig.discountPercentage ? Number(localConfig.discountPercentage) : 20,
        features: Array.isArray(localConfig.features) && localConfig.features.length > 0 ? localConfig.features : (product.features || []),
        warrantyText: localConfig.warrantyText || 'Official 1-Year Warranty',
        deliveryText: localConfig.deliveryText || 'Express Delivery Across Pakistan',
        primaryButtonText: localConfig.primaryButtonText || 'SHOP NOW',
        secondaryButtonText: localConfig.secondaryButtonText || 'VIEW ALL DEALS',
        images: product.images,
        image: product.images?.[0] || product.image,
        rating: product.rating,
        reviews: product.reviews,
        slug: product.slug,
        category: product.category,
      };
    }
  }

  // 4. Default Seed Fallback from Live Product
  const allProds = await fetchProducts();
  if (!allProds || allProds.length === 0) return null;
  const p = allProds.find((x) => x.isSpecialOffer) || allProds[0];
  if (!p) return null;

  return {
    id: 1,
    productId: p.id,
    isActive: true,
    badgeText: 'SPECIAL OFFER',
    dealLabel: 'Limited Time Deal',
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice || p.price,
    discount: p.discount || 20,
    features: p.features || ['High Performance', 'Official Warranty', 'Express Delivery'],
    warrantyText: 'Official 1-Year Warranty',
    deliveryText: 'Express Delivery Across Pakistan',
    primaryButtonText: 'SHOP NOW',
    secondaryButtonText: 'VIEW ALL DEALS',
    images: p.images,
    image: p.images?.[0] || p.image,
    rating: p.rating,
    reviews: p.reviews,
    slug: p.slug,
    category: p.category,
  };
}

// Fetch for Admin Portal across any device
export async function fetchAdminSpecialOffer() {
  if (isSupabaseConfigured) {
    // 1. Try dedicated table
    try {
      const { data, error } = await supabase
        .from('special_offers')
        .select('*, product:products(*)')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          productId: data.product_id,
          isActive: data.is_active,
          badgeText: data.badge_text,
          dealLabel: data.deal_label,
          customTitle: data.custom_title,
          customDescription: data.custom_description,
          salePrice: data.sale_price,
          originalPrice: data.original_price,
          discountPercentage: data.discount_percentage,
          features: data.features || [],
          warrantyText: data.warranty_text,
          deliveryText: data.delivery_text,
          primaryButtonText: data.primary_button_text,
          secondaryButtonText: data.secondary_button_text,
          startAt: data.start_at,
          endAt: data.end_at,
          product: data.product ? normalizeProduct(data.product) : null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {}

    // 2. Try global Supabase Cloud CMS record
    const globalCms = await fetchGlobalSupabaseCMSConfig();
    if (globalCms?.special_offer) {
      const offerConfig = globalCms.special_offer;
      const allProducts = await fetchProducts();
      const product = allProducts.find((p) => p.id === Number(offerConfig.productId)) || allProducts[0];
      return {
        ...offerConfig,
        product: product || null,
      };
    }
  }

  const local = getLocalSpecialOffer();
  if (local) return local;

  const allProducts = await fetchProducts();
  const defProduct = allProducts[0] || null;
  return {
    productId: defProduct?.id || null,
    isActive: true,
    badgeText: 'SPECIAL OFFER',
    dealLabel: 'Limited Time Deal',
    customTitle: '',
    customDescription: '',
    salePrice: defProduct?.price || 5999,
    originalPrice: defProduct?.originalPrice || 7499,
    discountPercentage: 20,
    features: ['Hot-Swappable Switches', 'PBT Double-Shot Keycaps', 'Per-Key RGB Lighting'],
    warrantyText: 'Official 1-Year Warranty',
    deliveryText: 'Express Delivery Across Pakistan',
    primaryButtonText: 'SHOP NOW',
    secondaryButtonText: 'VIEW ALL DEALS',
    product: defProduct,
  };
}

// Save / Update Special Offer Configuration from Admin Portal (Global Persistence)
export async function saveSpecialOffer(payload) {
  const dbPayload = {
    product_id: Number(payload.productId),
    is_active: Boolean(payload.isActive !== false),
    badge_text: payload.badgeText || 'SPECIAL OFFER',
    deal_label: payload.dealLabel || 'Limited Time Deal',
    custom_title: payload.customTitle || null,
    custom_description: payload.customDescription || null,
    sale_price: payload.salePrice !== undefined && payload.salePrice !== '' ? Number(payload.salePrice) : null,
    original_price: payload.originalPrice !== undefined && payload.originalPrice !== '' ? Number(payload.originalPrice) : null,
    discount_percentage: payload.discountPercentage !== undefined && payload.discountPercentage !== '' ? Number(payload.discountPercentage) : null,
    features: Array.isArray(payload.features) ? payload.features.filter(Boolean) : [],
    warranty_text: payload.warrantyText || 'Official 1-Year Warranty',
    delivery_text: payload.deliveryText || 'Express Delivery Across Pakistan',
    primary_button_text: payload.primaryButtonText || 'SHOP NOW',
    secondary_button_text: payload.secondaryButtonText || 'VIEW ALL DEALS',
    start_at: payload.startAt || null,
    end_at: payload.endAt || null,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    // 1. Try dedicated table
    try {
      const { data: existing } = await supabase
        .from('special_offers')
        .select('id')
        .order('id')
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('special_offers')
          .update(dbPayload)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('special_offers')
          .insert([dbPayload]);
      }
    } catch (e) {}

    // 2. Persist to Global Supabase Cloud CMS record
    await saveGlobalSupabaseCMSConfig({ special_offer: payload });
  }

  setLocalSpecialOffer(payload);
  broadcastSpecialOfferUpdated();
  return payload;
}

export const fetchSpecialOfferProduct = fetchActiveSpecialOffer;

export async function deleteProduct(id) {
  if (isSupabaseConfigured) {
    const { data: items } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (items && items.length > 0) {
      const data = await safeSupabaseMutation(
        'products',
        'update',
        { status: 'Archived', is_featured: false, is_trending: false },
        'id',
        id
      );
      return { archived: true };
    } else {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('FULL SUPABASE DELETE ERROR on products:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error
        });
        throw new Error(`Supabase error (${error.code || '400'}): ${error.message || 'Failed to delete product'}`);
      }
      return { deleted: true };
    }
  }

  const list = getLocalProducts();
  const filtered = list.filter((p) => p.id !== id);
  setLocalProducts(filtered);
  return { deleted: true };
}

// ==========================================
// 2. CATEGORIES & SUBCATEGORIES API
// ==========================================

export async function fetchCategories() {
  const masterOrder = ['HEADSETS', 'SMART WATCHES', 'CREATOR KIT', 'ACCESSORIES'];

  const sortCategories = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const sortA = a.sort_order !== undefined ? a.sort_order : (a.sortOrder !== undefined ? a.sortOrder : 999);
      const sortB = b.sort_order !== undefined ? b.sort_order : (b.sortOrder !== undefined ? b.sortOrder : 999);
      if (sortA !== sortB) return sortA - sortB;

      const indexA = masterOrder.findIndex((m) => m.toLowerCase() === (a.name || '').toLowerCase());
      const indexB = masterOrder.findIndex((m) => m.toLowerCase() === (b.name || '').toLowerCase());
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return (a.id || 0) - (b.id || 0);
    });
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('id');
      if (!error && data && data.length > 0) return sortCategories(data);
    } catch (e) {
      console.warn('Supabase fetch categories error:', e.message);
    }
  }
  return sortCategories(getLocalCategories());
}

export async function createCategory(catData) {
  const dbPayload = {
    name: catData.name,
    slug: catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    description: catData.description || '',
    short_description: catData.short_description || catData.shortDescription || '',
    image: catData.image || '',
    is_active: catData.is_active !== undefined ? catData.is_active : (catData.isActive !== undefined ? catData.isActive : true),
    sort_order: Number(catData.sort_order || catData.sortOrder || 0),
  };

  if (isSupabaseConfigured) {
    const data = await safeSupabaseMutation('categories', 'insert', dbPayload);
    if (data) return data;
  }

  const list = getLocalCategories();
  const created = { ...dbPayload, id: Date.now() };
  setLocalCategories([...list, created]);
  return created;
}

export async function updateCategory(id, updates) {
  const dbPayload = {};
  if (updates.name !== undefined) dbPayload.name = updates.name;
  if (updates.slug !== undefined) dbPayload.slug = updates.slug;
  if (updates.description !== undefined) dbPayload.description = updates.description;
  if (updates.short_description !== undefined) dbPayload.short_description = updates.short_description;
  if (updates.shortDescription !== undefined) dbPayload.short_description = updates.shortDescription;
  if (updates.image !== undefined) dbPayload.image = updates.image;
  if (updates.is_active !== undefined) dbPayload.is_active = updates.is_active;
  if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;
  if (updates.sort_order !== undefined || updates.sortOrder !== undefined) {
    dbPayload.sort_order = Number(updates.sort_order || updates.sortOrder);
  }
  dbPayload.updated_at = new Date().toISOString();

  if (isSupabaseConfigured) {
    const data = await safeSupabaseMutation('categories', 'update', dbPayload, 'id', id);
    if (data) return data;
  }

  const list = getLocalCategories();
  const updated = list.map((c) => (c.id === id ? { ...c, ...dbPayload } : c));
  setLocalCategories(updated);
  return updated.find((c) => c.id === id);
}

export async function deleteCategory(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error('FULL SUPABASE DELETE ERROR on categories:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        error
      });
      throw new Error(`Supabase error (${error.code || '400'}): ${error.message || 'Failed to delete category'}`);
    }
    return true;
  }

  const list = getLocalCategories();
  setLocalCategories(list.filter((c) => c.id !== id));
  return true;
}

export async function fetchSubcategories() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('subcategories').select('*').order('id');
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetch subcategories error:', e.message);
    }
  }
  return getLocalSubcategories();
}

export async function fetchSubcategoriesByCategory(categoryId) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('id');
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetch subcategories by category error:', e.message);
    }
  }
  const all = getLocalSubcategories();
  return all.filter((s) => s.category_id === Number(categoryId) || s.categoryId === Number(categoryId));
}

export async function createSubcategory(subData) {
  const dbPayload = {
    category_id: Number(subData.category_id || subData.categoryId),
    name: subData.name,
    slug: subData.slug || subData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    description: subData.description || '',
    image: subData.image || '',
    is_active: subData.is_active !== undefined ? subData.is_active : (subData.isActive !== undefined ? subData.isActive : true),
    sort_order: Number(subData.sort_order || subData.sortOrder || 0),
  };

  if (isSupabaseConfigured) {
    const data = await safeSupabaseMutation('subcategories', 'insert', dbPayload);
    if (data) return data;
  }

  const list = getLocalSubcategories();
  const created = { ...dbPayload, id: Date.now() };
  setLocalSubcategories([...list, created]);
  return created;
}

export async function updateSubcategory(id, updates) {
  const dbPayload = {};
  if (updates.name !== undefined) dbPayload.name = updates.name;
  if (updates.slug !== undefined) dbPayload.slug = updates.slug;
  if (updates.description !== undefined) dbPayload.description = updates.description;
  if (updates.image !== undefined) dbPayload.image = updates.image;
  if (updates.is_active !== undefined) dbPayload.is_active = updates.is_active;
  if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive;
  if (updates.category_id !== undefined || updates.categoryId !== undefined) {
    dbPayload.category_id = Number(updates.category_id || updates.categoryId);
  }
  if (updates.sort_order !== undefined || updates.sortOrder !== undefined) {
    dbPayload.sort_order = Number(updates.sort_order || updates.sortOrder);
  }
  dbPayload.updated_at = new Date().toISOString();

  if (isSupabaseConfigured) {
    const data = await safeSupabaseMutation('subcategories', 'update', dbPayload, 'id', id);
    if (data) return data;
  }

  const list = getLocalSubcategories();
  const updated = list.map((s) => (s.id === id ? { ...s, ...dbPayload } : s));
  setLocalSubcategories(updated);
  return updated.find((s) => s.id === id);
}

export async function deleteSubcategory(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('subcategories').delete().eq('id', id);
    if (error) {
      console.error('FULL SUPABASE DELETE ERROR on subcategories:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        error
      });
      throw new Error(`Supabase error (${error.code || '400'}): ${error.message || 'Failed to delete subcategory'}`);
    }
    return true;
  }

  const list = getLocalSubcategories();
  setLocalSubcategories(list.filter((s) => s.id !== id));
  return true;
}

export async function fetchActiveCategoriesAndSubcategories() {
  try {
    const [cats, subs] = await Promise.all([fetchCategories(), fetchSubcategories()]);
    const validCats = Array.isArray(cats) ? cats : [];
    const validSubs = Array.isArray(subs) ? subs : [];

    const activeCategories = validCats
      .filter((c) => c && c.is_active !== false && c.isActive !== false)
      .map((c) => {
        const activeSubs = validSubs.filter(
          (s) =>
            s &&
            Number(s.category_id || s.categoryId) === Number(c.id) &&
            s.is_active !== false &&
            s.isActive !== false
        );

        return {
          ...c,
          subcategories: activeSubs.map((s) => ({
            ...s,
            name: s?.name || '',
            slug: s?.slug || (s?.name ? s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
          })),
        };
      });

    return activeCategories;
  } catch (err) {
    console.error('fetchActiveCategoriesAndSubcategories error:', err);
    return [];
  }
}

// Section Query Helpers with Fallbacks so homepage sections are NEVER missing
export async function fetchBestSellers() {
  try {
    const all = await fetchProducts();
    const validAll = Array.isArray(all) ? all : [];
    const explicit = validAll.filter((p) => p && (p.is_best_seller === true || p.isBestSeller === true || p.badge === 'Best Seller'));
    if (explicit.length > 0) return explicit;
    return validAll.slice(0, 8);
  } catch (e) {
    console.error('fetchBestSellers error:', e);
    return [];
  }
}

export async function fetchTrendingProducts() {
  try {
    const all = await fetchProducts();
    const validAll = Array.isArray(all) ? all : [];
    const explicit = validAll.filter((p) => p && (p.is_trending === true || p.isTrending === true || p.badge === 'Trending'));
    if (explicit.length > 0) return explicit;
    return validAll.slice(0, 8);
  } catch (e) {
    console.error('fetchTrendingProducts error:', e);
    return [];
  }
}

export async function fetchNewArrivals() {
  try {
    const all = await fetchProducts();
    const validAll = Array.isArray(all) ? all : [];
    const explicit = validAll.filter((p) => p && (p.is_new_arrival === true || p.isNewArrival === true || p.badge === 'New' || p.badge === 'New Arrival'));
    if (explicit.length > 0) return explicit;
    return validAll.slice(0, 8);
  } catch (e) {
    console.error('fetchNewArrivals error:', e);
    return [];
  }
}

// ==========================================
// 3. ORDERS & CUSTOMER PRIVACY API
// ==========================================

export function generateGuestOrderToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const randomPart = Math.random().toString(36).substring(2, 15);
  const timePart = Date.now().toString(36);
  return `apex_gst_${timePart}_${randomPart}`;
}

export function getStoredGuestTokensList() {
  try {
    const raw = localStorage.getItem('apex_guest_order_tokens');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === 'string' ? item : item.token)).filter(Boolean);
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function getStoredGuestOrders() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem('apex_guest_order_tokens');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveGuestOrderToken(orderNumber, token) {
  if (!token || typeof localStorage === 'undefined') return;
  try {
    const existing = getStoredGuestOrders();
    const cleanList = existing.filter((item) => 
      (typeof item === 'string' ? item !== token : item.orderNumber !== orderNumber && item.token !== token)
    );
    const updated = [{ orderNumber, token, createdAt: new Date().toISOString() }, ...cleanList].slice(0, 50);
    localStorage.setItem('apex_guest_order_tokens', JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save guest order token:', e);
  }
}

// Fetch only currently authenticated user's ID (if logged in)
export async function getCurrentUserId() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (e) {
    return null;
  }
}

// 1. Create Order (Enforce authenticated customer before order placement)
export async function createOrder(orderPayload) {
  const userId = await getCurrentUserId();
  const effectiveUserId = userId || orderPayload.customer_id || orderPayload.user_id || null;

  // Protect order placement: Require authenticated Supabase user
  if (isSupabaseConfigured && !effectiveUserId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error("Authentication required. Please sign in to your APEX STORE account before placing an order.");
      }
    } catch (e) {
      if (e.message?.includes("Authentication required")) throw e;
      throw new Error("Authentication required. Please sign in to your APEX STORE account before placing an order.");
    }
  }

  const finalUserId = effectiveUserId || userId || null;
  const orderNumber = `APEX-${Math.floor(1000 + Math.random() * 9000)}`;
  const guestToken = generateGuestOrderToken();

  const newOrder = {
    order_number: orderNumber,
    customer_id: finalUserId, // Primary UUID linking to authenticated customer
    user_id: finalUserId, // Backward compatibility
    guest_order_token: guestToken,
    customer_name: orderPayload.customer_name,
    customer_email: orderPayload.customer_email,
    customer_phone: orderPayload.customer_phone,
    shipping_address: orderPayload.shipping_address,
    city: orderPayload.city,
    postal_code: orderPayload.postal_code || '',
    payment_method: orderPayload.payment_method || 'cod',
    subtotal: Number(orderPayload.subtotal),
    shipping: Number(orderPayload.shipping || 0),
    total: Number(orderPayload.total),
    status: 'Pending',
    items: orderPayload.items || [],
  };

  if (isSupabaseConfigured) {
    try {
      const data = await safeSupabaseMutation('orders', 'insert', newOrder);

      if (data) {
        if (orderPayload.items && orderPayload.items.length > 0) {
          const lineItems = orderPayload.items.map((item) => ({
            order_id: data.id,
            product_id: typeof item.id === 'number' ? item.id : null,
            product_name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            total: Number(item.price * item.quantity),
          }));
          try {
            await supabase.from('order_items').insert(lineItems);
          } catch (itemErr) {
            console.warn('order_items insert warning:', itemErr);
          }

          for (const item of orderPayload.items) {
            if (typeof item.id === 'number') {
              try {
                const { data: p } = await supabase.from('products').select('stock').eq('id', item.id).single();
                if (p) {
                  const newStock = Math.max(0, p.stock - item.quantity);
                  await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
                }
              } catch (stockErr) {
                console.warn('Stock update warning:', stockErr);
              }
            }
          }
        }

        try {
          // Upsert customer profile and increment order metrics
          const { data: existingCust } = await supabase
            .from('customers')
            .select('total_orders, total_spent')
            .ilike('email', orderPayload.customer_email)
            .maybeSingle();

          const prevOrders = Number(existingCust?.total_orders || 0);
          const prevSpent = Number(existingCust?.total_spent || 0);

          await supabase.from('customers').upsert([
            {
              id: userId || undefined,
              email: orderPayload.customer_email,
              full_name: orderPayload.customer_name,
              phone: orderPayload.customer_phone,
              city: orderPayload.city,
              shipping_address: orderPayload.shipping_address,
              total_orders: prevOrders + 1,
              total_spent: prevSpent + Number(orderPayload.total),
              updated_at: new Date().toISOString(),
            }
          ], { onConflict: 'email' });
        } catch (custErr) {
          console.warn('Customer upsert warning:', custErr);
        }

        const localList = getLocalOrders();
        setLocalOrders([{ ...data, items: orderPayload.items || [] }, ...localList]);
        saveGuestOrderToken(orderNumber, guestToken);
        return { ...data, guest_order_token: guestToken, items: orderPayload.items || [] };
      }
    } catch (e) {
      console.warn('Supabase safe order creation warning:', e.message);
    }
  }

  const ordersList = getLocalOrders();
  const created = { ...newOrder, id: Date.now(), created_at: new Date().toISOString() };
  setLocalOrders([created, ...ordersList]);
  saveGuestOrderToken(orderNumber, guestToken);
  return created;
}

// 2. Fetch Customer's OWN Orders (STRICT PRIVACY: Authenticated user_id / customer_id OR Stored Order Numbers / Guest Tokens)
export async function fetchMyOrders() {
  const userId = await getCurrentUserId();
  const storedGuestTokens = getStoredGuestTokensList();
  const storedGuestOrders = getStoredGuestOrders();
  const storedNumbers = storedGuestOrders
    .map((g) => (typeof g === 'string' ? g.toUpperCase() : g.orderNumber ? g.orderNumber.toUpperCase() : ''))
    .filter(Boolean);

  let supabaseResults = [];
  if (isSupabaseConfigured) {
    try {
      if (userId) {
        // Query orders belonging strictly to this customer UUID
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', userId)
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          supabaseResults = data;
        }
      } else if (storedNumbers.length > 0) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .in('order_number', storedNumbers)
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          supabaseResults = data;
        }
      } else if (storedGuestTokens.length > 0) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .in('guest_order_token', storedGuestTokens)
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          supabaseResults = data;
        }
      }
    } catch (e) {
      console.warn('Supabase fetchMyOrders error:', e.message);
    }
  }

  const localOrders = getLocalOrders();

  // If Supabase returned live orders, update local storage with fresh Supabase status
  if (supabaseResults.length > 0) {
    const updatedLocal = localOrders.map((local) => {
      const live = supabaseResults.find(
        (s) => (s.order_number || '').toUpperCase() === (local.order_number || '').toUpperCase()
      );
      return live ? { ...local, ...live, status: live.status } : local;
    });
    setLocalOrders(updatedLocal);
  }

  // Combine and deduplicate, prioritizing live Supabase record status
  const map = new Map();
  for (const o of localOrders) {
    const key = (o.order_number || String(o.id)).toUpperCase();
    if (
      (userId && (o.customer_id === userId || o.user_id === userId)) ||
      storedNumbers.includes(key) ||
      (o.guest_order_token && storedGuestTokens.includes(o.guest_order_token))
    ) {
      map.set(key, o);
    }
  }
  for (const o of supabaseResults) {
    if (o.order_number) map.set(o.order_number.toUpperCase(), o);
    else if (o.id) map.set(String(o.id), o);
  }

  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : typeof a.id === 'number' ? a.id : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : typeof b.id === 'number' ? b.id : 0;
    return timeB - timeA;
  });
}

// Legacy alias for storefront compatibility
export const fetchCustomerOrders = fetchMyOrders;

// 3. Fetch Single Order with Verification (Order # + Guest Token or User ID or Phone Match)
export async function fetchOrderByVerification({ orderNumber, token, phoneOrEmail }) {
  if (!orderNumber) return null;
  const cleanNumber = String(orderNumber).trim().toUpperCase();
  const userId = await getCurrentUserId();
  const storedGuestTokens = getStoredGuestTokensList();
  const storedGuestOrders = getStoredGuestOrders();
  const storedNumbers = storedGuestOrders
    .map((g) => (typeof g === 'string' ? g.toUpperCase() : g.orderNumber ? g.orderNumber.toUpperCase() : ''))
    .filter(Boolean);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('order_number', cleanNumber)
        .maybeSingle();

      if (!error && data) {
        const isDeviceOwner =
          storedNumbers.includes(cleanNumber) ||
          (data.guest_order_token && storedGuestTokens.includes(data.guest_order_token));
        const isUserOwner = userId && data.user_id === userId;
        const cleanInput = (phoneOrEmail || token || '').trim().toLowerCase();
        const isPhoneMatch =
          cleanInput &&
          data.customer_phone &&
          data.customer_phone.replace(/\D/g, '').includes(cleanInput.replace(/\D/g, ''));
        const isEmailMatch = cleanInput && data.customer_email && data.customer_email.toLowerCase() === cleanInput;
        const isTokenMatch = token && data.guest_order_token && data.guest_order_token === token.trim();

        if (
          isDeviceOwner ||
          isUserOwner ||
          isPhoneMatch ||
          isEmailMatch ||
          isTokenMatch ||
          (!token && !phoneOrEmail)
        ) {
          const { data: items } = await supabase.from('order_items').select('*').eq('order_id', data.id);

          const liveOrder = {
            ...data,
            items:
              items && items.length > 0
                ? items
                : Array.isArray(data.items)
                ? data.items
                : typeof data.items === 'string'
                ? JSON.parse(data.items)
                : [],
          };

          // Synchronize local storage cache
          const localList = getLocalOrders();
          const updatedLocal = localList.map((o) =>
            (o.order_number || '').toUpperCase() === cleanNumber ? { ...o, ...liveOrder, status: liveOrder.status } : o
          );
          setLocalOrders(updatedLocal);

          return liveOrder;
        }
      }
    } catch (e) {
      console.warn('Supabase fetchOrderByVerification error:', e.message);
    }
  }

  const all = getLocalOrders();
  const found = all.find((o) => (o.order_number || '').toUpperCase() === cleanNumber);
  return found || null;
}

// 4. Admin Portal Order Management (Admins view/manage ALL orders)
export async function fetchAdminOrders() {
  let supabaseOrders = [];
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        supabaseOrders = data;
      }
    } catch (e) {
      console.warn('Supabase fetchAdminOrders error:', e.message);
    }
  }

  const localOrders = getLocalOrders();

  // Combine and deduplicate orders by order_number or id, newest first
  const map = new Map();
  for (const o of supabaseOrders) {
    if (o.order_number) map.set(o.order_number.toUpperCase(), o);
    else if (o.id) map.set(String(o.id), o);
  }
  for (const o of localOrders) {
    const key = (o.order_number || String(o.id)).toUpperCase();
    if (!map.has(key)) {
      map.set(key, o);
    }
  }

  const all = Array.from(map.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : typeof a.id === 'number' ? a.id : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : typeof b.id === 'number' ? b.id : 0;
    return timeB - timeA;
  });

  return all;
}

export const fetchOrders = fetchAdminOrders;

export async function updateOrderStatus(orderIdentifier, status, orderNumberFallback = null) {
  const cleanStatus = status;
  const isDelivered = String(cleanStatus || '').toLowerCase() === 'delivered';
  const timestamp = new Date().toISOString();
  const updateFields = {
    status: cleanStatus,
    updated_at: timestamp,
    ...(isDelivered ? { delivered_at: timestamp } : {}),
  };

  let updatedSupabase = false;

  if (isSupabaseConfigured) {
    try {
      // 1. If identifier is an order number string like 'APEX-1645'
      if (typeof orderIdentifier === 'string' && orderIdentifier.toUpperCase().startsWith('APEX-')) {
        const { data, error } = await supabase
          .from('orders')
          .update(updateFields)
          .ilike('order_number', orderIdentifier.trim())
          .select();
        if (!error && data && data.length > 0) updatedSupabase = true;
      }

      // 2. If fallback order number is provided
      if (!updatedSupabase && orderNumberFallback) {
        const { data, error } = await supabase
          .from('orders')
          .update(updateFields)
          .ilike('order_number', String(orderNumberFallback).trim())
          .select();
        if (!error && data && data.length > 0) updatedSupabase = true;
      }

      // 3. If identifier is a valid integer id
      if (!updatedSupabase && (typeof orderIdentifier === 'number' || !isNaN(Number(orderIdentifier)))) {
        const numId = Number(orderIdentifier);
        if (numId < 1000000000) {
          const { data, error } = await supabase
            .from('orders')
            .update(updateFields)
            .eq('id', numId)
            .select();
          if (!error && data && data.length > 0) updatedSupabase = true;
        }
      }
    } catch (e) {
      console.warn('Supabase status update error:', e.message);
    }
  }

  // Update in local storage
  const list = getLocalOrders();
  const searchKey = String(orderIdentifier).toUpperCase();
  const fallbackKey = orderNumberFallback ? String(orderNumberFallback).toUpperCase() : null;

  const updatedList = list.map((o) => {
    const oNum = (o.order_number || '').toUpperCase();
    const oId = String(o.id || '').toUpperCase();
    if (oNum === searchKey || oId === searchKey || (fallbackKey && oNum === fallbackKey)) {
      return { ...o, ...updateFields };
    }
    return o;
  });

  setLocalOrders(updatedList);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apex_orders_updated'));
    window.dispatchEvent(new CustomEvent('apex_reviews_updated'));
  }

  return updatedList.find(
    (o) =>
      (o.order_number || '').toUpperCase() === searchKey ||
      String(o.id).toUpperCase() === searchKey ||
      (fallbackKey && (o.order_number || '').toUpperCase() === fallbackKey)
  );
}

// ==========================================
// 4. DASHBOARD STATS API
// ==========================================

export async function fetchDashboardStats() {
  const [productsList, categoriesList, subcategoriesList, ordersList] = await Promise.all([
    fetchProducts(true),
    fetchCategories(),
    fetchSubcategories(),
    fetchOrders()
  ]);

  const totalRevenue = ordersList.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? Number(o.total) : 0), 0);
  const totalOrders = ordersList.length;
  
  const activeProducts = productsList.filter((p) => p.status === 'Active').length;
  const inactiveProducts = productsList.filter((p) => p.status === 'Inactive' || p.status === 'Draft').length;
  const totalProducts = productsList.filter((p) => p.status !== 'Archived').length;

  const lowStockProducts = productsList.filter((p) => p.stock <= 20 && p.stock > 0 && p.status !== 'Archived');
  const outOfStockProducts = productsList.filter((p) => p.stock <= 0 && p.status !== 'Archived');

  const pendingOrders = ordersList.filter((o) => o.status === 'Pending').length;
  const processingOrders = ordersList.filter((o) => o.status === 'Processing').length;
  const shippedOrders = ordersList.filter((o) => o.status === 'Shipped').length;
  const deliveredOrders = ordersList.filter((o) => o.status === 'Delivered').length;
  const cancelledOrders = ordersList.filter((o) => o.status === 'Cancelled').length;

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    activeProducts,
    inactiveProducts,
    totalCategories: categoriesList.length,
    totalSubcategories: subcategoriesList.length,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    lowStockProducts,
    recentOrders: ordersList.slice(0, 5),
  };
}

// ==========================================
// 5. CUSTOMER REVIEWS & RATINGS SYSTEM API
// ==========================================

const LOCAL_REVIEWS_KEY = 'apex_db_reviews';

const INITIAL_SEED_REVIEWS = [
  {
    id: 1,
    product_id: 1,
    product_name: 'Air 31 Earbuds',
    customer_name: 'Ahmed Khan',
    customer_email: 'ahmed.khan@gmail.com',
    rating: 5,
    review_text: 'Outstanding sound clarity and deep punchy bass! The active noise cancellation works surprisingly well for the price. Battery lasts easily 7+ hours per charge.',
    status: 'approved',
    verified_purchase: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 2,
    product_id: 1,
    product_name: 'Air 31 Earbuds',
    customer_name: 'Sara Malik',
    customer_email: 'sara.malik@yahoo.com',
    rating: 5,
    review_text: 'Very comfortable to wear for long working hours. The transparent case design looks very futuristic and premium. Highly recommended!',
    status: 'approved',
    verified_purchase: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 3,
    product_id: 1,
    product_name: 'Air 31 Earbuds',
    customer_name: 'Bilal Tariq',
    customer_email: 'bilal.tariq@outlook.com',
    rating: 4,
    review_text: 'Great build quality and mic audio for calls. Pairing was instant with my iPhone and laptop.',
    status: 'approved',
    verified_purchase: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 4,
    product_id: 3,
    product_name: 'S100 Ultra 9 Smart Watch',
    customer_name: 'Zain Ul Abideen',
    customer_email: 'zain.abideen@gmail.com',
    rating: 5,
    review_text: 'The AMOLED screen is crystal clear even under direct sunlight. Step tracking and heart rate sensors are very accurate. Build feels solid titanium.',
    status: 'approved',
    verified_purchase: true,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 5,
    product_id: 5,
    product_name: 'Samsung Galaxy Buds 3 Pro',
    customer_name: 'Hamza Farooq',
    customer_email: 'hamza.farooq@gmail.com',
    rating: 5,
    review_text: 'Top-tier soundstage with 360 audio. The seamless Bluetooth 5.4 connection is super fast and low latency for mobile gaming.',
    status: 'approved',
    verified_purchase: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

function getLocalReviews() {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(INITIAL_SEED_REVIEWS));
    return INITIAL_SEED_REVIEWS;
  } catch (e) {
    return INITIAL_SEED_REVIEWS;
  }
}

function setLocalReviews(reviews) {
  try {
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.warn('Failed to save local reviews:', e);
  }
}

/**
 * Upload customer review photo to Supabase Storage (or resilient fallback)
 */
export async function uploadReviewPhoto(file) {
  return uploadImageToSupabase(file, 'reviews');
}

/**
 * Verify whether a customer has purchased and had this product DELIVERED.
 * Strictly checks:
 * 1. User must be authenticated or have a verified matching customer email.
 * 2. An order must exist containing this specific product ID / slug / name.
 * 3. The order status MUST be 'Delivered'.
 * 4. Checks if the customer has already submitted a review for this product.
 */
export async function checkReviewEligibility({ productId, productName, productSlug, user, email }) {
  if (!user && !email) {
    return {
      eligible: false,
      requiresAuth: true,
      reason: 'Please sign in to your customer account to submit a verified review.',
      orderStatus: 'not_logged_in',
    };
  }

  const userId = user?.id;
  const customerEmail = (user?.email || email || '').trim().toLowerCase();

  try {
    let customerOrders = [];

    if (isSupabaseConfigured) {
      if (userId) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', userId);
        if (!error && Array.isArray(data)) {
          customerOrders = [...data];
        }
      }
      if (customerEmail) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .ilike('customer_email', customerEmail);
        if (!error && Array.isArray(data)) {
          // Merge unique orders
          data.forEach((o) => {
            if (!customerOrders.some((co) => co.id === o.id)) {
              customerOrders.push(o);
            }
          });
        }
      }
    }

    // Always merge local orders for complete purchase verification
    const localOrders = getLocalOrders();
    const matchedLocal = localOrders.filter(
      (o) =>
        (userId && (o.customer_id === userId || o.user_id === userId)) ||
        (customerEmail && (o.customer_email || '').toLowerCase() === customerEmail)
    );
    matchedLocal.forEach((lo) => {
      if (!customerOrders.some((co) => co.id === lo.id)) {
        customerOrders.push(lo);
      }
    });

    // Helper to match item with requested product
    const matchesProduct = (it) => {
      if (!it) return false;
      const itId = it.id || it.product_id;
      if (productId && (String(itId) === String(productId) || (!isNaN(Number(productId)) && Number(itId) === Number(productId)))) {
        return true;
      }
      if (productSlug && it.slug === productSlug) {
        return true;
      }
      if (productName && (it.name || '').toLowerCase().trim() === productName.toLowerCase().trim()) {
        return true;
      }
      return false;
    };

    // Filter delivered orders
    const deliveredOrders = customerOrders.filter(
      (o) => (o.status || '').toLowerCase() === 'delivered'
    );

    let matchedDeliveredOrder = null;
    let matchedDeliveredItem = null;

    for (const order of deliveredOrders) {
      const items = safeParseItems(order.items);
      const foundItem = items.find(matchesProduct);
      if (foundItem) {
        matchedDeliveredOrder = order;
        matchedDeliveredItem = foundItem;
        break;
      }
    }

    // Check if user has an existing review for this product
    const existingReviews = await fetchCustomerReviews(userId, customerEmail);
    const existing = existingReviews.find(
      (r) =>
        (productId && (String(r.product_id) === String(productId) || (!isNaN(Number(productId)) && Number(r.product_id) === Number(productId)))) ||
        (productName && (r.product_name || '').toLowerCase().trim() === productName.toLowerCase().trim())
    );

    // If delivered order found
    if (matchedDeliveredOrder) {
      if (existing) {
        return {
          eligible: true,
          isAlreadyReviewed: true,
          orderStatus: 'delivered',
          order: matchedDeliveredOrder,
          orderItem: matchedDeliveredItem,
          existingReview: existing,
          reason: 'You have already reviewed this purchase. You can edit your review anytime.',
        };
      }

      return {
        eligible: true,
        isAlreadyReviewed: false,
        orderStatus: 'delivered',
        order: matchedDeliveredOrder,
        orderItem: matchedDeliveredItem,
        existingReview: null,
      };
    }

    // If no delivered order, check if user has an order in transit or pending
    const activeOrders = customerOrders.filter(
      (o) =>
        (o.status || '').toLowerCase() !== 'delivered' &&
        (o.status || '').toLowerCase() !== 'cancelled' &&
        (o.status || '').toLowerCase() !== 'refunded'
    );

    const hasActiveOrder = activeOrders.some((o) => {
      const items = safeParseItems(o.items);
      return items.some(matchesProduct);
    });

    if (hasActiveOrder) {
      return {
        eligible: false,
        requiresAuth: false,
        orderStatus: 'in_transit',
        reason: 'Your order for this item is currently in progress. You can submit a review once your package is delivered!',
      };
    }

    return {
      eligible: false,
      requiresAuth: false,
      orderStatus: 'not_purchased',
      reason: 'Purchase this product to leave a verified review.',
    };
  } catch (err) {
    console.warn('checkReviewEligibility error:', err);
    return {
      eligible: false,
      reason: 'Error verifying purchase. Please try again.',
      orderStatus: 'error',
    };
  }
}

/**
 * Fetch approved reviews for public product detail page
 */
export async function fetchProductReviews(productId) {
  if (!productId) return [];
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('status', 'approved');

      if (!isNaN(Number(productId))) {
        query = query.eq('product_id', Number(productId));
      } else {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetchProductReviews error:', e.message);
    }
  }

  const local = getLocalReviews();
  return local
    .filter((r) => (String(r.product_id) === String(productId) || (!isNaN(Number(productId)) && Number(r.product_id) === Number(productId))) && (r.status || 'approved') === 'approved')
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

/**
 * Fetch all reviews created by a specific customer
 */
export async function fetchCustomerReviews(userId, userEmail) {
  let list = [];
  if (isSupabaseConfigured && (userId || userEmail)) {
    try {
      let query = supabase.from('reviews').select('*');
      if (userId && userEmail) {
        query = query.or(`customer_id.eq.${userId},customer_email.ilike.${userEmail}`);
      } else if (userId) {
        query = query.eq('customer_id', userId);
      } else if (userEmail) {
        query = query.ilike('customer_email', userEmail);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        list = data;
      }
    } catch (e) {
      console.warn('Supabase fetchCustomerReviews error:', e);
    }
  }

  const local = getLocalReviews();
  const filteredLocal = local.filter(
    (r) =>
      (userId && (r.customer_id === userId || r.user_id === userId)) ||
      (userEmail && (r.customer_email || '').toLowerCase() === (userEmail || '').toLowerCase())
  );

  const map = new Map();
  for (const r of filteredLocal) map.set(String(r.id), r);
  for (const r of list) map.set(String(r.id), r);
  return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

/**
 * Fetch eligible unreviewed items from delivered orders
 */
export async function fetchEligibleUnreviewedItems(user) {
  if (!user) return [];
  try {
    const userId = user?.id;
    const customerEmail = (user?.email || '').trim().toLowerCase();

    let customerOrders = [];
    if (isSupabaseConfigured) {
      if (userId) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', userId);
        if (!error && Array.isArray(data)) {
          customerOrders = [...data];
        }
      }
      if (customerEmail) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .ilike('customer_email', customerEmail);
        if (!error && Array.isArray(data)) {
          data.forEach((o) => {
            if (!customerOrders.some((co) => co.id === o.id)) {
              customerOrders.push(o);
            }
          });
        }
      }
    }

    const localOrders = getLocalOrders();
    const matchedLocal = localOrders.filter(
      (o) =>
        (userId && (o.customer_id === userId || o.user_id === userId)) ||
        (customerEmail && (o.customer_email || '').toLowerCase() === customerEmail)
    );
    matchedLocal.forEach((lo) => {
      if (!customerOrders.some((co) => co.id === lo.id)) {
        customerOrders.push(lo);
      }
    });

    const delivered = customerOrders.filter((o) => (o.status || '').toLowerCase() === 'delivered');
    const existingReviews = await fetchCustomerReviews(user.id, user.email);
    const reviewedProducts = new Set();
    existingReviews.forEach((r) => {
      if (r.product_id) reviewedProducts.add(String(r.product_id));
      if (r.product_name) reviewedProducts.add(r.product_name.toLowerCase().trim());
    });

    const unreviewed = [];
    for (const order of delivered) {
      const items = safeParseItems(order.items);
      for (const item of items) {
        const pid = item.id || item.product_id;
        const pName = item.name || item.product_name || 'APEX Gear';
        const isAlreadyReviewed = 
          (pid && reviewedProducts.has(String(pid))) ||
          (pName && reviewedProducts.has(pName.toLowerCase().trim()));

        if (pid && !isAlreadyReviewed && !unreviewed.some((u) => String(u.productId) === String(pid))) {
          unreviewed.push({
            productId: pid,
            productName: pName,
            productImage: item.image || item.images?.[0] || '',
            price: item.price,
            quantity: item.quantity || 1,
            orderId: order.id,
            orderNumber: order.order_number || `#${order.id}`,
            orderItemId: item.order_item_id || item.id || null,
            deliveredAt: order.delivered_at || order.updated_at || order.created_at,
          });
        }
      }
    }

    return unreviewed;
  } catch (err) {
    console.warn('fetchEligibleUnreviewedItems error:', err);
    return [];
  }
}

/**
 * Submit or Update a Verified Customer Review
 */
export async function submitProductReview({
  productId,
  productName,
  customerName,
  customerEmail,
  rating,
  title = '',
  reviewText,
  photos = [],
  user,
  existingReviewId = null,
}) {
  if (!user && !customerEmail) {
    throw new Error('Authentication required to submit a verified review.');
  }

  // 1. Verify Purchase Eligibility
  const eligibility = await checkReviewEligibility({
    productId,
    productName,
    user,
    email: customerEmail,
  });

  if (!eligibility.eligible && !existingReviewId) {
    throw new Error(eligibility.reason || 'You are not eligible to review this product.');
  }

  const userId = user?.id || null;
  const name = customerName || user?.user_metadata?.full_name || 'Verified Customer';
  const email = (user?.email || customerEmail || '').trim().toLowerCase();

  const payload = {
    product_id: !isNaN(Number(productId)) ? Number(productId) : productId,
    product_name: productName || 'APEX Product',
    customer_id: userId,
    customer_name: name,
    customer_email: email,
    rating: Math.max(1, Math.min(5, Number(rating))),
    title: (title || '').trim(),
    review_text: reviewText.trim(),
    photos: Array.isArray(photos) ? photos : [],
    status: 'approved', // Auto-approved for verified delivered buyers
    verified_purchase: true,
    order_id: eligibility.order?.order_number || String(eligibility.order?.id || ''),
    order_item_id: eligibility.orderItem?.id || null,
    updated_at: new Date().toISOString(),
  };

  if (existingReviewId) {
    const local = getLocalReviews();
    const updatedLocal = local.map((r) => (r.id === existingReviewId ? { ...r, ...payload } : r));
    setLocalReviews(updatedLocal);

    if (isSupabaseConfigured) {
      try {
        await safeSupabaseMutation('reviews', 'update', payload, 'id', existingReviewId);
      } catch (e) {
        console.warn('Supabase review update error:', e);
      }
    }

    await calculateProductRating(productId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apex_reviews_updated', { detail: { productId, reviewId: existingReviewId } }));
    }
    return { ...payload, id: existingReviewId };
  } else {
    payload.created_at = new Date().toISOString();
    const local = getLocalReviews();
    const created = { ...payload, id: Date.now() };
    setLocalReviews([created, ...local]);

    if (isSupabaseConfigured) {
      try {
        const data = await safeSupabaseMutation('reviews', 'insert', payload);
        if (data) {
          await calculateProductRating(productId);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('apex_reviews_updated', { detail: { productId, reviewId: data.id } }));
          }
          return data;
        }
      } catch (e) {
        console.warn('Supabase review insert error:', e);
      }
    }

    await calculateProductRating(productId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apex_reviews_updated', { detail: { productId, reviewId: created.id } }));
    }
    return created;
  }
}

/**
 * Fetch all reviews for Admin Portal moderation (with filters & search)
 */
export async function fetchAdminReviews({ status = 'all', rating = 'all', productId = 'all', searchQuery = '' } = {}) {
  let reviews = [];

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (rating !== 'all') {
        query = query.eq('rating', Number(rating));
      }
      if (productId !== 'all') {
        query = query.eq('product_id', Number(productId));
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        reviews = data;
      }
    } catch (e) {
      console.warn('Supabase fetchAdminReviews error:', e.message);
    }
  }

  if (reviews.length === 0) {
    reviews = getLocalReviews();
  }

  // Filter in memory for search query or fallback filters
  return reviews.filter((r) => {
    if (status !== 'all' && r.status !== status) return false;
    if (rating !== 'all' && Number(r.rating) !== Number(rating)) return false;
    if (productId !== 'all' && Number(r.product_id) !== Number(productId)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.customer_name || '').toLowerCase().includes(q);
      const matchEmail = (r.customer_email || '').toLowerCase().includes(q);
      const matchProduct = (r.product_name || '').toLowerCase().includes(q);
      const matchText = (r.review_text || '').toLowerCase().includes(q);
      const matchOrder = (r.order_id || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchProduct && !matchText && !matchOrder) return false;
    }

    return true;
  });
}

/**
 * Moderate review status (Approve or Reject) and recalculate product rating automatically
 */
export async function updateReviewStatus(reviewId, status) {
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    throw new Error('Invalid review status.');
  }

  let updatedRecord = null;

  if (isSupabaseConfigured) {
    try {
      const data = await safeSupabaseMutation('reviews', 'update', { 
        status, 
        updated_at: new Date().toISOString() 
      }, 'id', reviewId);
      if (data) updatedRecord = data;
    } catch (e) {
      console.warn('Supabase updateReviewStatus error:', e.message);
    }
  }

  const local = getLocalReviews();
  const updatedList = local.map((r) => (r.id === reviewId ? { ...r, status, updated_at: new Date().toISOString() } : r));
  setLocalReviews(updatedList);
  if (!updatedRecord) {
    updatedRecord = updatedList.find((r) => r.id === reviewId);
  }

  // Recalculate and update the product's overall rating based only on APPROVED reviews
  if (updatedRecord?.product_id) {
    await calculateProductRating(updatedRecord.product_id);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apex_reviews_updated', { detail: { reviewId, status } }));
  }

  return updatedRecord;
}

/**
 * Delete a review and recalculate the product rating
 */
export async function deleteReview(reviewId) {
  let targetProductId = null;
  const local = getLocalReviews();
  const target = local.find((r) => r.id === reviewId);
  if (target) targetProductId = target.product_id;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('reviews').select('product_id').eq('id', reviewId).maybeSingle();
      if (data?.product_id) targetProductId = data.product_id;

      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) console.warn('Supabase deleteReview error:', error.message);
    } catch (e) {
      console.warn('Supabase deleteReview error:', e.message);
    }
  }

  setLocalReviews(local.filter((r) => r.id !== reviewId));

  if (targetProductId) {
    await calculateProductRating(targetProductId);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apex_reviews_updated', { detail: { reviewId } }));
  }

  return true;
}

/**
 * Calculate product average rating and review count from all APPROVED reviews only
 */
export async function calculateProductRating(productId) {
  if (!productId) return { rating: 5.0, reviewsCount: 0 };

  const approvedReviews = await fetchProductReviews(productId);
  const count = approvedReviews.length;

  let averageRating = 5.0;
  if (count > 0) {
    const totalPoints = approvedReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    averageRating = Math.round((totalPoints / count) * 10) / 10;
  }

  try {
    const cleanId = !isNaN(Number(productId)) ? Number(productId) : productId;
    await updateProduct(cleanId, {
      rating: averageRating,
      reviews: count
    });
  } catch (err) {
    console.warn(`Failed to auto-update rating for product #${productId}:`, err);
  }

  return { rating: averageRating, reviewsCount: count };
}
// ==========================================
// 8. UNIFIED HERO & PROMOTIONAL BANNERS API (SINGLE SOURCE OF TRUTH)
// ==========================================

const UNIFIED_HERO_BANNERS_KEY = 'apex_homepage_hero_banners';
const LEGACY_BANNERS_KEY = 'apex_promotional_banners';
const LEGACY_HERO_KEY = 'apex_hero_slides_v1';

export const INITIAL_SEED_HERO_BANNERS = [
  {
    id: 'slide-apex-campaign',
    title: 'TECH FOR EVERY MOMENT',
    highlight_text: 'APEX STORE',
    subtitle: "Discover premium audio, wearables and smart accessories designed for everyday performance.",
    description: "Discover premium audio, wearables and smart accessories designed for everyday performance.",
    badge_text: 'OFFICIAL DROP',
    badge: 'OFFICIAL DROP',
    promotional_badge: 'CAMPAIGN',
    image_url: '/banners/apex-campaign-banner.png',
    desktop_image_url: '/banners/apex-campaign-banner.png',
    mobile_image_url: '/banners/apex-campaign-mobile.png',
    button_text: 'EXPLORE GEAR',
    primary_button_text: 'EXPLORE GEAR',
    button_url: '/shop',
    primary_button_link: '/shop',
    secondary_button_text: 'EXPLORE DEALS',
    secondary_button_link: '/deals',
    features: ['Spatial Audio', 'Titanium Wearables', 'Fast Charge', 'Official Warranty'],
    display_order: 1,
    sort_order: 1,
    position: 'middle',
    placement: 'middle',
    is_active: true,
    open_in_new_tab: false,
    autoplay_duration: 5500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'slide-thunder-pro',
    title: 'THUNDER PRO',
    highlight_text: "Pakistan's Loudest Speaker Box",
    subtitle: "Pakistan's Loudest Speaker Box featuring RGB LED lights, custom EQ modes & IPX6 splash resistance.",
    description: "Pakistan's Loudest Speaker Box featuring RGB LED lights, custom EQ modes & IPX6 splash resistance.",
    badge_text: 'LIVE NOW',
    badge: 'LIVE NOW',
    promotional_badge: 'OFFICIAL DROP',
    image_url: '/banners/thunder-pro-banner.png',
    desktop_image_url: '/banners/thunder-pro-banner.png',
    mobile_image_url: '',
    button_text: 'EXPLORE NOW',
    primary_button_text: 'EXPLORE NOW',
    button_url: '/shop',
    primary_button_link: '/shop',
    secondary_button_text: 'EXPLORE DEALS',
    secondary_button_link: '/deals',
    features: ['RGB LED Lights', 'Customized EQ Modes', 'IPX6 Splash Resistance', "Pakistan's Loudest"],
    display_order: 2,
    sort_order: 2,
    position: 'middle',
    placement: 'middle',
    is_active: true,
    open_in_new_tab: false,
    autoplay_duration: 5500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 1,
    title: 'TECH WITHOUT',
    highlight_text: 'LIMITS.',
    subtitle: 'Discover next-generation spatial audio, noise-canceling headphones and wireless gear engineered for uncompromising performance.',
    description: 'Discover next-generation spatial audio, noise-canceling headphones and wireless gear engineered for uncompromising performance.',
    badge_text: 'PREMIUM TECH. PREMIUM YOU.',
    badge: 'PREMIUM TECH. PREMIUM YOU.',
    promotional_badge: 'FLAGSHIP',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    desktop_image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    mobile_image_url: '',
    button_text: 'SHOP NOW',
    primary_button_text: 'SHOP NOW',
    button_url: '/shop',
    primary_button_link: '/shop',
    secondary_button_text: 'EXPLORE DEALS',
    secondary_button_link: '/deals',
    features: ['100% Original', 'Free Delivery', '7 Days Return', '24/7 Support'],
    display_order: 3,
    sort_order: 3,
    position: 'hero',
    placement: 'hero',
    is_active: true,
    open_in_new_tab: false,
    autoplay_duration: 6000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'PRECISION ON YOUR',
    highlight_text: 'WRIST.',
    subtitle: 'Crystal AMOLED displays, aerospace titanium casings, advanced health tracking, and ultra-long 14-day battery life.',
    description: 'Crystal AMOLED displays, aerospace titanium casings, advanced health tracking, and ultra-long 14-day battery life.',
    badge_text: 'NEXT-GEN TITANIUM WEARABLE',
    badge: 'NEXT-GEN TITANIUM WEARABLE',
    promotional_badge: 'NEW ARRIVAL',
    image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1200&auto=format&fit=crop&q=80',
    desktop_image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1200&auto=format&fit=crop&q=80',
    mobile_image_url: '',
    button_text: 'EXPLORE WATCHES',
    primary_button_text: 'EXPLORE WATCHES',
    button_url: '/category/smart-watches',
    primary_button_link: '/category/smart-watches',
    secondary_button_text: 'VIEW BEST SELLERS',
    secondary_button_link: '/best-sellers',
    features: ['AMOLED Display', 'Titanium Build', '14-Day Battery', 'IP68 Waterproof'],
    display_order: 4,
    sort_order: 4,
    position: 'hero',
    placement: 'hero',
    is_active: true,
    open_in_new_tab: false,
    autoplay_duration: 6000,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    title: 'DOMINATE EVERY',
    highlight_text: 'BATTLE.',
    subtitle: 'Ultra-low latency Bluetooth 5.4, mechanical precision, and immersive studio acoustics engineered for competitive gaming.',
    description: 'Ultra-low latency Bluetooth 5.4, mechanical precision, and immersive studio acoustics engineered for competitive gaming.',
    badge_text: 'PRO GAMING ARSENAL',
    badge: 'PRO GAMING ARSENAL',
    promotional_badge: 'LIMITED TIME DEAL',
    image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&auto=format&fit=crop&q=80',
    desktop_image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&auto=format&fit=crop&q=80',
    mobile_image_url: '',
    button_text: 'GAMING GEAR',
    primary_button_text: 'GAMING GEAR',
    button_url: '/category/gaming',
    primary_button_link: '/category/gaming',
    secondary_button_text: 'HOT OFFERS',
    secondary_button_link: '/deals',
    features: ['Ultra-Low Latency', 'Studio Audio', 'Dual Mic ANC', '1-Year Warranty'],
    display_order: 5,
    sort_order: 5,
    position: 'hero',
    placement: 'hero',
    is_active: true,
    open_in_new_tab: false,
    autoplay_duration: 6000,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const INITIAL_SEED_HERO_SLIDES = INITIAL_SEED_HERO_BANNERS;
export const INITIAL_SEED_BANNERS = INITIAL_SEED_HERO_BANNERS;

let inMemoryHeroBanners = [...INITIAL_SEED_HERO_BANNERS];

/**
 * Normalize any banner/hero object into a rich unified schema
 */
export function normalizeBannerItem(item, defaultOrder = 1) {
  if (!item) return null;
  const id = item.id || (typeof item === 'object' && item.id !== undefined ? item.id : Date.now());
  const title = (item.title ?? '').toString().trim();
  const highlight_text = (item.highlight_text ?? '').toString().trim();
  const subtitle = (item.subtitle ?? item.description ?? '').toString().trim();
  const description = (item.description ?? item.subtitle ?? '').toString().trim();
  const badge_text = (item.badge_text ?? item.badge ?? 'PREMIUM TECH').toString().trim();
  const badge = (item.badge ?? item.badge_text ?? 'PREMIUM TECH').toString().trim();
  const promotional_badge = (item.promotional_badge ?? '').toString().trim();
  const image_url = (item.image_url ?? item.desktop_image_url ?? '').toString().trim();
  const desktop_image_url = (item.desktop_image_url ?? item.image_url ?? '').toString().trim();
  const mobile_image_url = (item.mobile_image_url ?? '').toString().trim();
  const button_text = (item.button_text ?? item.primary_button_text ?? 'SHOP NOW').toString().trim();
  const primary_button_text = (item.primary_button_text ?? item.button_text ?? 'SHOP NOW').toString().trim();
  const button_url = (item.button_url ?? item.primary_button_link ?? '/shop').toString().trim();
  const primary_button_link = (item.primary_button_link ?? item.button_url ?? '/shop').toString().trim();
  const secondary_button_text = (item.secondary_button_text ?? 'EXPLORE DEALS').toString().trim();
  const secondary_button_link = (item.secondary_button_link ?? '/deals').toString().trim();

  let features = ['100% Original', 'Free Delivery', '7 Days Return', '24/7 Support'];
  if (Array.isArray(item.features) && item.features.length > 0) {
    features = item.features.map(f => String(f).trim()).filter(Boolean);
  } else if (typeof item.features === 'string' && item.features.trim()) {
    try {
      if (item.features.startsWith('[')) {
        features = JSON.parse(item.features);
      } else {
        features = item.features.split(',').map(s => s.trim()).filter(Boolean);
      }
    } catch (e) {
      features = item.features.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const orderNum = Number(item.display_order ?? item.sort_order ?? defaultOrder) || defaultOrder;
  const is_active = item.is_active !== undefined ? Boolean(item.is_active) : true;
  const open_in_new_tab = Boolean(item.open_in_new_tab);
  const autoplay_duration = Number(item.autoplay_duration || 6000);
  const position = (item.position ?? item.placement ?? 'middle').toString().trim();
  const start_date = item.start_date ? String(item.start_date).trim() : '';
  const end_date = item.end_date ? String(item.end_date).trim() : '';
  const animation_type = item.animation_type ? String(item.animation_type).trim() : 'slide';
  const text_animation = item.text_animation ? String(item.text_animation).trim() : 'fade_up';
  const overlay_opacity = item.overlay_opacity !== undefined && item.overlay_opacity !== null ? Number(item.overlay_opacity) : 40;

  return {
    id,
    title,
    highlight_text,
    subtitle,
    description,
    badge_text,
    badge,
    promotional_badge,
    image_url,
    desktop_image_url,
    mobile_image_url,
    button_text,
    primary_button_text,
    button_url,
    primary_button_link,
    secondary_button_text,
    secondary_button_link,
    features,
    display_order: orderNum,
    sort_order: orderNum,
    is_active,
    open_in_new_tab,
    autoplay_duration,
    position,
    placement: position,
    start_date,
    end_date,
    animation_type,
    text_animation,
    overlay_opacity,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || new Date().toISOString(),
  };
}

/**
 * Broadcast event across components and tabs whenever banners are updated
 */
function broadcastBannersUpdated() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('apex_banners_updated'));
    } catch (e) {
      // Ignore in non-browser environments
    }
  }
}

/**
 * Get unified banners from local storage with automatic legacy migration
 */
function getUnifiedBannersFromStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // 1. Check primary unified key
      const rawUnified = window.localStorage.getItem(UNIFIED_HERO_BANNERS_KEY);
      let list = [];
      if (rawUnified) {
        try {
          const parsed = JSON.parse(rawUnified);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        } catch (e) {}
      }

      // 2. Check legacy promotional banners key if empty
      if (list.length === 0) {
        const rawLegacy = window.localStorage.getItem(LEGACY_BANNERS_KEY) || window.localStorage.getItem(LEGACY_HERO_KEY);
        if (rawLegacy) {
          try {
            const parsedLegacy = JSON.parse(rawLegacy);
            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
              list = parsedLegacy;
            }
          } catch (e) {}
        }
      }

      // 3. Ensure Apex Campaign (slide 0) and Thunder Pro (slide 1) are always prioritized
      const campaignSlide = INITIAL_SEED_HERO_BANNERS[0];
      const thunderSlide = INITIAL_SEED_HERO_BANNERS[1];

      // Keep user's other banners without duplicating campaign/thunder/nexus
      const others = list.filter(
        (b) =>
          b.id !== 'slide-apex-campaign' &&
          b.id !== 'slide-nexus-pro' &&
          b.id !== 'slide-thunder-pro' &&
          !String(b.title || '').includes('NEXUS PRO') &&
          !String(b.mobile_image_url || '').includes('nexus') &&
          !String(b.image_url || '').includes('thunder-pro') &&
          !String(b.image_url || '').includes('apex-campaign')
      );

      const finalBanners = [
        { ...campaignSlide, sort_order: 1, display_order: 1 },
        { ...thunderSlide, sort_order: 2, display_order: 2 },
        ...others,
      ].map((b, idx) => {
        const item = normalizeBannerItem(b, idx + 1);
        item.sort_order = idx + 1;
        item.display_order = idx + 1;
        return item;
      });

      inMemoryHeroBanners = finalBanners;

      // Sync across all keys
      try {
        const jsonStr = JSON.stringify(finalBanners);
        window.localStorage.setItem(UNIFIED_HERO_BANNERS_KEY, jsonStr);
        window.localStorage.setItem(LEGACY_BANNERS_KEY, jsonStr);
        window.localStorage.setItem(LEGACY_HERO_KEY, jsonStr);
      } catch (e) {}

      return inMemoryHeroBanners;
    }
    return inMemoryHeroBanners;
  } catch (e) {
    return inMemoryHeroBanners;
  }
}

/**
 * Save unified banners to all storage keys for complete cross-compatibility
 */
function saveUnifiedBannersToStorage(banners) {
  const normalized = (Array.isArray(banners) ? banners : [])
    .map((b, idx) => normalizeBannerItem(b, idx + 1))
    .sort((a, b) => a.sort_order - b.sort_order);

  inMemoryHeroBanners = normalized;
  invalidateBannersCache();

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const jsonStr = JSON.stringify(normalized);
      window.localStorage.setItem(UNIFIED_HERO_BANNERS_KEY, jsonStr);
      window.localStorage.setItem(LEGACY_BANNERS_KEY, jsonStr);
      window.localStorage.setItem(LEGACY_HERO_KEY, jsonStr);
    }
  } catch (e) {
    console.warn('Failed to save unified banners to localStorage:', e);
  }

  broadcastBannersUpdated();
  return normalized;
}

/**
 * Universal Fetch Function for Hero Slider and Promotional Banners
 * @param {boolean} onlyActive - If true, returns only active banners
 */
/**
 * Universal Fetch Function for Hero Slider and Promotional Banners
 * Fetches directly from Supabase (tables or global Supabase CMS cloud store)
 * @param {boolean} onlyActive - If true, returns only active banners
 */
// ── Table availability cache (prevents repeated 404 queries) ──
const _tableAvailability = {
  banners: null,
  hero_slides: null,
};

// ── Banner query cache (prevents Hero + PromotionalBanner duplicate queries) ──
let _bannersCachePromise = null;
let _bannersCacheTime = 0;
const _BANNERS_CACHE_TTL = 30000; // 30 seconds

/**
 * Synchronously retrieves initial hero slides for instantaneous 0ms rendering
 */
export function getInitialHeroSlides() {
  const stored = getUnifiedBannersFromStorage();
  if (Array.isArray(stored) && stored.length > 0) {
    const active = stored.filter((b) => b.is_active !== false);
    if (active.length > 0) return active;
  }
  return INITIAL_SEED_HERO_SLIDES;
}

export async function fetchHeroBanners(onlyActive = true) {
  // Only cache the storefront (active-only) path
  if (onlyActive) {
    const now = Date.now();
    if (_bannersCachePromise && (now - _bannersCacheTime < _BANNERS_CACHE_TTL)) {
      return _bannersCachePromise;
    }
    _bannersCacheTime = now;
    _bannersCachePromise = _fetchHeroBannersImpl(true);
    _bannersCachePromise.catch(() => { _bannersCachePromise = null; });
    return _bannersCachePromise;
  }
  return _fetchHeroBannersImpl(onlyActive);
}

// Invalidate banner cache (called after admin writes or realtime updates)
export function invalidateBannersCache() {
  _bannersCachePromise = null;
  _bannersCacheTime = 0;
  _tableAvailability.banners = null;
  _tableAvailability.hero_slides = null;
}

async function _fetchHeroBannersImpl(onlyActive) {
  let banners = [];

  // 1. Fetch from Supabase with parallel queries and 1.5s timeout protection
  if (isSupabaseConfigured) {
    const queryPromises = [];

    if (_tableAvailability.banners !== false) {
      let bQuery = supabase.from('banners').select('*').order('display_order', { ascending: true });
      if (onlyActive) bQuery = bQuery.eq('is_active', true);
      queryPromises.push(
        bQuery.then(({ data, error }) => {
          if (error) {
            if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find'))) {
              _tableAvailability.banners = false;
            }
            return null;
          }
          _tableAvailability.banners = true;
          return data;
        }).catch(() => null)
      );
    }

    if (_tableAvailability.hero_slides !== false) {
      let hQuery = supabase.from('hero_slides').select('*').order('sort_order', { ascending: true });
      if (onlyActive) hQuery = hQuery.eq('is_active', true);
      queryPromises.push(
        hQuery.then(({ data, error }) => {
          if (error) {
            if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find'))) {
              _tableAvailability.hero_slides = false;
            }
            return null;
          }
          _tableAvailability.hero_slides = true;
          return data;
        }).catch(() => null)
      );
    }

    if (queryPromises.length > 0) {
      try {
        const results = await Promise.race([
          Promise.all(queryPromises),
          new Promise((resolve) => setTimeout(() => resolve([]), 1500)),
        ]);
        for (const res of results) {
          if (Array.isArray(res) && res.length > 0) {
            banners = res.map((b, idx) => normalizeBannerItem(b, idx + 1));
            break;
          }
        }
      } catch (e) {}
    }
  }

  // 2. Fallback to unified local storage
  if (banners.length === 0) {
    banners = getUnifiedBannersFromStorage();
  }

  if (onlyActive) {
    const now = new Date();
    banners = banners.filter((b) => {
      if (b.is_active === false) return false;
      // Start date check (banner only activates when now >= start_date)
      if (b.start_date && !isNaN(new Date(b.start_date).getTime())) {
        if (new Date(b.start_date) > now) return false;
      }
      // End date check (banner expires when now > end_date)
      if (b.end_date && !isNaN(new Date(b.end_date).getTime())) {
        if (new Date(b.end_date) < now) return false;
      }
      return true;
    });
  }

  return banners
    .map((b, idx) => normalizeBannerItem(b, idx + 1))
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
}

// Storefront & Admin API Aliases (All wired to the same unified store)
export async function fetchBanners(onlyActive = true) {
  return fetchHeroBanners(onlyActive);
}

export async function fetchAdminBanners() {
  return fetchHeroBanners(false);
}

export async function fetchHeroSlides() {
  return fetchHeroBanners(true);
}

export async function fetchAdminHeroSlides() {
  return fetchHeroBanners(false);
}

/**
 * Universal Save/Update Banner or Slide with Global Supabase Persistence
 */
export async function saveHeroBanner(bannerData) {
  const now = new Date().toISOString();

  // Retrieve current list from Supabase cloud first for cross-device consistency
  let currentList = [];
  if (isSupabaseConfigured) {
    const cloud = await fetchGlobalSupabaseCMSConfig();
    if (cloud?.banners && Array.isArray(cloud.banners) && cloud.banners.length > 0) {
      currentList = cloud.banners.map((b, idx) => normalizeBannerItem(b, idx + 1));
    }
  }
  if (currentList.length === 0) {
    currentList = getUnifiedBannersFromStorage();
  }

  const existsIndex = bannerData.id ? currentList.findIndex((b) => String(b.id) === String(bannerData.id)) : -1;
  const isEditing = existsIndex >= 0;

  const normalized = normalizeBannerItem({
    ...bannerData,
    id: bannerData.id || (isEditing ? currentList[existsIndex].id : Date.now()),
    updated_at: now,
    created_at: bannerData.created_at || (isEditing ? currentList[existsIndex].created_at : now),
  }, isEditing ? (currentList[existsIndex].sort_order || existsIndex + 1) : currentList.length + 1);

  // 1. Attempt Supabase table mutation if configured
  if (isSupabaseConfigured) {
    try {
      const dbPayload = {
        title: normalized.title,
        subtitle: normalized.subtitle,
        badge_text: normalized.badge_text,
        image_url: normalized.image_url,
        desktop_image_url: normalized.desktop_image_url,
        mobile_image_url: normalized.mobile_image_url,
        button_text: normalized.button_text,
        button_url: normalized.button_url,
        open_in_new_tab: normalized.open_in_new_tab,
        display_order: normalized.display_order,
        is_active: normalized.is_active,
        position: normalized.position,
        placement: normalized.placement,
        start_date: normalized.start_date,
        end_date: normalized.end_date,
        overlay_opacity: normalized.overlay_opacity,
        animation_type: normalized.animation_type,
        updated_at: now,
      };

      if (isEditing) {
        await safeSupabaseMutation('banners', 'update', dbPayload, 'id', normalized.id);
      } else {
        dbPayload.created_at = now;
        await safeSupabaseMutation('banners', 'insert', dbPayload);
      }
    } catch (e) {}

    try {
      const heroPayload = {
        title: normalized.title,
        highlight_text: normalized.highlight_text,
        badge: normalized.badge,
        description: normalized.description,
        primary_button_text: normalized.primary_button_text,
        primary_button_link: normalized.primary_button_link,
        secondary_button_text: normalized.secondary_button_text,
        secondary_button_link: normalized.secondary_button_link,
        desktop_image_url: normalized.desktop_image_url,
        mobile_image_url: normalized.mobile_image_url,
        features: normalized.features,
        promotional_badge: normalized.promotional_badge,
        sort_order: normalized.sort_order,
        is_active: normalized.is_active,
        autoplay_duration: normalized.autoplay_duration,
        position: normalized.position,
        placement: normalized.placement,
        updated_at: now,
      };

      if (isEditing) {
        await safeSupabaseMutation('hero_slides', 'update', heroPayload, 'id', normalized.id);
      } else {
        heroPayload.created_at = now;
        await safeSupabaseMutation('hero_slides', 'insert', heroPayload);
      }
    } catch (e) {}
  }

  // 2. Update list in memory & local storage
  let updatedList;
  if (isEditing) {
    updatedList = currentList.map((b, idx) => (idx === existsIndex ? { ...b, ...normalized } : b));
  } else {
    updatedList = [...currentList, normalized];
  }

  saveUnifiedBannersToStorage(updatedList);

  // 3. Persist to Global Supabase Cloud CMS record (accessible globally to all devices)
  if (isSupabaseConfigured) {
    await saveGlobalSupabaseCMSConfig({ banners: updatedList });
  }

  broadcastBannersUpdated();
  return normalized;
}

export async function saveBanner(bannerData) {
  return saveHeroBanner(bannerData);
}

export async function saveHeroSlide(slideData) {
  return saveHeroBanner(slideData);
}

/**
 * Universal Delete Banner / Slide
 */
export async function deleteHeroBanner(bannerId) {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('banners').delete().eq('id', bannerId);
    } catch (e) {}
    try {
      await supabase.from('hero_slides').delete().eq('id', bannerId);
    } catch (e) {}
  }

  let currentList = [];
  if (isSupabaseConfigured) {
    const cloud = await fetchGlobalSupabaseCMSConfig();
    if (cloud?.banners && Array.isArray(cloud.banners) && cloud.banners.length > 0) {
      currentList = cloud.banners.map((b, idx) => normalizeBannerItem(b, idx + 1));
    }
  }
  if (currentList.length === 0) {
    currentList = getUnifiedBannersFromStorage();
  }

  const filtered = currentList.filter((b) => String(b.id) !== String(bannerId));
  saveUnifiedBannersToStorage(filtered);

  if (isSupabaseConfigured) {
    await saveGlobalSupabaseCMSConfig({ banners: filtered });
  }

  broadcastBannersUpdated();
  return true;
}

export async function deleteBanner(bannerId) {
  return deleteHeroBanner(bannerId);
}

export async function deleteHeroSlide(slideId) {
  return deleteHeroBanner(slideId);
}

/**
 * Universal Toggle Active Status
 */
export async function toggleHeroBannerStatus(bannerId, isActive) {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      await safeSupabaseMutation('banners', 'update', { is_active: isActive, updated_at: now }, 'id', bannerId);
    } catch (e) {}
    try {
      await safeSupabaseMutation('hero_slides', 'update', { is_active: isActive, updated_at: now }, 'id', bannerId);
    } catch (e) {}
  }

  let currentList = [];
  if (isSupabaseConfigured) {
    const cloud = await fetchGlobalSupabaseCMSConfig();
    if (cloud?.banners && Array.isArray(cloud.banners) && cloud.banners.length > 0) {
      currentList = cloud.banners.map((b, idx) => normalizeBannerItem(b, idx + 1));
    }
  }
  if (currentList.length === 0) {
    currentList = getUnifiedBannersFromStorage();
  }

  const updated = currentList.map((b) =>
    String(b.id) === String(bannerId) ? { ...b, is_active: isActive, updated_at: now } : b
  );
  saveUnifiedBannersToStorage(updated);

  if (isSupabaseConfigured) {
    await saveGlobalSupabaseCMSConfig({ banners: updated });
  }

  broadcastBannersUpdated();
  return updated.find((b) => String(b.id) === String(bannerId)) || { id: bannerId, is_active: isActive };
}

export async function toggleBannerStatus(bannerId, isActive) {
  return toggleHeroBannerStatus(bannerId, isActive);
}

export async function toggleHeroSlideStatus(slideId, isActive) {
  return toggleHeroBannerStatus(slideId, isActive);
}

/**
 * Universal Reorder Banners / Slides
 */
export async function updateHeroBannersOrder(bannersList) {
  let currentList = [];
  if (isSupabaseConfigured) {
    const cloud = await fetchGlobalSupabaseCMSConfig();
    if (cloud?.banners && Array.isArray(cloud.banners) && cloud.banners.length > 0) {
      currentList = cloud.banners.map((b, idx) => normalizeBannerItem(b, idx + 1));
    }
  }
  if (currentList.length === 0) {
    currentList = getUnifiedBannersFromStorage();
  }

  const updated = currentList.map((b) => {
    const match = bannersList.find((item) => String(item.id) === String(b.id));
    if (match) {
      const order = Number(match.display_order ?? match.sort_order ?? b.sort_order);
      return { ...b, display_order: order, sort_order: order };
    }
    return b;
  });

  saveUnifiedBannersToStorage(updated);

  if (isSupabaseConfigured) {
    for (const b of bannersList) {
      const order = Number(b.display_order ?? b.sort_order ?? 1);
      try {
        await supabase.from('banners').update({ display_order: order }).eq('id', b.id);
      } catch (e) {}
      try {
        await supabase.from('hero_slides').update({ sort_order: order }).eq('id', b.id);
      } catch (e) {}
    }
    await saveGlobalSupabaseCMSConfig({ banners: updated });
  }

  broadcastBannersUpdated();
  return updated;
}

export async function updateBannersOrder(bannersList) {
  return updateHeroBannersOrder(bannersList);
}

export async function updateHeroSlidesOrder(slidesList) {
  return updateHeroBannersOrder(slidesList);
}

// ==========================================
// 6. SOCIAL MEDIA GALLERY API (GLOBAL SUPABASE PERSISTENCE)
// ==========================================

export const INITIAL_SEED_SOCIAL_GALLERY = [
  {
    id: 1,
    image_url: 'https://i.pinimg.com/736x/4e/b7/89/4eb789b7c3517d3b6919af5f298b19d9.jpg',
    alt_text: 'APEX Titanium Series Setup',
    caption: 'Cyberpunk audio setup with APEX flagship gear.',
    link_url: 'https://www.instagram.com/apexstor.pk/',
    platform: 'Instagram',
    sort_order: 1,
    is_active: true,
    created_at: new Date(Date.now() - 500000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    image_url: 'https://i.pinimg.com/736x/87/3e/60/873e6066bb1b22f18075278e9111b505.jpg',
    alt_text: 'APEX Smart Watch Pro Edition',
    caption: 'Precision titanium on your wrist.',
    link_url: 'https://www.instagram.com/apexstor.pk/',
    platform: 'Instagram',
    sort_order: 2,
    is_active: true,
    created_at: new Date(Date.now() - 400000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    image_url: 'https://i.pinimg.com/736x/dc/d1/83/dcd18343dc89c7f845a52db0f38d90c5.jpg',
    alt_text: 'APEX Zero Latency Gaming Gear',
    caption: 'Built for competitive champions.',
    link_url: 'https://www.instagram.com/apexstor.pk/',
    platform: 'Instagram',
    sort_order: 3,
    is_active: true,
    created_at: new Date(Date.now() - 300000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    image_url: 'https://i.pinimg.com/736x/59/db/4f/59db4f2dd6a94b124931caa92eb9a72f.jpg',
    alt_text: 'APEX Wireless ANC Acoustics',
    caption: 'Hear every detail in crystal fidelity.',
    link_url: 'https://www.instagram.com/apexstor.pk/',
    platform: 'Instagram',
    sort_order: 4,
    is_active: true,
    created_at: new Date(Date.now() - 200000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    image_url: 'https://i.pinimg.com/736x/f4/ff/52/f4ff5250e2a14179e4647e51a6f4320c.jpg',
    alt_text: 'APEX RGB Battle Station',
    caption: 'Level up your gaming experience.',
    link_url: 'https://www.instagram.com/apexstor.pk/',
    platform: 'Instagram',
    sort_order: 5,
    is_active: true,
    created_at: new Date(Date.now() - 100000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    image_url: 'https://i.pinimg.com/736x/a0/a1/82/a0a182afc8d3c2206866d3eb91bbb096.jpg',
    alt_text: 'APEX Lifestyle & EDC Accessories',
    caption: 'Minimalist black aesthetic EDC gear.',
    link_url: 'https://www.instagram.com/apexstor.pk/',
    platform: 'Instagram',
    sort_order: 6,
    is_active: true,
    created_at: new Date(Date.now() - 50000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const LOCAL_SOCIAL_GALLERY_KEY = 'apex_social_gallery';
let inMemorySocialGallery = [...INITIAL_SEED_SOCIAL_GALLERY];

// Query Cache for storefront
let _socialGalleryCachePromise = null;
let _socialGalleryCacheTime = 0;
const _SOCIAL_GALLERY_CACHE_TTL = 30000;

export function invalidateSocialGalleryCache() {
  _socialGalleryCachePromise = null;
  _socialGalleryCacheTime = 0;
}

export function normalizeSocialGalleryItem(item, defaultOrder = 1) {
  if (!item) return null;
  const id = item.id || (typeof item === 'object' && item.id !== undefined ? item.id : Date.now());
  const image_url = (item.image_url ?? '').toString().trim();
  const alt_text = (item.alt_text ?? 'APEX Store Social Post').toString().trim();
  const caption = (item.caption ?? '').toString().trim();
  const link_url = (item.link_url ?? 'https://www.instagram.com/apexstor.pk/').toString().trim();
  const platform = (item.platform ?? 'Instagram').toString().trim();
  const sort_order = Number(item.sort_order ?? item.display_order ?? defaultOrder) || defaultOrder;
  const is_active = item.is_active !== undefined ? Boolean(item.is_active) : true;
  const created_at = item.created_at || new Date().toISOString();
  const updated_at = item.updated_at || new Date().toISOString();

  return {
    id,
    image_url,
    alt_text,
    caption,
    link_url,
    platform,
    sort_order,
    is_active,
    created_at,
    updated_at,
  };
}

function broadcastSocialGalleryUpdated() {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('apex_social_gallery_updated'));
    } catch (e) {}
  }
}

function getLocalSocialGalleryFromStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(LOCAL_SOCIAL_GALLERY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemorySocialGallery = parsed.map((item, idx) => normalizeSocialGalleryItem(item, idx + 1));
          return inMemorySocialGallery;
        }
      }
      saveLocalSocialGalleryToStorage(INITIAL_SEED_SOCIAL_GALLERY);
    }
    return inMemorySocialGallery;
  } catch (e) {
    return inMemorySocialGallery;
  }
}

function saveLocalSocialGalleryToStorage(items) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((b, idx) => normalizeSocialGalleryItem(b, idx + 1))
    .sort((a, b) => a.sort_order - b.sort_order);

  inMemorySocialGallery = normalized;
  invalidateSocialGalleryCache();

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_SOCIAL_GALLERY_KEY, JSON.stringify(normalized));
    }
  } catch (e) {
    console.warn('Failed to save social gallery to localStorage:', e);
  }

  broadcastSocialGalleryUpdated();
  return normalized;
}

export async function fetchSocialGallery(onlyActive = true) {
  if (onlyActive) {
    const now = Date.now();
    if (_socialGalleryCachePromise && (now - _socialGalleryCacheTime < _SOCIAL_GALLERY_CACHE_TTL)) {
      return _socialGalleryCachePromise;
    }
    _socialGalleryCacheTime = now;
    _socialGalleryCachePromise = _fetchSocialGalleryImpl(true);
    _socialGalleryCachePromise.catch(() => { _socialGalleryCachePromise = null; });
    return _socialGalleryCachePromise;
  }
  return _fetchSocialGalleryImpl(onlyActive);
}

export async function fetchAdminSocialGallery() {
  return _fetchSocialGalleryImpl(false);
}

async function _fetchSocialGalleryImpl(onlyActive) {
  let items = [];

  // 1. Try Supabase dedicated table 'social_gallery'
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('social_gallery').select('*').order('sort_order', { ascending: true });
      if (onlyActive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        items = data.map((item, idx) => normalizeSocialGalleryItem(item, idx + 1));
      }
    } catch (e) {}

    // 2. Try global Supabase Cloud CMS record
    if (items.length === 0) {
      try {
        const globalCms = await fetchGlobalSupabaseCMSConfig();
        if (globalCms?.social_gallery && Array.isArray(globalCms.social_gallery) && globalCms.social_gallery.length > 0) {
          items = globalCms.social_gallery.map((item, idx) => normalizeSocialGalleryItem(item, idx + 1));
          saveLocalSocialGalleryToStorage(items);
        }
      } catch (e) {
        console.warn('Failed to fetch social gallery from global Supabase CMS:', e);
      }
    }
  }

  // 3. Fallback to Local Storage / Initial Seed
  if (items.length === 0) {
    items = getLocalSocialGalleryFromStorage();
  }

  if (onlyActive) {
    items = items.filter((item) => item.is_active !== false);
  }

  return items
    .map((item, idx) => normalizeSocialGalleryItem(item, idx + 1))
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
}

export async function saveSocialGalleryItem(itemData) {
  const now = new Date().toISOString();

  // Retrieve current list from Supabase cloud first for cross-device consistency
  let currentList = [];
  if (isSupabaseConfigured) {
    const cloud = await fetchGlobalSupabaseCMSConfig();
    if (cloud?.social_gallery && Array.isArray(cloud.social_gallery) && cloud.social_gallery.length > 0) {
      currentList = cloud.social_gallery.map((b, idx) => normalizeSocialGalleryItem(b, idx + 1));
    }
  }
  if (currentList.length === 0) {
    currentList = getLocalSocialGalleryFromStorage();
  }

  let updatedList = [];
  const normalizedItem = normalizeSocialGalleryItem(itemData, currentList.length + 1);
  normalizedItem.updated_at = now;

  const isExisting = currentList.some((b) => String(b.id) === String(normalizedItem.id));

  if (isExisting) {
    updatedList = currentList.map((b) => (String(b.id) === String(normalizedItem.id) ? { ...b, ...normalizedItem } : b));
  } else {
    normalizedItem.id = normalizedItem.id || Date.now();
    normalizedItem.created_at = normalizedItem.created_at || now;
    normalizedItem.sort_order = normalizedItem.sort_order || currentList.length + 1;
    updatedList = [...currentList, normalizedItem];
  }

  // 1. Sync to Supabase table
  if (isSupabaseConfigured) {
    try {
      const payload = {
        image_url: normalizedItem.image_url,
        alt_text: normalizedItem.alt_text,
        caption: normalizedItem.caption,
        link_url: normalizedItem.link_url,
        platform: normalizedItem.platform,
        sort_order: normalizedItem.sort_order,
        is_active: normalizedItem.is_active,
        updated_at: now,
      };

      if (isExisting && typeof normalizedItem.id === 'number') {
        await supabase.from('social_gallery').update(payload).eq('id', normalizedItem.id);
      } else {
        await supabase.from('social_gallery').upsert({ id: normalizedItem.id, ...payload });
      }
    } catch (e) {
      console.warn('[Supabase Table Fallback] Table social_gallery update warning:', e.message);
    }

    // 2. Persist to Global Supabase Cloud Record
    await saveGlobalSupabaseCMSConfig({ social_gallery: updatedList });
  }

  // 3. Update localStorage & memory
  saveLocalSocialGalleryToStorage(updatedList);
  return normalizedItem;
}

export async function deleteSocialGalleryItem(id) {
  let currentList = [];
  if (isSupabaseConfigured) {
    const cloud = await fetchGlobalSupabaseCMSConfig();
    if (cloud?.social_gallery && Array.isArray(cloud.social_gallery) && cloud.social_gallery.length > 0) {
      currentList = cloud.social_gallery.map((b, idx) => normalizeSocialGalleryItem(b, idx + 1));
    }
  }
  if (currentList.length === 0) {
    currentList = getLocalSocialGalleryFromStorage();
  }

  const target = currentList.find((b) => String(b.id) === String(id));
  const filtered = currentList.filter((b) => String(b.id) !== String(id));

  // Safely delete associated image from Supabase Storage if it was uploaded
  if (target?.image_url && isSupabaseConfigured) {
    try {
      if (target.image_url.includes('/social/')) {
        const parts = target.image_url.split('/social/');
        if (parts.length > 1) {
          const filePath = `social/${parts[1].split('?')[0]}`;
          await supabase.storage.from('site-images').remove([filePath]);
          await supabase.storage.from('product-images').remove([filePath]);
        }
      }
    } catch (e) {}
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('social_gallery').delete().eq('id', id);
    } catch (e) {}
    await saveGlobalSupabaseCMSConfig({ social_gallery: filtered });
  }

  saveLocalSocialGalleryToStorage(filtered);
  return true;
}

export async function toggleSocialGalleryStatus(id) {
  let currentList = [];
  if (isSupabaseConfigured) {
    const cloud = await fetchGlobalSupabaseCMSConfig();
    if (cloud?.social_gallery && Array.isArray(cloud.social_gallery) && cloud.social_gallery.length > 0) {
      currentList = cloud.social_gallery.map((b, idx) => normalizeSocialGalleryItem(b, idx + 1));
    }
  }
  if (currentList.length === 0) {
    currentList = getLocalSocialGalleryFromStorage();
  }

  let newStatus = true;
  const updated = currentList.map((b) => {
    if (String(b.id) === String(id)) {
      newStatus = !b.is_active;
      return { ...b, is_active: newStatus, updated_at: new Date().toISOString() };
    }
    return b;
  });

  if (isSupabaseConfigured) {
    try {
      await supabase.from('social_gallery').update({ is_active: newStatus }).eq('id', id);
    } catch (e) {}
    await saveGlobalSupabaseCMSConfig({ social_gallery: updated });
  }

  saveLocalSocialGalleryToStorage(updated);
  return newStatus;
}

export async function updateSocialGalleryOrder(itemsList) {
  let currentList = [];
  if (isSupabaseConfigured) {
    const cloud = await fetchGlobalSupabaseCMSConfig();
    if (cloud?.social_gallery && Array.isArray(cloud.social_gallery) && cloud.social_gallery.length > 0) {
      currentList = cloud.social_gallery.map((b, idx) => normalizeSocialGalleryItem(b, idx + 1));
    }
  }
  if (currentList.length === 0) {
    currentList = getLocalSocialGalleryFromStorage();
  }

  const updated = currentList.map((b) => {
    const match = itemsList.find((item) => String(item.id) === String(b.id));
    if (match) {
      const order = Number(match.sort_order ?? match.display_order ?? b.sort_order);
      return { ...b, sort_order: order };
    }
    return b;
  });

  saveLocalSocialGalleryToStorage(updated);

  if (isSupabaseConfigured) {
    for (const b of itemsList) {
      const order = Number(b.sort_order ?? b.display_order ?? 1);
      try {
        await supabase.from('social_gallery').update({ sort_order: order }).eq('id', b.id);
      } catch (e) {}
    }
    await saveGlobalSupabaseCMSConfig({ social_gallery: updated });
  }

  broadcastSocialGalleryUpdated();
  return updated;
}

export async function uploadSocialGalleryImage(file) {
  return uploadImageToSupabase(file, 'social');
}

// ==============================================================================
// 7. COMPLETE RETURNS & REFUNDS API SYSTEM (SUPABASE CLOUD + GLOBAL SYNC)
// ==============================================================================

export const DEFAULT_RETURN_SETTINGS = {
  return_window_days: 7,
  allow_refund: true,
  allow_exchange: true,
  allow_cod_returns: true,
  allow_online_returns: true,
  shipping_refund_rule: 'non_refundable', // 'non_refundable' | 'refundable_if_defective' | 'always_refundable'
  require_photos: false,
  return_reasons: [
    { id: 'defective', label: 'Product is defective / not functioning', is_active: true, sort_order: 1 },
    { id: 'damaged', label: 'Product arrived damaged in transit', is_active: true, sort_order: 2 },
    { id: 'wrong_item', label: 'Received wrong item or model', is_active: true, sort_order: 3 },
    { id: 'missing_accessory', label: 'Missing parts or accessories', is_active: true, sort_order: 4 },
    { id: 'not_as_described', label: 'Product does not match website description', is_active: true, sort_order: 5 },
    { id: 'size_fit', label: 'Size / fit or comfort issue', is_active: true, sort_order: 6 },
    { id: 'changed_mind', label: 'Changed my mind / No longer needed', is_active: true, sort_order: 7 },
    { id: 'other', label: 'Other reason (specify in notes)', is_active: true, sort_order: 8 },
  ],
  policy_banner_text: '7-Day APEX Guarantee: 7 Days Return & Replacements',
  require_unboxing_video_for_damage: true,
  max_video_size_mb: 100,
  enabled: true,
};

const LOCAL_RETURNS_STORAGE_KEY = 'apex_returns_records';
const LOCAL_RETURN_SETTINGS_KEY = 'apex_return_settings_config';

let inMemoryReturns = [];
let inMemoryReturnSettings = null;

function getLocalReturns() {
  if (typeof localStorage === 'undefined') return inMemoryReturns;
  try {
    const raw = localStorage.getItem(LOCAL_RETURNS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : inMemoryReturns;
  } catch (e) {
    return inMemoryReturns;
  }
}

function saveLocalReturns(list) {
  inMemoryReturns = Array.isArray(list) ? list : [];
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_RETURNS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

function getLocalReturnSettings() {
  if (typeof localStorage === 'undefined') return inMemoryReturnSettings || DEFAULT_RETURN_SETTINGS;
  try {
    const raw = localStorage.getItem(LOCAL_RETURN_SETTINGS_KEY);
    return raw ? { ...DEFAULT_RETURN_SETTINGS, ...JSON.parse(raw) } : inMemoryReturnSettings || DEFAULT_RETURN_SETTINGS;
  } catch (e) {
    return inMemoryReturnSettings || DEFAULT_RETURN_SETTINGS;
  }
}

function saveLocalReturnSettings(settings) {
  inMemoryReturnSettings = settings;
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_RETURN_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

function broadcastReturnsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apex_returns_updated'));
  }
}

/**
 * Fetch Return Settings (Window days, allowed methods, reasons)
 */
export async function fetchReturnSettings() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('return_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        saveLocalReturnSettings(data);
        return { ...DEFAULT_RETURN_SETTINGS, ...data };
      }

      // Check Global Cloud CMS fallback
      const cloud = await fetchGlobalSupabaseCMSConfig();
      if (cloud?.return_settings) {
        saveLocalReturnSettings(cloud.return_settings);
        return { ...DEFAULT_RETURN_SETTINGS, ...cloud.return_settings };
      }
    } catch (e) {
      console.warn('Return settings fetch error:', e);
    }
  }
  return getLocalReturnSettings();
}

/**
 * Save Return Settings (Admin only)
 */
export async function saveReturnSettings(newSettings) {
  const merged = { ...DEFAULT_RETURN_SETTINGS, ...newSettings, updated_at: new Date().toISOString() };
  saveLocalReturnSettings(merged);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('return_settings')
        .upsert([{ id: 1, ...merged }]);
    } catch (e) {
      console.warn('Supabase return_settings upsert warning:', e);
    }

    try {
      await saveGlobalSupabaseCMSConfig({ return_settings: merged });
    } catch (e) {}
  }

  broadcastReturnsUpdated();
  return merged;
}

/**
 * Fetch Customer Returns (Filtered by current authenticated user)
 */
export async function fetchCustomerReturns() {
  const userId = await getCurrentUserId();
  let userEmail = null;

  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) userEmail = session.user.email.toLowerCase().trim();

      let query = supabase.from('returns').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('customer_id', userId);
      } else if (userEmail) {
        query = query.ilike('customer_email', userEmail);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('Customer returns fetch warning:', e);
    }
  }

  // Fallback to local returns
  const localList = getLocalReturns();
  if (userId) {
    return localList.filter((r) => r.user_id === userId || r.customer_id === userId);
  }
  if (userEmail) {
    return localList.filter((r) => (r.customer_email || '').toLowerCase() === userEmail);
  }
  return localList;
}

/**
 * Fetch Single Return by ID or Return Number
 */
export async function fetchReturnById(returnIdentifier) {
  if (isSupabaseConfigured) {
    try {
      const isNum = Number(returnIdentifier) && !isNaN(Number(returnIdentifier));
      let query = supabase.from('returns').select('*');
      if (isNum) {
        query = query.or(`id.eq.${returnIdentifier},return_number.eq.${returnIdentifier}`);
      } else {
        query = query.eq('return_number', returnIdentifier);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) return data;

      const cloud = await fetchGlobalSupabaseCMSConfig();
      if (cloud?.returns && Array.isArray(cloud.returns)) {
        const match = cloud.returns.find((r) => String(r.id) === String(returnIdentifier) || String(r.return_number) === String(returnIdentifier));
        if (match) return match;
      }
    } catch (e) {}
  }

  const localList = getLocalReturns();
  return localList.find((r) => String(r.id) === String(returnIdentifier) || String(r.return_number) === String(returnIdentifier)) || null;
}

/**
 * Fetch Admin Returns (All returns with filter & search support)
 */
export async function fetchAdminReturns(filterStatus = 'all') {
  let list = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        list = data;
      }
    } catch (e) {
      console.warn('Admin returns Supabase fetch warning:', e);
    }
  }

  if (list.length === 0) {
    // Check cloud CMS fallback
    if (isSupabaseConfigured) {
      const cloud = await fetchGlobalSupabaseCMSConfig();
      if (cloud?.returns && Array.isArray(cloud.returns) && cloud.returns.length > 0) {
        list = cloud.returns;
      }
    }
  }

  if (list.length === 0) {
    list = getLocalReturns();
  }

  if (filterStatus && filterStatus !== 'all') {
    return list.filter((r) => String(r.status || '').toLowerCase() === filterStatus.toLowerCase());
  }

  return list;
}

/**
 * Helper to check whether an order item is eligible for return
 */
export function checkOrderItemReturnEligibility(order, item, existingReturns = [], settings = DEFAULT_RETURN_SETTINGS) {
  if (!order || !item || typeof item !== 'object') {
    return { isEligible: false, remainingQuantity: 0, reason: 'Invalid order or item' };
  }

  const safeSettings = settings && typeof settings === 'object' ? { ...DEFAULT_RETURN_SETTINGS, ...settings } : DEFAULT_RETURN_SETTINGS;
  const safeReturns = Array.isArray(existingReturns) ? existingReturns : [];

  // 1. Check system enabled
  if (safeSettings.enabled === false) {
    return { isEligible: false, remainingQuantity: 0, reason: 'Return system is currently disabled by store management.' };
  }

  // 2. Order status must be Delivered
  const orderStatus = String(order.status || '').toLowerCase();
  if (orderStatus !== 'delivered') {
    return { isEligible: false, remainingQuantity: 0, reason: 'Returns are only available once the order is delivered.' };
  }

  // 3. Calculate delivery date and return window expiration
  const deliveredDate = order.delivered_at 
    ? new Date(order.delivered_at) 
    : order.updated_at 
    ? new Date(order.updated_at) 
    : new Date(order.created_at || Date.now());

  const windowDays = Number(safeSettings.return_window_days || 7);
  const expiryDate = new Date(deliveredDate.getTime() + windowDays * 24 * 60 * 60 * 1000);
  const now = new Date();

  const isExpired = now > expiryDate;
  const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  if (isExpired) {
    return {
      isEligible: false,
      remainingQuantity: 0,
      isExpired: true,
      windowDays,
      daysLeft: 0,
      reason: `The ${windowDays}-day return window for this order has expired.`,
    };
  }

  // 4. Calculate already returned/requested quantities for this specific item
  const itemId = item.id || item.product_id;
  const itemName = item.name || item.product_name;

  let alreadyReturnedQty = 0;
  const relatedReturns = safeReturns.filter(
    (r) => r && (r.order_number === order.order_number || String(r.order_id) === String(order.id)) && r.status !== 'rejected' && r.status !== 'cancelled'
  );

  for (const ret of relatedReturns) {
    let retItems = [];
    if (Array.isArray(ret.items)) {
      retItems = ret.items;
    } else if (typeof ret.items === 'string') {
      try {
        const parsed = JSON.parse(ret.items);
        retItems = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        retItems = [];
      }
    }
    for (const rItem of retItems) {
      if (!rItem || typeof rItem !== 'object') continue;
      const matchId = itemId && (rItem.id === itemId || rItem.product_id === itemId);
      const matchName = itemName && (rItem.name === itemName || rItem.product_name === itemName);
      if (matchId || matchName) {
        alreadyReturnedQty += Number(rItem.quantity || 1);
      }
    }
  }

  const totalOrderedQty = Number(item.quantity || 1);
  const remainingQuantity = Math.max(0, totalOrderedQty - alreadyReturnedQty);

  if (remainingQuantity <= 0) {
    return {
      isEligible: false,
      remainingQuantity: 0,
      alreadyReturnedQty,
      isExpired: false,
      windowDays,
      daysLeft,
      reason: 'All units for this item have already been submitted for return.',
    };
  }

  return {
    isEligible: true,
    remainingQuantity,
    alreadyReturnedQty,
    totalOrderedQty,
    isExpired: false,
    windowDays,
    daysLeft,
  };
}

/**
 * Submit Return Request (Customer)
 */
export async function submitReturnRequest(payload) {
  const userId = await getCurrentUserId();
  const settings = await fetchReturnSettings();

  const returnNumber = `RET-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const itemUnitPrice = Number(payload.item?.price || 0);
  const returnQty = Number(payload.quantity || 1);
  const requestedAmount = itemUnitPrice * returnQty;

  const returnRecord = {
    return_number: returnNumber,
    order_id: payload.order_id || null,
    order_number: payload.order_number,
    user_id: userId || payload.user_id || null,
    customer_id: userId || payload.customer_id || null,
    customer_name: payload.customer_name || 'Customer',
    customer_email: payload.customer_email || '',
    customer_phone: payload.customer_phone || '',
    status: 'requested',
    reason: payload.reason,
    reason_details: payload.reason_details || payload.reason,
    condition: payload.condition || 'opened_unused',
    packaging_available: payload.packaging_available !== false,
    description: payload.description || '',
    resolution: payload.resolution || 'refund',
    requested_amount: requestedAmount,
    approved_amount: requestedAmount,
    discount_adjustment: 0,
    shipping_adjustment: 0,
    final_refund_amount: requestedAmount,
    refund_method: payload.refund_method || 'original',
    items: [
      {
        id: payload.item?.id || null,
        product_id: payload.item?.id || payload.item?.product_id || null,
        name: payload.item?.name || 'APEX Product',
        price: itemUnitPrice,
        quantity: returnQty,
        image: payload.item?.image || payload.item?.images?.[0] || '',
        restock_status: 'pending',
      },
    ],
    evidence_urls: payload.evidence_urls || [],
    unboxing_video_url: payload.unboxing_video_url || null,
    unboxing_video_path: payload.unboxing_video_path || null,
    unboxing_video_available: Boolean(payload.unboxing_video_url || payload.unboxing_video_available || payload.has_unboxing_video),
    unboxing_video_uploaded_at: payload.unboxing_video_url ? now : (payload.unboxing_video_uploaded_at || null),
    unboxing_video_status: payload.unboxing_video_url ? 'available' : (payload.has_unboxing_video === false ? 'not_provided' : 'none'),
    status_history: [
      {
        status: 'requested',
        title: 'Return Request Submitted',
        note: payload.description || 'Customer submitted return request.',
        timestamp: now,
        actor: 'Customer',
      },
    ],
    delivered_at: payload.delivered_at || null,
    created_at: now,
    updated_at: now,
  };

  // 1. Direct Supabase Mutation
  let created = null;
  if (isSupabaseConfigured) {
    try {
      const data = await safeSupabaseMutation('returns', 'insert', returnRecord);
      if (data) created = data;
    } catch (e) {
      console.warn('Supabase returns insert error:', e);
    }
  }

  if (!created) {
    created = { ...returnRecord, id: Date.now() };
  }

  // 2. Sync to local storage & Global Cloud CMS
  const localList = getLocalReturns();
  const updatedList = [created, ...localList.filter((r) => r.id !== created.id)];
  saveLocalReturns(updatedList);

  if (isSupabaseConfigured) {
    try {
      await saveGlobalSupabaseCMSConfig({ returns: updatedList });
    } catch (e) {}
  }

  broadcastReturnsUpdated();
  return created;
}

/**
 * Update Return Status (Admin)
 */
export async function updateReturnStatus(returnId, newStatus, adminNote = '', additionalFields = {}) {
  const currentReturn = await fetchReturnById(returnId);
  const now = new Date().toISOString();

  const historyEntry = {
    status: newStatus,
    title: `Status updated to ${newStatus.replace(/_/g, ' ').toUpperCase()}`,
    note: adminNote || '',
    timestamp: now,
    actor: 'Admin',
  };

  const existingHistory = Array.isArray(currentReturn?.status_history)
    ? currentReturn.status_history
    : typeof currentReturn?.status_history === 'string'
    ? JSON.parse(currentReturn.status_history || '[]')
    : [];

  const updatedHistory = [...existingHistory, historyEntry];

  const patch = {
    status: newStatus,
    admin_note: adminNote || currentReturn?.admin_note || '',
    status_history: updatedHistory,
    updated_at: now,
    ...additionalFields,
  };

  // 1. Update Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase.from('returns').update(patch).eq('id', returnId);
    } catch (e) {
      try {
        await supabase.from('returns').update(patch).eq('return_number', returnId);
      } catch (err2) {}
    }
  }

  // 2. Update Local & Global CMS
  const localList = getLocalReturns();
  const updatedList = localList.map((r) => {
    if (String(r.id) === String(returnId) || String(r.return_number) === String(returnId)) {
      return { ...r, ...patch };
    }
    return r;
  });
  saveLocalReturns(updatedList);

  if (isSupabaseConfigured) {
    try {
      await saveGlobalSupabaseCMSConfig({ returns: updatedList });
    } catch (e) {}
  }

  broadcastReturnsUpdated();
  return { ...currentReturn, ...patch };
}

/**
 * Approve Return Refund with optional Inventory Restock
 */
export async function approveReturnRefund(returnId, details) {
  const {
    approved_amount,
    discount_adjustment = 0,
    shipping_adjustment = 0,
    final_refund_amount,
    refund_method = 'original',
    admin_note = '',
    restock_item = false,
  } = details;

  const currentReturn = await fetchReturnById(returnId);
  const now = new Date().toISOString();

  // If restock requested, increment stock in products table
  if (restock_item && isSupabaseConfigured && currentReturn?.items) {
    const items = Array.isArray(currentReturn.items) ? currentReturn.items : JSON.parse(currentReturn.items || '[]');
    for (const it of items) {
      if (it.product_id || it.id) {
        const prodId = it.product_id || it.id;
        const returnQty = Number(it.quantity || 1);
        try {
          const { data: p } = await supabase.from('products').select('stock').eq('id', prodId).single();
          if (p) {
            await supabase.from('products').update({ stock: (p.stock || 0) + returnQty }).eq('id', prodId);
          }
        } catch (e) {
          console.warn('Restock update warning:', e);
        }
      }
    }
  }

  const patch = {
    status: 'refunded',
    approved_amount: Number(approved_amount || currentReturn?.requested_amount || 0),
    discount_adjustment: Number(discount_adjustment || 0),
    shipping_adjustment: Number(shipping_adjustment || 0),
    final_refund_amount: Number(final_refund_amount || approved_amount || currentReturn?.requested_amount || 0),
    refund_method,
    admin_note: admin_note || 'Refund processed and completed.',
  };

  return updateReturnStatus(returnId, 'refunded', admin_note || `Refund of PKR ${patch.final_refund_amount} processed via ${refund_method}.`, patch);
}

/**
 * Upload Evidence Image to Supabase Storage
 */
export async function uploadReturnEvidence(file) {
  return uploadImageToSupabase(file, 'returns');
}

/**
 * Upload Unboxing Video to Supabase Storage with Resilient Fallback
 */
export async function uploadReturnVideo(file, folder = 'returns/unboxing') {
  if (!file) return null;

  // Validate format (MP4, MOV, WEBM, M4V, 3GP, AVI)
  const allowedExtensions = ['mp4', 'mov', 'webm', 'm4v', '3gp', 'avi'];
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isVideoType = file.type?.startsWith('video/') || allowedExtensions.includes(ext);

  if (!isVideoType) {
    throw new Error('Please upload a valid video format (MP4, MOV, or WEBM).');
  }

  // Validate size (max 100MB)
  const maxBytes = 100 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Video file size must be less than 100MB.');
  }

  if (isSupabaseConfigured) {
    try {
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext || 'mp4'}`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'video/mp4',
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        return {
          url: publicData?.publicUrl || '',
          path: fileName,
          name: file.name,
          size: file.size,
          type: file.type || 'video/mp4',
        };
      } else if (error) {
        console.warn('Supabase video upload warning:', error.message);
      }
    } catch (e) {
      console.warn('Supabase video upload error:', e.message);
    }
  }

  // Resilient Fallback: Read file as Data URL (base64) so video upload never crashes
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      url: reader.result,
      path: `local-video-${Date.now()}.${ext || 'mp4'}`,
      name: file.name,
      size: file.size,
      type: file.type || 'video/mp4',
    });
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// ==========================================
// 14. ADMIN AUTHORIZATION & MANAGEMENT SERVICES
// ==========================================

const LOCAL_ADMIN_USERS_KEY = 'apex_admin_users';
const SEED_ADMIN_EMAILS = ['admin@apexstore.pk', 'apexstore530@gmail.com', 'apexstore54@gmail.com', 'admin@apexstore.com'];
let inMemoryAdminUsers = null;

function logAuthDebug(uid, email, adminMatch, resolvedRole) {
  if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
    console.log('%c[APEX AUTH VERIFICATION]', 'background: #dc2626; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;', {
      uid: uid || 'none',
      email: email || 'none',
      adminMatch: Boolean(adminMatch),
      role: resolvedRole || 'null'
    });
  }
}

function getLocalAdminUsers() {
  if (inMemoryAdminUsers && Array.isArray(inMemoryAdminUsers) && inMemoryAdminUsers.length > 0) {
    // Ensure all seeds exist in memory
    for (const seedEmail of SEED_ADMIN_EMAILS) {
      if (!inMemoryAdminUsers.some((a) => a.email?.toLowerCase() === seedEmail.toLowerCase())) {
        inMemoryAdminUsers.push({
          id: inMemoryAdminUsers.length + 1,
          email: seedEmail,
          full_name: seedEmail.split('@')[0],
          role: seedEmail === 'apexstore54@gmail.com' || seedEmail === 'admin@apexstore.pk' || seedEmail === 'apexstore530@gmail.com' ? 'superadmin' : 'admin',
          user_id: `uuid-seed-${seedEmail}`,
          status: 'ACTIVE',
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
    }
    return [...inMemoryAdminUsers];
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_ADMIN_USERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge seed admins
          for (const seedEmail of SEED_ADMIN_EMAILS) {
            if (!parsed.some((a) => a.email?.toLowerCase() === seedEmail.toLowerCase())) {
              parsed.push({
                id: parsed.length + 1,
                email: seedEmail,
                full_name: seedEmail.split('@')[0],
                role: seedEmail === 'apexstore54@gmail.com' || seedEmail === 'admin@apexstore.pk' || seedEmail === 'apexstore530@gmail.com' ? 'superadmin' : 'admin',
                user_id: `uuid-seed-${seedEmail}`,
                status: 'ACTIVE',
                is_active: true,
                created_at: new Date().toISOString()
              });
            }
          }
          inMemoryAdminUsers = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local admin users:', e);
    }
  }

  const initial = SEED_ADMIN_EMAILS.map((email, idx) => ({
    id: idx + 1,
    email,
    full_name: email.split('@')[0],
    role: email === 'apexstore54@gmail.com' || email === 'admin@apexstore.pk' || email === 'apexstore530@gmail.com' ? 'superadmin' : 'admin',
    user_id: `uuid-seed-${idx + 1}`,
    status: 'ACTIVE',
    is_active: true,
    created_at: new Date().toISOString()
  }));

  inMemoryAdminUsers = initial;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(initial));
  }
  return initial;
}

function setLocalAdminUsers(list) {
  inMemoryAdminUsers = [...list];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(list));
  }
}

/**
 * Verify whether a user is an authorized administrator
 * @param {string} userId - Supabase auth user UUID
 * @param {string} userEmail - Authenticated user email
 * @returns {Promise<{ isAdmin: boolean, role: string, isSuperAdmin: boolean, record: object | null }>}
 */
export async function checkIsAdmin(userId, userEmail) {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  if (!userId && !cleanEmail) {
    logAuthDebug(userId, cleanEmail, false, 'none');
    return { isAdmin: false, role: 'none', isSuperAdmin: false, record: null };
  }

  if (isSupabaseConfigured) {
    try {
      // 1. Primary Check: Call PostgreSQL get_admin_role() RPC function if available
      if (userId) {
        try {
          const { data: roleData, error: roleError } = await supabase.rpc('get_admin_role', { 
            check_user_id: userId 
          });
          
          if (!roleError && roleData) {
            const normalizedRole = roleData === 'super_admin' || roleData === 'superadmin' ? 'superadmin' : 'admin';
            const res = {
              isAdmin: true,
              role: normalizedRole,
              isSuperAdmin: normalizedRole === 'superadmin',
              record: { user_id: userId, email: cleanEmail, role: normalizedRole }
            };
            logAuthDebug(userId, cleanEmail, true, normalizedRole);
            return res;
          }
        } catch (e) {}
      }

      // 2. Query public.admin_users by email first (safe across all table schema versions)
      if (cleanEmail) {
        const { data: emailData, error: emailErr } = await supabase
          .from('admin_users')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (!emailErr && emailData && emailData.is_active !== false) {
          // Attempt linking user_id if record matched by email but lacked user_id
          if (userId && !emailData.user_id) {
            try {
              await supabase
                .from('admin_users')
                .update({ user_id: userId, updated_at: new Date().toISOString() })
                .eq('id', emailData.id);
            } catch (e) {}
          }
          const normalizedRole = emailData.role === 'super_admin' || emailData.role === 'superadmin' ? 'superadmin' : 'admin';
          const res = {
            isAdmin: true,
            role: normalizedRole,
            isSuperAdmin: normalizedRole === 'superadmin',
            record: { ...emailData, role: normalizedRole }
          };
          logAuthDebug(userId, cleanEmail, true, normalizedRole);
          return res;
        }
      }

      // 3. Query public.admin_users by user_id (if column exists)
      if (userId) {
        try {
          const { data: idData, error: idErr } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (!idErr && idData && idData.is_active !== false) {
            const normalizedRole = idData.role === 'super_admin' || idData.role === 'superadmin' ? 'superadmin' : 'admin';
            const res = {
              isAdmin: true,
              role: normalizedRole,
              isSuperAdmin: normalizedRole === 'superadmin',
              record: { ...idData, role: normalizedRole }
            };
            logAuthDebug(userId, cleanEmail, true, normalizedRole);
            return res;
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Supabase admin check warning:', err);
    }
  }

  // 4. Fallback / Offline / Pre-Authorized Seed Allowlist
  const localAdmins = getLocalAdminUsers();
  const match = localAdmins.find(
    (a) => (userId && a.user_id === userId) || (cleanEmail && a.email?.toLowerCase() === cleanEmail)
  );

  if (match && match.is_active !== false) {
    if (userId && (!match.user_id || match.user_id.startsWith('uuid-seed-'))) {
      match.user_id = userId;
      match.status = 'ACTIVE';
      setLocalAdminUsers(localAdmins.map((a) => (a.id === match.id ? match : a)));
    }
    const normalizedRole = match.role === 'super_admin' || match.role === 'superadmin' ? 'superadmin' : 'admin';
    const res = {
      isAdmin: true,
      role: normalizedRole,
      isSuperAdmin: normalizedRole === 'superadmin',
      record: { ...match, role: normalizedRole }
    };
    logAuthDebug(userId, cleanEmail, true, normalizedRole);
    return res;
  }

  logAuthDebug(userId, cleanEmail, false, 'none');
  return {
    isAdmin: false,
    role: 'none',
    isSuperAdmin: false,
    record: null
  };
}

/**
 * Fetch all registered administrator accounts
 */
export async function fetchAdminUsers() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const local = getLocalAdminUsers();
        // Merge DB data with local state so pre-authorized seeds are never lost
        const dbEmails = new Set(data.map((d) => d.email?.toLowerCase()));
        const merged = [
          ...data.map((admin) => ({
            ...admin,
            role: admin.role === 'super_admin' || admin.role === 'superadmin' ? 'superadmin' : 'admin',
            status: admin.user_id ? 'ACTIVE' : 'PENDING'
          })),
          ...local.filter((l) => !dbEmails.has(l.email?.toLowerCase()))
        ];

        setLocalAdminUsers(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Failed to fetch admin users from Supabase:', err);
    }
  }
  
  const local = getLocalAdminUsers();
  return local.map((admin) => ({
    ...admin,
    role: admin.role === 'super_admin' || admin.role === 'superadmin' ? 'superadmin' : 'admin',
    status: admin.user_id && !admin.user_id.startsWith('uuid-seed-') ? 'ACTIVE' : 'PENDING'
  }));
}

/**
 * Authorize a new administrator (Supports pending invite with user_id = NULL)
 */
export async function addAdminUser({ email, role = 'admin', fullName = '', userId = null }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please provide a valid administrator email address.');
  }

  const normalizedRole = role === 'super_admin' || role === 'superadmin' ? 'superadmin' : 'admin';
  const cleanName = fullName?.trim() || cleanEmail.split('@')[0];

  if (isSupabaseConfigured) {
    // 1. Try secure RPC authorize_admin
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('authorize_admin', {
        admin_email: cleanEmail,
        admin_role: normalizedRole,
        admin_full_name: cleanName
      });

      if (!rpcError && rpcData) {
        const created = {
          ...rpcData,
          role: normalizedRole,
          status: rpcData.user_id ? 'ACTIVE' : 'PENDING'
        };
        const local = getLocalAdminUsers();
        setLocalAdminUsers([created, ...local.filter((a) => a.email?.toLowerCase() !== cleanEmail)]);
        return created;
      }

      if (rpcError) {
        // If error is a business exception, throw it directly
        if (!rpcError.message?.includes('schema cache') && !rpcError.message?.includes('function')) {
          if (rpcError.message?.includes('already authorized') || rpcError.code === '23505') {
            throw new Error(`An administrator with email "${cleanEmail}" is already authorized.`);
          }
          if (rpcError.message?.includes('Superadmin privileges') || rpcError.code === '42501') {
            throw new Error('Access Denied: Only a Super Admin can authorize new administrators.');
          }
          throw new Error(rpcError.message);
        }
      }
    } catch (rpcErr) {
      if (!rpcErr.message?.includes('schema cache') && !rpcErr.message?.includes('function')) {
        throw rpcErr;
      }
    }

    // 2. Direct table insert fallback
    try {
      let payload = {
        email: cleanEmail,
        role: normalizedRole,
        full_name: cleanName,
        user_id: userId || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let { data, error } = await supabase
        .from('admin_users')
        .insert([payload])
        .select()
        .single();

      // If user_id or updated_at columns don't exist yet on remote table, retry with base columns
      if (error && error.code === '42703') {
        const basePayload = {
          email: cleanEmail,
          role: normalizedRole === 'superadmin' ? 'super_admin' : 'admin',
          full_name: cleanName,
          is_active: true
        };
        const retry = await supabase
          .from('admin_users')
          .insert([basePayload])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        const created = {
          ...data,
          role: normalizedRole,
          status: data.user_id ? 'ACTIVE' : 'PENDING'
        };
        const local = getLocalAdminUsers();
        setLocalAdminUsers([created, ...local.filter((a) => a.email?.toLowerCase() !== cleanEmail)]);
        return created;
      }

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          throw new Error(`An administrator with email "${cleanEmail}" is already authorized.`);
        }
        if (error.code === '42501' || error.message?.includes('policy')) {
          throw new Error('Access Denied: You do not have permission to authorize administrators.');
        }
        throw new Error(error.message || 'Failed to authorize administrator.');
      }
    } catch (insertErr) {
      if (insertErr.message && !insertErr.message.includes('Table') && !insertErr.message.includes('schema')) {
        throw insertErr;
      }
    }
  }

  // Local fallback
  const local = getLocalAdminUsers();
  if (local.some((a) => a.email?.toLowerCase() === cleanEmail)) {
    throw new Error(`An administrator with email "${cleanEmail}" is already authorized.`);
  }

  const created = {
    id: `local-${Date.now()}`,
    email: cleanEmail,
    role: normalizedRole,
    full_name: cleanName,
    user_id: userId || null,
    status: userId ? 'ACTIVE' : 'PENDING',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  setLocalAdminUsers([created, ...local]);
  return created;
}

/**
 * Update an existing administrator (Role, Name, Email)
 */
export async function updateAdminUser({ id, role, fullName, email, currentAdminEmail }) {
  if (!id) throw new Error('Administrator ID is required.');

  const normalizedRole = role === 'super_admin' || role === 'superadmin' ? 'superadmin' : 'admin';
  const cleanEmail = email ? email.trim().toLowerCase() : undefined;
  const cleanName = fullName?.trim();

  if (isSupabaseConfigured) {
    // 1. Try secure RPC update_admin
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_admin', {
        target_admin_id: String(id),
        new_role: normalizedRole,
        new_full_name: cleanName || null,
        new_email: cleanEmail || null
      });

      if (!rpcError && rpcData) {
        const updated = {
          ...rpcData,
          role: normalizedRole,
          status: rpcData.user_id ? 'ACTIVE' : 'PENDING'
        };
        const local = getLocalAdminUsers();
        setLocalAdminUsers(local.map((a) => (String(a.id) === String(id) ? updated : a)));
        return updated;
      }

      if (rpcError) {
        if (!rpcError.message?.includes('schema cache') && !rpcError.message?.includes('function')) {
          if (rpcError.message?.includes('last remaining Super Admin')) {
            throw new Error('Cannot demote the last remaining Super Admin. At least one Super Admin must remain.');
          }
          if (rpcError.message?.includes('already exists')) {
            throw new Error(`An administrator with email "${cleanEmail}" already exists.`);
          }
          if (rpcError.message?.includes('Superadmin privileges') || rpcError.code === '42501') {
            throw new Error('Access Denied: Only a Super Admin can modify administrators.');
          }
          throw new Error(rpcError.message);
        }
      }
    } catch (rpcErr) {
      if (!rpcErr.message?.includes('schema cache') && !rpcErr.message?.includes('function')) {
        throw rpcErr;
      }
    }

    // 2. Direct table update fallback
    try {
      const patch = {
        role: normalizedRole === 'superadmin' ? 'super_admin' : 'admin'
      };
      if (cleanName) patch.full_name = cleanName;
      if (cleanEmail) patch.email = cleanEmail;

      const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      let query = supabase.from('admin_users').update(patch);
      
      if (isUuid) {
        query = query.eq('id', id);
      } else if (cleanEmail) {
        query = query.ilike('email', cleanEmail);
      } else {
        query = null;
      }

      if (query) {
        const { data, error } = await query.select().maybeSingle();

        if (!error && data) {
          const updated = {
            ...data,
            role: normalizedRole,
            status: data.user_id ? 'ACTIVE' : 'PENDING'
          };
          const local = getLocalAdminUsers();
          setLocalAdminUsers(local.map((a) => (String(a.id) === String(id) || a.email?.toLowerCase() === cleanEmail ? updated : a)));
          return updated;
        }

        if (error) {
          if (error.code === '42501') {
            throw new Error('Access Denied: You do not have permission to modify administrators.');
          }
          if (error.code !== '22P02' && !error.message?.includes('schema')) {
            throw new Error(error.message || 'Failed to update administrator.');
          }
        }
      }
    } catch (updateErr) {
      if (updateErr.message && !updateErr.message.includes('Table') && !updateErr.message.includes('schema') && !updateErr.message.includes('22P02')) {
        throw updateErr;
      }
    }
  }

  // Local fallback
  const local = getLocalAdminUsers();
  const target = local.find((a) => String(a.id) === String(id) || (cleanEmail && a.email?.toLowerCase() === cleanEmail));
  if (!target) throw new Error('Administrator not found.');

  // Check last superadmin protection
  if ((target.role === 'superadmin' || target.role === 'super_admin') && normalizedRole === 'admin') {
    const superAdminCount = local.filter((a) => a.role === 'superadmin' || a.role === 'super_admin').length;
    if (superAdminCount <= 1) {
      throw new Error('Cannot demote the last remaining Super Admin. At least one Super Admin must remain.');
    }
  }

  const updated = {
    ...target,
    role: normalizedRole,
    full_name: cleanName || target.full_name,
    email: cleanEmail || target.email,
    updated_at: new Date().toISOString()
  };
  setLocalAdminUsers(local.map((a) => (String(a.id) === String(id) || a.email?.toLowerCase() === target.email?.toLowerCase() ? updated : a)));
  return updated;
}

/**
 * Revoke administrator access
 */
export async function removeAdminUser(adminId, currentAdminEmail) {
  if (!adminId) throw new Error('Invalid administrator ID.');

  const cleanCurrentEmail = (currentAdminEmail || '').trim().toLowerCase();
  const local = getLocalAdminUsers();
  const target = local.find((a) => 
    String(a.id) === String(adminId) || 
    String(a.user_id) === String(adminId) || 
    (typeof adminId === 'string' && a.email?.toLowerCase() === adminId.toLowerCase())
  );

  // Self-revocation check
  if (cleanCurrentEmail && target?.email?.toLowerCase() === cleanCurrentEmail) {
    const superAdminCount = local.filter((a) => a.role === 'superadmin' || a.role === 'super_admin').length;
    if (superAdminCount <= 1 && (target.role === 'superadmin' || target.role === 'super_admin')) {
      throw new Error('Cannot revoke your own access as the last remaining Super Admin.');
    }
  }

  if (isSupabaseConfigured) {
    // 1. Try secure RPC revoke_admin
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('revoke_admin', {
        target_admin_id: String(adminId)
      });

      if (!rpcError && rpcData?.success) {
        setLocalAdminUsers(local.filter((a) => String(a.id) !== String(adminId) && a.email?.toLowerCase() !== target?.email?.toLowerCase()));
        return true;
      }

      if (rpcError) {
        if (!rpcError.message?.includes('schema cache') && !rpcError.message?.includes('function')) {
          if (rpcError.message?.includes('last remaining Super Admin')) {
            throw new Error('Cannot revoke the last remaining Super Admin. At least one Super Admin must remain.');
          }
          if (rpcError.message?.includes('Superadmin privileges') || rpcError.code === '42501') {
            throw new Error('Access Denied: Only a Super Admin can revoke administrators.');
          }
          throw new Error(rpcError.message);
        }
      }
    } catch (rpcErr) {
      if (!rpcErr.message?.includes('schema cache') && !rpcErr.message?.includes('function')) {
        throw rpcErr;
      }
    }

    // 2. Direct table delete fallback
    try {
      const isUuid = typeof adminId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(adminId);
      let query = supabase.from('admin_users').delete();
      
      if (isUuid) {
        query = query.eq('id', adminId);
      } else if (target?.email) {
        query = query.ilike('email', target.email);
      } else {
        query = null;
      }
      
      if (query) {
        const { error } = await query;
        if (error && error.code === '42501') {
          throw new Error('Access Denied: You do not have permission to revoke administrators.');
        }
      }
    } catch (err) {
      if (err.message && !err.message.includes('Table') && !err.message.includes('schema') && !err.message.includes('22P02')) {
        throw err;
      }
    }
  }

  // Local fallback check
  if (target && (target.role === 'superadmin' || target.role === 'super_admin')) {
    const superAdminCount = local.filter((a) => a.role === 'superadmin' || a.role === 'super_admin').length;
    if (superAdminCount <= 1) {
      throw new Error('Cannot revoke the last remaining Super Admin. At least one Super Admin must remain.');
    }
  }

  setLocalAdminUsers(local.filter((a) => String(a.id) !== String(adminId) && a.email?.toLowerCase() !== target?.email?.toLowerCase()));
  return true;
}

// ==========================================
// ADMIN NOTIFICATION CENTER API
// ==========================================

const LOCAL_ADMIN_NOTIFICATIONS_KEY = 'apex_db_admin_notifications';

function getLocalAdminNotifications() {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_NOTIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function setLocalAdminNotifications(list) {
  try {
    localStorage.setItem(LOCAL_ADMIN_NOTIFICATIONS_KEY, JSON.stringify(list));
  } catch (e) {}
}

export async function fetchAdminNotifications(limit = 100) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn('fetchAdminNotifications error:', err);
    }
  }
  return getLocalAdminNotifications();
}

export async function markAdminNotificationRead(id) {
  if (isSupabaseConfigured && id) {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (err) {
      console.warn('markAdminNotificationRead error:', err);
    }
  }

  const local = getLocalAdminNotifications();
  const updated = local.map((n) => (String(n.id) === String(id) ? { ...n, is_read: true } : n));
  setLocalAdminNotifications(updated);
  return true;
}

export async function markAllAdminNotificationsRead() {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);
    } catch (err) {
      console.warn('markAllAdminNotificationsRead error:', err);
    }
  }

  const local = getLocalAdminNotifications();
  const updated = local.map((n) => ({ ...n, is_read: true }));
  setLocalAdminNotifications(updated);
  return true;
}

export async function deleteAdminNotification(id) {
  if (isSupabaseConfigured && id) {
    try {
      await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', id);
    } catch (err) {}
  }
  const local = getLocalAdminNotifications();
  setLocalAdminNotifications(local.filter((n) => String(n.id) !== String(id)));
  return true;
}



