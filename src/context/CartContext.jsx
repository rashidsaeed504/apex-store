import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useLocalStorage('apex-cart', []);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const addToCart = useCallback((product, quantity = 1, openDrawer = true) => {
    if (!product) return;
    const addQty = Math.max(1, Number(quantity) || 1);

    // Normalize image format
    const resolvedImage = Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : (product.image || (typeof product.images === 'string' ? product.images : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'));

    const normalizedProduct = {
      id: product.id,
      name: product.name || 'APEX Product',
      price: Number(product.price) || 0,
      original_price: Number(product.original_price || product.originalPrice || product.price),
      discount: product.discount || null,
      slug: product.slug || (product.name ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `item-${product.id}`),
      image: resolvedImage,
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [resolvedImage],
      category: product.category || '',
      stock: Number(product.stock ?? 99),
    };

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => String(item.id) === String(product.id));
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + addQty }
            : item
        );
      }
      return [...prev, { ...normalizedProduct, quantity: addQty }];
    });

    if (openDrawer) {
      setIsCartOpen(true);
    }
  }, [setCartItems]);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
  }, [setCartItems]);

  const updateQuantity = useCallback((productId, quantity) => {
    const newQty = Number(quantity);
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(productId) ? { ...item, quantity: newQty } : item
      )
    );
  }, [setCartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, [setCartItems]);

  const isInCart = useCallback((productId) => {
    return cartItems.some((item) => String(item.id) === String(productId));
  }, [cartItems]);

  const getItemQuantity = useCallback((productId) => {
    const item = cartItems.find((item) => String(item.id) === String(productId));
    return item ? item.quantity : 0;
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal >= 10000 ? 0 : 200;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + shipping;
  }, [subtotal, shipping]);

  const value = useMemo(() => ({
    cartItems,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    cartCount,
    subtotal,
    shipping,
    total,
  }), [
    cartItems,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getItemQuantity,
    cartCount,
    subtotal,
    shipping,
    total,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
