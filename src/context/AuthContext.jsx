import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

const CUSTOMER_ADDRESSES_STORAGE_PREFIX = 'apex_cust_addresses_';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user profile from Supabase 'customers' table
  const fetchCustomerProfile = async (userId, userEmail, userMetadata = {}) => {
    if (!isSupabaseConfigured || !userId) return null;
    try {
      // 1. First attempt to fetch by auth UUID (id)
      let { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 2. If not found by UUID, try matching by authenticated email
      if (!data && userEmail) {
        const { data: emailData } = await supabase
          .from('customers')
          .select('*')
          .ilike('email', userEmail.trim())
          .maybeSingle();

        if (emailData) {
          try {
            await supabase
              .from('customers')
              .update({ id: userId, updated_at: new Date().toISOString() })
              .eq('email', emailData.email);
            data = { ...emailData, id: userId };
          } catch {
            data = emailData;
          }
        }
      }

      // 3. If no profile exists yet (e.g. first-time Google sign-in), create one safely
      if (!data && userEmail) {
        const resolvedName = userMetadata.full_name || userMetadata.name || '';
        const resolvedAvatar = userMetadata.avatar_url || userMetadata.picture || '';

        const newProfile = {
          id: userId,
          email: userEmail.trim().toLowerCase(),
          full_name: resolvedName,
          phone: userMetadata.phone || '',
          city: 'Lahore',
          shipping_address: '',
          avatar_url: resolvedAvatar,
          total_orders: 0,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdData, error: createError } = await supabase
          .from('customers')
          .insert([newProfile])
          .select()
          .maybeSingle();

        if (!createError && createdData) {
          data = createdData;
        } else {
          data = newProfile;
        }
      }

      return data;
    } catch (err) {
      console.warn('Customer profile fetch warning:', err);
      return null;
    }
  };

  // Load saved addresses for user
  const loadSavedAddresses = (userId) => {
    if (!userId) {
      setAddresses([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`${CUSTOMER_ADDRESSES_STORAGE_PREFIX}${userId}`);
      if (stored) {
        setAddresses(JSON.parse(stored));
      } else {
        setAddresses([]);
      }
    } catch (e) {
      console.warn('Failed to load saved addresses:', e);
      setAddresses([]);
    }
  };

  const saveAddressesToStorage = (userId, updatedList) => {
    if (!userId) return;
    try {
      localStorage.setItem(`${CUSTOMER_ADDRESSES_STORAGE_PREFIX}${userId}`, JSON.stringify(updatedList));
      setAddresses(updatedList);
    } catch (e) {
      console.warn('Failed to save addresses:', e);
    }
  };

  // Initial Auth Session Check & Listener
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session?.user) {
          if (isMounted) {
            setUser(session.user);
            const prof = await fetchCustomerProfile(
              session.user.id, 
              session.user.email,
              session.user.user_metadata
            );
            setProfile(prof);
            loadSavedAddresses(session.user.id);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setAddresses([]);
          }
        }
      } catch (err) {
        console.warn('Auth init error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to real-time auth changes (sign in, OAuth return, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        const prof = await fetchCustomerProfile(
          session.user.id, 
          session.user.email,
          session.user.user_metadata
        );
        setProfile(prof);
        loadSavedAddresses(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setAddresses([]);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Customer Sign In with Email & Password
  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      const prof = await fetchCustomerProfile(
        data.user.id, 
        data.user.email,
        data.user.user_metadata
      );
      setProfile(prof);
      loadSavedAddresses(data.user.id);
    }
    return data;
  };

  // Continue with Google OAuth
  const signInWithGoogle = async (redirectToPath = '/account') => {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');

    // Save intended destination so callback can redirect properly
    try {
      sessionStorage.setItem('apex_auth_redirect', redirectToPath || '/account');
    } catch (e) {
      console.warn('Failed to set sessionStorage redirect:', e);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) throw error;
    return data;
  };

  // Customer Sign Up (Explicitly does NOT auto-login user; forces manual login)
  const signUp = async ({ email, password, fullName, phone, city, address }) => {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone?.trim() || '';
    const cleanCity = city?.trim() || 'Lahore';
    const cleanAddress = address?.trim() || '';

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone,
          role: 'customer',
        },
      },
    });

    if (error) throw error;

    if (data?.user) {
      const newCust = {
        id: data.user.id,
        email: cleanEmail,
        full_name: cleanName,
        phone: cleanPhone,
        city: cleanCity,
        shipping_address: cleanAddress,
        total_orders: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase.from('customers').upsert([newCust], { onConflict: 'email' });
      } catch (err) {
        console.warn('Customer record upsert warning:', err);
      }

      if (cleanAddress) {
        const initialAddr = [
          {
            id: `addr-${Date.now()}`,
            fullName: cleanName,
            phone: cleanPhone,
            address: cleanAddress,
            city: cleanCity,
            province: 'Punjab',
            postalCode: '54000',
            country: 'Pakistan',
            isDefault: true,
          },
        ];
        saveAddressesToStorage(data.user.id, initialAddr);
      }
    }

    // Explicitly guarantee user is signed out after registration
    // so they MUST enter credentials on the Login page
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out after signup warning:', e);
    }

    setUser(null);
    setProfile(null);
    setAddresses([]);

    const needsEmailConfirmation = !data.session && data.user && data.user.identities && data.user.identities.length > 0;

    return {
      user: data.user,
      session: null,
      needsEmailConfirmation,
    };
  };

  // Customer Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    setUser(null);
    setProfile(null);
    setAddresses([]);
  };

  // Reset Password Request (Forgot Password)
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');
    const redirectTo = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) throw error;
    return data;
  };

  // Update Password (from Reset Password link or account profile)
  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured) throw new Error('Supabase client not configured.');
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  };

  // Update Customer Profile
  const updateProfile = async (updates) => {
    if (!user) throw new Error('User is not authenticated.');

    const updatedData = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('customers')
          .upsert([
            {
              id: user.id,
              email: user.email,
              full_name: updatedData.full_name || '',
              phone: updatedData.phone || '',
              city: updatedData.city || '',
              shipping_address: updatedData.shipping_address || '',
              updated_at: new Date().toISOString(),
            },
          ], { onConflict: 'email' });
      } catch (err) {
        console.warn('Profile Supabase update warning:', err);
      }
    }

    setProfile(updatedData);
    return updatedData;
  };

  // Address Management
  const addAddress = (newAddr) => {
    if (!user) return;
    const isFirst = addresses.length === 0;
    const addr = {
      id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...newAddr,
      isDefault: isFirst || Boolean(newAddr.isDefault),
    };

    let updated = [...addresses];
    if (addr.isDefault) {
      updated = updated.map((a) => ({ ...a, isDefault: false }));
    }
    updated.push(addr);
    saveAddressesToStorage(user.id, updated);
  };

  const updateAddress = (addressId, updatedFields) => {
    if (!user) return;
    let updated = addresses.map((a) => {
      if (a.id === addressId) {
        return { ...a, ...updatedFields };
      }
      if (updatedFields.isDefault) {
        return { ...a, isDefault: false };
      }
      return a;
    });
    saveAddressesToStorage(user.id, updated);
  };

  const deleteAddress = (addressId) => {
    if (!user) return;
    const filtered = addresses.filter((a) => a.id !== addressId);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }
    saveAddressesToStorage(user.id, filtered);
  };

  const setDefaultAddress = (addressId) => {
    if (!user) return;
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    saveAddressesToStorage(user.id, updated);
  };

  const value = {
    user,
    profile,
    addresses,
    loading,
    isAuth: Boolean(user),
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshProfile: () => user && fetchCustomerProfile(user.id, user.email, user.user_metadata).then(setProfile),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
