import React, { useState, useEffect } from "react";
import { InstagramIcon } from "../ui/SocialIcons";
import { 
  fetchSocialGallery, 
  invalidateSocialGalleryCache, 
  INITIAL_SEED_SOCIAL_GALLERY 
} from "../../services/api";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

const InstagramFeed = () => {
  const [galleryItems, setGalleryItems] = useState(INITIAL_SEED_SOCIAL_GALLERY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadGallery() {
      try {
        const data = await fetchSocialGallery(true);
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setGalleryItems(data);
          } else {
            setGalleryItems(INITIAL_SEED_SOCIAL_GALLERY);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch social gallery for storefront:", err);
        if (isMounted) setGalleryItems(INITIAL_SEED_SOCIAL_GALLERY);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGallery();

    // Listen for live admin updates across tabs/components
    const handleUpdate = () => {
      invalidateSocialGalleryCache();
      loadGallery();
    };

    window.addEventListener("apex_social_gallery_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Supabase Realtime channel subscription
    let channel = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel("public:social_gallery_sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "social_gallery" },
            () => {
              invalidateSocialGalleryCache();
              loadGallery();
            }
          )
          .subscribe();
      } catch (e) {
        console.warn("Realtime social gallery subscription warning:", e);
      }
    }

    return () => {
      isMounted = false;
      window.removeEventListener("apex_social_gallery_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const items = galleryItems.length > 0 ? galleryItems : INITIAL_SEED_SOCIAL_GALLERY;

  return (
    <section className="py-12 sm:py-16 bg-[#050505] relative z-10 border-t border-white/5 overflow-hidden select-none">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wider text-white">
            FOLLOW THE APEX
          </h2>
          <a
            href="https://www.instagram.com/apexstor.pk/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white flex items-center transition-colors text-xs font-bold uppercase tracking-wider group"
          >
            <InstagramIcon className="w-4 h-4 mr-1.5 text-apex-red group-hover:scale-110 transition-transform" />
            @APEXSTOR.PK
          </a>
        </div>

        {/* ========================================================= */}
        {/* MOBILE VIEW (md:hidden): Clean Manual Scroll Row (No Auto-Slide) */}
        {/* ========================================================= */}
        <div className="block md:hidden w-full overflow-hidden relative">
          <div
            className="flex items-center gap-3 py-1 overflow-x-auto select-none touch-pan-x hide-scrollbar w-full"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {items.map((item, index) => {
              const hasLink = Boolean(item?.link_url);
              const CardWrapper = hasLink ? "a" : "div";
              const wrapperProps = hasLink
                ? {
                    href: item.link_url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : {};

              return (
                <CardWrapper
                  key={`mobile-social-${item.id || index}`}
                  {...wrapperProps}
                  className="shrink-0 w-36 sm:w-44 relative group rounded-2xl overflow-hidden aspect-square border border-white/10 block bg-[#0a0a0a] active:scale-95 transition-transform"
                >
                  <img
                    src={item.image_url}
                    alt={item.alt_text || `Social gallery post ${index + 1}`}
                    loading="lazy"
                    width={200}
                    height={200}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop";
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
                    <InstagramIcon className="w-6 h-6 text-white mb-1" />
                    {item.caption && (
                      <p className="text-[10px] text-gray-300 line-clamp-2 leading-tight">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </CardWrapper>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP VIEW (hidden md:grid): Responsive Grid (No Auto-Slide) */}
        {/* ========================================================= */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((item, index) => {
            const hasLink = Boolean(item?.link_url);
            const CardWrapper = hasLink ? "a" : "div";
            const wrapperProps = hasLink
              ? {
                  href: item.link_url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                }
              : {};

            return (
              <CardWrapper
                key={`desktop-social-${item.id || index}`}
                {...wrapperProps}
                className="relative group rounded-2xl overflow-hidden aspect-square border border-white/10 hover:border-apex-red/60 hover:shadow-[0_0_25px_rgba(220,38,38,0.3)] transition-all duration-300 block bg-[#0a0a0a] cursor-pointer"
              >
                <img
                  src={item.image_url}
                  alt={item.alt_text || `Social gallery post ${index + 1}`}
                  loading="lazy"
                  width={300}
                  height={300}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop";
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center">
                  <InstagramIcon className="w-7 h-7 text-white mb-1.5 text-apex-red" />
                  {item.caption && (
                    <p className="text-[11px] text-gray-200 line-clamp-2 leading-snug font-medium">
                      {item.caption}
                    </p>
                  )}
                  {item.alt_text && (
                    <span className="text-[9px] text-apex-red font-bold uppercase tracking-wider mt-1">
                      {item.alt_text}
                    </span>
                  )}
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
