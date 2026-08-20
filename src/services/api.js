// APEX STORE — Decoupled API Service (Live Supabase Client with Fallback)
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { products as initialProducts } from '../data/products.js';
import { categories as initialCategories } from '../data/categories.js';

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

    // Handle PGRST204 missing column in schema cache gracefully
    if (error.code === 'PGRST204' && error.message?.includes('Could not find the')) {
      const match = error.message.match(/Could not find the '([^']+)' column/);
      if (match && match[1] && currentPayload[match[1]] !== undefined) {
        console.warn(`[Supabase Schema Fallback] Removing missing column '${match[1]}' from '${table}' payload and retrying...`);
        delete currentPayload[match[1]];
        continue;
      }
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
  const stored = localStorage.getItem(LOCAL_ORDERS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { console.error(e); }
  }
  return [];
};

const setLocalOrders = (list) => {
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

export async function fetchProducts(includeArchived = false) {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!includeArchived) {
        query = query.neq('status', 'Archived').neq('status', 'Inactive');
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map(normalizeProduct);
      }
    } catch (e) {
      console.warn('Supabase fetch error:', e.message);
    }
  }
  const local = getLocalProducts();
  return includeArchived ? local : local.filter((p) => p.status !== 'Archived' && p.status !== 'Inactive');
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
// 1.5 SPECIAL OFFERS API (HOMEPAGE DYNAMIC PROMO DEAL)
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

function setLocalSpecialOffer(config) {
  try {
    localStorage.setItem(LOCAL_SPECIAL_OFFER_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save local special offer:', e);
  }
}

// Fetch Active Special Offer for Homepage Display
export async function fetchActiveSpecialOffer() {
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
        // Date range verification
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
      console.warn('Supabase fetchActiveSpecialOffer error:', e);
    }
  }

  // Fallback from localStorage
  const localConfig = getLocalSpecialOffer();
  if (localConfig && localConfig.isActive !== false) {
    const now = new Date();
    if (localConfig.startAt && new Date(localConfig.startAt) > now) return null;
    if (localConfig.endAt && new Date(localConfig.endAt) < now) return null;

    const allProducts = await fetchProducts();
    const product = allProducts.find((p) => p.id === Number(localConfig.productId)) || allProducts[0];
    if (!product) return null;

    const salePrice = localConfig.salePrice !== undefined && localConfig.salePrice !== '' ? Number(localConfig.salePrice) : product.price;
    const originalPrice = localConfig.originalPrice !== undefined && localConfig.originalPrice !== '' ? Number(localConfig.originalPrice) : (product.originalPrice || product.price);
    const discount = localConfig.discountPercentage !== undefined && localConfig.discountPercentage !== '' 
      ? Number(localConfig.discountPercentage) 
      : (originalPrice > salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0);

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
      discount: discount,
      features: Array.isArray(localConfig.features) && localConfig.features.length > 0 ? localConfig.features : (product.features || []),
      warrantyText: localConfig.warrantyText || 'Official 1-Year Warranty',
      deliveryText: localConfig.deliveryText || 'Express Delivery Across Pakistan',
      primaryButtonText: localConfig.primaryButtonText || 'SHOP NOW',
      secondaryButtonText: localConfig.secondaryButtonText || 'VIEW ALL DEALS',
      startAt: localConfig.startAt,
      endAt: localConfig.endAt,
      images: product.images,
      image: product.images?.[0],
      rating: product.rating,
      reviews: product.reviews,
      slug: product.slug,
      category: product.category,
    };
  }

  // Graceful product fallback if table is not yet seeded
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
    image: p.images?.[0],
    rating: p.rating,
    reviews: p.reviews,
    slug: p.slug,
    category: p.category,
  };
}

// Fetch for Admin Portal
export async function fetchAdminSpecialOffer() {
  if (isSupabaseConfigured) {
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
    } catch (e) {
      console.warn('Supabase fetchAdminSpecialOffer error:', e);
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

// Save / Update Special Offer Configuration from Admin Portal
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
    try {
      const { data: existing } = await supabase
        .from('special_offers')
        .select('id')
        .order('id')
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await supabase
          .from('special_offers')
          .update(dbPayload)
          .eq('id', existing.id)
          .select('*, product:products(*)')
          .single();

        if (!error && data) {
          setLocalSpecialOffer({ ...payload, id: data.id });
          return data;
        }
      } else {
        const { data, error } = await supabase
          .from('special_offers')
          .insert([dbPayload])
          .select('*, product:products(*)')
          .single();

        if (!error && data) {
          setLocalSpecialOffer({ ...payload, id: data.id });
          return data;
        }
      }
    } catch (e) {
      console.warn('Supabase saveSpecialOffer error:', e);
    }
  }

  const saved = { ...payload, id: payload.id || Date.now() };
  setLocalSpecialOffer(saved);
  return saved;
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
  if (!token) return;
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

// 1. Create Order (Attach user_id / customer_id if logged in, otherwise attach secure guest_order_token)
export async function createOrder(orderPayload) {
  const orderNumber = `APEX-${Math.floor(1000 + Math.random() * 9000)}`;
  const userId = await getCurrentUserId();
  const guestToken = generateGuestOrderToken();

  const newOrder = {
    order_number: orderNumber,
    customer_id: userId, // Primary UUID linking to authenticated customer
    user_id: userId, // Backward compatibility
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
          .or(`customer_id.eq.${userId},user_id.eq.${userId}`)
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
  let updatedSupabase = false;

  if (isSupabaseConfigured) {
    try {
      // 1. If identifier is an order number string like 'APEX-1645'
      if (typeof orderIdentifier === 'string' && orderIdentifier.toUpperCase().startsWith('APEX-')) {
        const { data, error } = await supabase
          .from('orders')
          .update({ status: cleanStatus, updated_at: new Date().toISOString() })
          .ilike('order_number', orderIdentifier.trim())
          .select();
        if (!error && data && data.length > 0) updatedSupabase = true;
      }

      // 2. If fallback order number is provided
      if (!updatedSupabase && orderNumberFallback) {
        const { data, error } = await supabase
          .from('orders')
          .update({ status: cleanStatus, updated_at: new Date().toISOString() })
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
            .update({ status: cleanStatus, updated_at: new Date().toISOString() })
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
      return { ...o, status: cleanStatus, updated_at: new Date().toISOString() };
    }
    return o;
  });

  setLocalOrders(updatedList);
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
 * Verify whether a customer has purchased and had this product DELIVERED.
 * Strictly checks:
 * 1. User must be authenticated or have a verified matching customer email.
 * 2. An order must exist containing this specific product ID/name.
 * 3. The order status MUST be 'Delivered'.
 */
export async function checkReviewEligibility({ productId, productName, productSlug, user, email }) {
  if (!user && !email) {
    return {
      eligible: false,
      reason: 'Please sign in to your customer account to submit a review.',
      requiresAuth: true,
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
          .or(`customer_id.eq.${userId},user_id.eq.${userId}`);
        if (!error && Array.isArray(data)) {
          customerOrders = data;
        }
      }
      if (customerOrders.length === 0 && customerEmail) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .ilike('customer_email', customerEmail);
        if (!error && Array.isArray(data)) {
          customerOrders = data;
        }
      }
    }

    if (customerOrders.length === 0) {
      const localOrders = getLocalOrders();
      customerOrders = localOrders.filter(
        (o) =>
          (userId && (o.customer_id === userId || o.user_id === userId)) ||
          (customerEmail && (o.customer_email || '').toLowerCase() === customerEmail)
      );
    }

    // Filter delivered orders
    const deliveredOrders = customerOrders.filter(
      (o) => (o.status || '').toLowerCase() === 'delivered'
    );

    if (deliveredOrders.length === 0) {
      // Check if user has an order currently in transit or processing
      const activeOrders = customerOrders.filter(
        (o) =>
          (o.status || '').toLowerCase() !== 'delivered' &&
          (o.status || '').toLowerCase() !== 'cancelled'
      );

      const hasActiveOrder = activeOrders.some((o) => {
        const items = Array.isArray(o.items)
          ? o.items
          : typeof o.items === 'string'
          ? JSON.parse(o.items)
          : [];
        return items.some(
          (it) =>
            Number(it.id || it.product_id) === Number(productId) ||
            (productName && (it.name || '').toLowerCase() === productName.toLowerCase())
        );
      });

      if (hasActiveOrder) {
        return {
          eligible: false,
          reason: 'Your order for this item is currently on its way. You can submit a review once your package is marked as Delivered!',
          orderStatus: 'in_transit',
        };
      }

      return {
        eligible: false,
        reason: 'Only verified customers who have purchased and received this product can write a review.',
        orderStatus: 'none',
      };
    }

    // Check if any of the delivered orders contains this product
    let matchedOrder = null;
    for (const order of deliveredOrders) {
      const items = Array.isArray(order.items)
        ? order.items
        : typeof order.items === 'string'
        ? JSON.parse(order.items)
        : [];
      const hasItem = items.some(
        (it) =>
          Number(it.id || it.product_id) === Number(productId) ||
          (productSlug && it.slug === productSlug) ||
          (productName && (it.name || '').toLowerCase() === productName.toLowerCase())
      );
      if (hasItem) {
        matchedOrder = order;
        break;
      }
    }

    if (!matchedOrder) {
      return {
        eligible: false,
        reason: 'You can only review products that you have purchased and had delivered.',
        orderStatus: 'not_purchased',
      };
    }

    // Check existing customer review
    const existingReviews = await fetchCustomerReviews(userId, customerEmail);
    const existing = existingReviews.find((r) => Number(r.product_id) === Number(productId));

    return {
      eligible: true,
      order: matchedOrder,
      existingReview: existing || null,
    };
  } catch (err) {
    console.warn('checkReviewEligibility error:', err);
    return {
      eligible: false,
      reason: 'Error verifying purchase. Please try again.',
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
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', Number(productId))
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetchProductReviews error:', e.message);
    }
  }

  const local = getLocalReviews();
  return local
    .filter((r) => Number(r.product_id) === Number(productId) && r.status === 'approved')
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
      (userId && r.customer_id === userId) ||
      (userEmail && (r.customer_email || '').toLowerCase() === (userEmail || '').toLowerCase())
  );

  const map = new Map();
  for (const r of filteredLocal) map.set(String(r.id), r);
  for (const r of list) map.set(String(r.id), r);
  return Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

/**
 * Fetch unreviewed products from delivered orders for the authenticated customer
 */
export async function fetchEligibleUnreviewedItems(user) {
  if (!user) return [];
  try {
    const orders = await fetchMyOrders();
    const delivered = orders.filter((o) => (o.status || '').toLowerCase() === 'delivered');
    const existingReviews = await fetchCustomerReviews(user.id, user.email);
    const reviewedProductIds = new Set(existingReviews.map((r) => Number(r.product_id)));

    const unreviewed = [];
    for (const order of delivered) {
      const items = Array.isArray(order.items)
        ? order.items
        : typeof order.items === 'string'
        ? JSON.parse(order.items)
        : [];
      for (const item of items) {
        const pid = Number(item.id || item.product_id);
        if (pid && !reviewedProductIds.has(pid) && !unreviewed.some((u) => u.productId === pid)) {
          unreviewed.push({
            productId: pid,
            productName: item.name || item.product_name,
            productImage: item.image || item.images?.[0] || '',
            price: item.price,
            orderNumber: order.order_number,
            deliveredAt: order.updated_at || order.created_at,
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
 * Submit or Edit a verified customer review
 */
export async function submitProductReview({
  productId,
  productName,
  customerName,
  customerEmail,
  rating,
  reviewText,
  user = null,
  existingReviewId = null,
}) {
  if (!productId || !rating || !reviewText) {
    throw new Error('Please fill in all required review fields.');
  }

  // Verify eligibility
  const verification = await checkReviewEligibility({
    productId,
    productName,
    user,
    email: customerEmail || user?.email,
  });

  if (!verification.eligible && !existingReviewId) {
    throw new Error(verification.reason || 'You are not eligible to review this product.');
  }

  const userId = user?.id || null;
  const name = customerName || user?.user_metadata?.full_name || 'Verified Customer';
  const email = (user?.email || customerEmail || '').trim().toLowerCase();

  const payload = {
    product_id: Number(productId),
    product_name: productName || 'APEX Product',
    customer_id: userId,
    customer_name: name,
    customer_email: email,
    rating: Math.max(1, Math.min(5, Number(rating))),
    review_text: reviewText.trim(),
    status: 'approved', // Auto-approved for verified delivered buyers
    verified_purchase: true,
    order_id: verification.order?.id || verification.order?.order_number || null,
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
          return data;
        }
      } catch (e) {
        console.warn('Supabase review insert error:', e);
      }
    }

    await calculateProductRating(productId);
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
      if (!error && data) {
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
      if (!matchName && !matchEmail && !matchProduct && !matchText) return false;
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
    await updateProduct(Number(productId), {
      rating: averageRating,
      reviews: count
    });
  } catch (err) {
    console.warn(`Failed to auto-update rating for product #${productId}:`, err);
  }

  return { rating: averageRating, reviewsCount: count };
}

// ==========================================
// 8. PROMOTIONAL BANNERS API
// ==========================================

const LOCAL_BANNERS_KEY = 'apex_promotional_banners';

const INITIAL_SEED_BANNERS = [
  {
    id: 1,
    title: 'OFFICIAL PARTNERSHIP',
    subtitle: 'PUBG MOBILE × APEX ZERO • ULTRA-LOW LATENCY 20MS GAMING GEAR',
    badge_text: 'EXCLUSIVE COLLAB',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
    button_text: 'EXPLORE GEAR',
    button_url: '/shop',
    open_in_new_tab: false,
    display_order: 1,
    is_active: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'SUMMER CYBER DROP',
    subtitle: 'UP TO 40% OFF ON PRO WIRELESS HEADSETS & HI-FI SMARTWEAR',
    badge_text: 'LIMITED TIME DEAL',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80',
    button_text: 'VIEW DEALS',
    button_url: '/deals',
    open_in_new_tab: false,
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let inMemoryBanners = [...INITIAL_SEED_BANNERS];

function getLocalBanners() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(LOCAL_BANNERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryBanners = parsed;
          return parsed;
        }
      }
      window.localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(INITIAL_SEED_BANNERS));
    }
    return inMemoryBanners;
  } catch (e) {
    return inMemoryBanners;
  }
}

function setLocalBanners(banners) {
  inMemoryBanners = Array.isArray(banners) ? [...banners] : [];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(inMemoryBanners));
    }
  } catch (e) {
    console.warn('Failed to save local banners:', e);
  }
}

/**
 * Fetch promotional banners for storefront homepage
 * @param {boolean} onlyActive - Filter only active banners
 */
export async function fetchBanners(onlyActive = true) {
  let banners = [];

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('banners').select('*').order('display_order', { ascending: true });
      if (onlyActive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        banners = data;
      }
    } catch (e) {
      console.warn('Supabase fetchBanners error:', e.message);
    }
  }

  if (banners.length === 0) {
    banners = getLocalBanners();
    if (onlyActive) {
      banners = banners.filter((b) => b.is_active !== false);
    }
  }

  return banners.sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));
}

/**
 * Fetch all banners for Admin Portal (includes active and inactive)
 */
export async function fetchAdminBanners() {
  return fetchBanners(false);
}

/**
 * Save or Update a promotional banner
 */
export async function saveBanner(bannerData) {
  const isEditing = Boolean(bannerData.id);
  const now = new Date().toISOString();

  const payload = {
    title: bannerData.title?.trim() || '',
    subtitle: bannerData.subtitle?.trim() || '',
    badge_text: bannerData.badge_text?.trim() || '',
    image_url: bannerData.image_url?.trim() || '',
    button_text: bannerData.button_text?.trim() || '',
    button_url: bannerData.button_url?.trim() || '',
    open_in_new_tab: Boolean(bannerData.open_in_new_tab),
    display_order: Number(bannerData.display_order) || 1,
    is_active: bannerData.is_active !== false,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      if (isEditing) {
        const data = await safeSupabaseMutation('banners', 'update', payload, 'id', bannerData.id);
        if (data) {
          const local = getLocalBanners();
          const updated = local.map((b) => (b.id === bannerData.id ? { ...b, ...data } : b));
          setLocalBanners(updated);
          return data;
        }
      } else {
        payload.created_at = now;
        const data = await safeSupabaseMutation('banners', 'insert', payload);
        if (data) {
          const local = getLocalBanners();
          setLocalBanners([...local, data]);
          return data;
        }
      }
    } catch (e) {
      console.warn('Supabase saveBanner fallback:', e.message);
    }
  }

  const local = getLocalBanners();
  if (isEditing) {
    const updated = local.map((b) => (b.id === bannerData.id ? { ...b, ...payload } : b));
    setLocalBanners(updated);
    return { ...payload, id: bannerData.id };
  } else {
    const newId = Date.now();
    const created = { ...payload, id: newId, created_at: now };
    setLocalBanners([...local, created]);
    return created;
  }
}

/**
 * Delete a banner by ID
 */
export async function deleteBanner(bannerId) {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('banners').delete().eq('id', bannerId);
      if (error) console.warn('Supabase deleteBanner error:', error.message);
    } catch (e) {
      console.warn('Supabase deleteBanner fallback:', e.message);
    }
  }

  const local = getLocalBanners();
  setLocalBanners(local.filter((b) => b.id !== bannerId));
  return true;
}

/**
 * Toggle a banner's active status
 */
export async function toggleBannerStatus(bannerId, isActive) {
  if (isSupabaseConfigured) {
    try {
      await safeSupabaseMutation('banners', 'update', { 
        is_active: isActive, 
        updated_at: new Date().toISOString() 
      }, 'id', bannerId);
    } catch (e) {
      console.warn('Supabase toggleBannerStatus fallback:', e.message);
    }
  }

  const local = getLocalBanners();
  const updated = local.map((b) => (String(b.id) === String(bannerId) ? { ...b, is_active: isActive, updated_at: new Date().toISOString() } : b));
  setLocalBanners(updated);
  return updated.find((b) => String(b.id) === String(bannerId)) || { id: bannerId, is_active: isActive };
}

/**
 * Update display order for multiple banners
 */
export async function updateBannersOrder(bannersList) {
  const local = getLocalBanners();
  const updatedLocal = local.map((b) => {
    const match = bannersList.find((item) => item.id === b.id);
    return match ? { ...b, display_order: match.display_order } : b;
  });
  setLocalBanners(updatedLocal);

  if (isSupabaseConfigured) {
    for (const b of bannersList) {
      try {
        await supabase.from('banners').update({ display_order: b.display_order }).eq('id', b.id);
      } catch (e) {
        console.warn('Supabase update order error:', e);
      }
    }
  }

  return updatedLocal;
}

// ==========================================
// 8. HERO SLIDER API (SUPABASE + RESILIENT LOCAL ENGINE)
// ==========================================

const LOCAL_HERO_SLIDES_KEY = 'apex_hero_slides_v1';

export const INITIAL_SEED_HERO_SLIDES = [
  {
    id: 1,
    badge: 'PREMIUM TECH. PREMIUM YOU.',
    title: 'TECH WITHOUT',
    highlight_text: 'LIMITS.',
    description: 'Discover next-generation spatial audio, noise-canceling headphones and wireless gear engineered for uncompromising performance.',
    primary_button_text: 'SHOP NOW',
    primary_button_link: '/shop',
    secondary_button_text: 'EXPLORE DEALS',
    secondary_button_link: '/deals',
    desktop_image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
    mobile_image_url: '',
    features: ['100% Original', 'Free Delivery', '7 Days Return', '24/7 Support'],
    promotional_badge: 'FLAGSHIP',
    is_active: true,
    sort_order: 1,
    autoplay_duration: 6000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    badge: 'NEXT-GEN TITANIUM WEARABLE',
    title: 'PRECISION ON YOUR',
    highlight_text: 'WRIST.',
    description: 'Crystal AMOLED displays, aerospace titanium casings, advanced health tracking, and ultra-long 14-day battery life.',
    primary_button_text: 'EXPLORE WATCHES',
    primary_button_link: '/category/smart-watches',
    secondary_button_text: 'VIEW BEST SELLERS',
    secondary_button_link: '/best-sellers',
    desktop_image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1200&auto=format&fit=crop&q=80',
    mobile_image_url: '',
    features: ['AMOLED Display', 'Titanium Build', '14-Day Battery', 'IP68 Waterproof'],
    promotional_badge: 'NEW ARRIVAL',
    is_active: true,
    sort_order: 2,
    autoplay_duration: 6000,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    badge: 'PRO GAMING ARSENAL',
    title: 'DOMINATE EVERY',
    highlight_text: 'BATTLE.',
    description: 'Ultra-low latency Bluetooth 5.4, mechanical precision, and immersive studio acoustics engineered for competitive gaming.',
    primary_button_text: 'GAMING GEAR',
    primary_button_link: '/category/gaming',
    secondary_button_text: 'HOT OFFERS',
    secondary_button_link: '/deals',
    desktop_image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&auto=format&fit=crop&q=80',
    mobile_image_url: '',
    features: ['Ultra-Low Latency', 'Studio Audio', 'Dual Mic ANC', '1-Year Warranty'],
    promotional_badge: 'LIMITED TIME DEAL',
    is_active: true,
    sort_order: 3,
    autoplay_duration: 6000,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

function getLocalHeroSlides() {
  try {
    const raw = localStorage.getItem(LOCAL_HERO_SLIDES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(LOCAL_HERO_SLIDES_KEY, JSON.stringify(INITIAL_SEED_HERO_SLIDES));
    return INITIAL_SEED_HERO_SLIDES;
  } catch (e) {
    return INITIAL_SEED_HERO_SLIDES;
  }
}

function setLocalHeroSlides(slides) {
  try {
    localStorage.setItem(LOCAL_HERO_SLIDES_KEY, JSON.stringify(slides));
  } catch (e) {
    console.warn('Failed to save local hero slides:', e);
  }
}

/**
 * Fetch active hero slides for the storefront
 */
export async function fetchHeroSlides() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((s) => ({
          ...s,
          features: Array.isArray(s.features) ? s.features : (typeof s.features === 'string' ? JSON.parse(s.features || '[]') : []),
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchHeroSlides fallback:', e.message);
    }
  }

  const local = getLocalHeroSlides();
  return local.filter((s) => s.is_active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

/**
 * Fetch all hero slides for admin management
 */
export async function fetchAdminHeroSlides() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((s) => ({
          ...s,
          features: Array.isArray(s.features) ? s.features : (typeof s.features === 'string' ? JSON.parse(s.features || '[]') : []),
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchAdminHeroSlides fallback:', e.message);
    }
  }

  return getLocalHeroSlides().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

/**
 * Save or update a hero slide
 */
export async function saveHeroSlide(slideData) {
  const isEditing = Boolean(slideData.id);
  const now = new Date().toISOString();

  const payload = {
    badge: slideData.badge || '',
    title: slideData.title || '',
    highlight_text: slideData.highlight_text || '',
    description: slideData.description || '',
    primary_button_text: slideData.primary_button_text || 'SHOP NOW',
    primary_button_link: slideData.primary_button_link || '/shop',
    secondary_button_text: slideData.secondary_button_text || 'EXPLORE DEALS',
    secondary_button_link: slideData.secondary_button_link || '/deals',
    desktop_image_url: slideData.desktop_image_url || '',
    mobile_image_url: slideData.mobile_image_url || '',
    features: Array.isArray(slideData.features) ? slideData.features : (slideData.features ? String(slideData.features).split(',').map((f) => f.trim()).filter(Boolean) : []),
    promotional_badge: slideData.promotional_badge || '',
    is_active: slideData.is_active !== undefined ? Boolean(slideData.is_active) : true,
    sort_order: Number(slideData.sort_order || 1),
    autoplay_duration: Number(slideData.autoplay_duration || 6000),
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      if (isEditing) {
        const result = await safeSupabaseMutation('hero_slides', 'update', payload, 'id', slideData.id);
        if (result) {
          const local = getLocalHeroSlides();
          const updated = local.map((s) => (String(s.id) === String(slideData.id) ? { ...s, ...payload, id: slideData.id } : s));
          setLocalHeroSlides(updated);
          return { ...payload, id: slideData.id };
        }
      } else {
        const insertPayload = { ...payload, created_at: now };
        const result = await safeSupabaseMutation('hero_slides', 'insert', insertPayload);
        if (result) {
          const local = getLocalHeroSlides();
          const created = { ...insertPayload, id: result.id || Date.now() };
          setLocalHeroSlides([...local, created]);
          return created;
        }
      }
    } catch (e) {
      console.warn('Supabase saveHeroSlide fallback:', e.message);
    }
  }

  const local = getLocalHeroSlides();
  if (isEditing) {
    const updated = local.map((s) => (String(s.id) === String(slideData.id) ? { ...s, ...payload, id: slideData.id } : s));
    setLocalHeroSlides(updated);
    return { ...payload, id: slideData.id };
  } else {
    const newId = Date.now();
    const created = { ...payload, id: newId, created_at: now };
    setLocalHeroSlides([...local, created]);
    return created;
  }
}

/**
 * Delete a hero slide by ID
 */
export async function deleteHeroSlide(slideId) {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('hero_slides').delete().eq('id', slideId);
      if (error) console.warn('Supabase deleteHeroSlide error:', error.message);
    } catch (e) {
      console.warn('Supabase deleteHeroSlide fallback:', e.message);
    }
  }

  const local = getLocalHeroSlides();
  setLocalHeroSlides(local.filter((s) => String(s.id) !== String(slideId)));
  return true;
}

/**
 * Toggle hero slide active status
 */
export async function toggleHeroSlideStatus(slideId, isActive) {
  if (isSupabaseConfigured) {
    try {
      await safeSupabaseMutation('hero_slides', 'update', { 
        is_active: isActive, 
        updated_at: new Date().toISOString() 
      }, 'id', slideId);
    } catch (e) {
      console.warn('Supabase toggleHeroSlideStatus fallback:', e.message);
    }
  }

  const local = getLocalHeroSlides();
  const updated = local.map((s) => (String(s.id) === String(slideId) ? { ...s, is_active: isActive, updated_at: new Date().toISOString() } : s));
  setLocalHeroSlides(updated);
  return updated.find((s) => String(s.id) === String(slideId)) || { id: slideId, is_active: isActive };
}

/**
 * Update display order for multiple hero slides
 */
export async function updateHeroSlidesOrder(slidesList) {
  const local = getLocalHeroSlides();
  const updatedLocal = local.map((s) => {
    const match = slidesList.find((item) => String(item.id) === String(s.id));
    return match ? { ...s, sort_order: match.sort_order } : s;
  });
  setLocalHeroSlides(updatedLocal);

  if (isSupabaseConfigured) {
    for (const s of slidesList) {
      try {
        await supabase.from('hero_slides').update({ sort_order: s.sort_order }).eq('id', s.id);
      } catch (e) {
        console.warn('Supabase update hero slides order error:', e);
      }
    }
  }

  return updatedLocal;
}



