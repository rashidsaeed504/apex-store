import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// ── 5 Core Featured Categories matching the APEX Store design specification ──
const FEATURED_CATEGORIES = [
  {
    id: "earbuds",
    name: "Earbuds",
    image: "/categories/earbuds-clean.png",
    link: "/shop?category=headsets&subcategory=Earbuds",
  },
  {
    id: "headphones",
    name: "Headphones",
    image: "/categories/headphones-clean.png",
    link: "/shop?category=headsets&subcategory=Headphones",
  },
  {
    id: "smart-watches",
    name: "Smart Watches",
    image: "/categories/smartwatches-clean.png",
    link: "/category/smart-watches",
  },
  {
    id: "chargers-cables",
    name: "Chargers & Cables",
    image: "/categories/chargers-clean.png",
    link: "/shop?category=accessories",
  },
  {
    id: "speakers",
    name: "Speakers",
    image: "/categories/speakers-clean.png",
    link: "/shop?search=Speaker",
  },
];

export default function FeaturedCategories() {
  return (
    <section className="pt-8 sm:pt-12 md:pt-14 pb-4 sm:pb-6 md:pb-8 bg-[#050505] relative z-10 border-t border-white/5">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section Header matching Reference Image ── */}
        <div className="flex items-center justify-between mb-5 sm:mb-7 md:mb-9">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Shop by <span className="text-apex-red">Category</span>
          </h2>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm md:text-base font-bold text-apex-red hover:text-white transition-colors group cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-apex-red group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ── Category Cards Grid (Responsive 5-Card Layout) ── */}
        {/* Mobile: Smooth Horizontal Scrollable Snap Row | Desktop: Clean 5-Column Grid */}
        <div className="flex md:grid md:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-4 md:px-0 -mx-4 md:mx-0 pb-3 md:pb-0">
          {FEATURED_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={category.link}
              className="group relative flex flex-col items-center justify-between p-3.5 sm:p-4 md:p-5 bg-[#0a0a0a] hover:bg-[#0e0e11] border border-white/10 hover:border-apex-red/50 rounded-2xl sm:rounded-[22px] transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_36px_rgba(220,38,38,0.25)] hover:-translate-y-1.5 cursor-pointer overflow-hidden w-[140px] xs:w-[155px] sm:w-[170px] md:w-auto shrink-0 snap-start aspect-[3/4]"
            >
              {/* Ambient Red Glow on Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-apex-red/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Floating Product Image Container */}
              <div className="relative z-10 flex-1 w-full flex items-center justify-center p-1 sm:p-2">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="max-h-[110px] xs:max-h-[125px] sm:max-h-[150px] md:max-h-[165px] w-auto max-w-[90%] object-contain transition-transform duration-300 ease-out group-hover:scale-110 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.95)]"
                />
              </div>

              {/* Category Name Centered Beneath Image */}
              <div className="relative z-10 w-full text-center pt-2 sm:pt-3 pb-0.5">
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-white group-hover:text-apex-red transition-colors duration-200 tracking-tight line-clamp-1">
                  {category.name}
                </h3>
              </div>

              {/* Bottom Red Accent Indicator on Hover */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-apex-red scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
            </Link>
          ))}
        </div>
      </div>

      {/* Hide Scrollbars Utility */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
