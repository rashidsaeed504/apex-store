import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { InstagramIcon, FacebookIcon, YoutubeIcon, TiktokIcon } from '../ui/SocialIcons';
import Logo from '../ui/Logo';
import { fetchCategories } from '../../services/api';

const accordionContentVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    y: -6,
    transition: {
      height: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.2, ease: 'easeIn' },
      y: { duration: 0.2, ease: 'easeIn' },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    y: 0,
    transition: {
      height: { duration: 0.32, ease: [0.25, 1, 0.5, 1] },
      opacity: { duration: 0.28, ease: 'easeOut', delay: 0.04 },
      y: { duration: 0.28, ease: 'easeOut', delay: 0.04 },
    },
  },
};

export default function Footer() {
  const [openSection, setOpenSection] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    async function loadCategories() {
      const data = await fetchCategories();
      const active = data.filter((c) => c.is_active !== false && c.isActive !== false);
      setCategoriesList(active);
    }
    loadCategories();
  }, []);

  const toggleAccordion = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const dynamicShopLinks = [
    { name: 'All Products', path: '/shop' },
    ...categoriesList.map((cat) => ({
      name: cat.name,
      path: `/category/${cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    })),
    { name: 'Deals & Offers', path: '/deals' },
  ];

  const footerSections = [
    {
      id: 'shop',
      title: 'SHOP',
      links: dynamicShopLinks,
    },
    {
      id: 'help',
      title: 'HELP & SUPPORT',
      links: [
        { name: 'Track Your Order', path: '/orders' },
        { name: 'My Orders Summary', path: '/orders' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'Refund & Return Policy', path: '/refund-policy' },
        { name: 'Privacy Policy', path: '/privacy-policy' },
        { name: 'Terms & Conditions', path: '/terms-and-conditions' },
      ],
    },
    {
      id: 'company',
      title: 'COMPANY',
      links: [
        { name: 'About Apex Store', path: '/about' },
        { name: 'Privacy Policy', path: '/privacy-policy' },
        { name: 'Terms & Conditions', path: '/terms-and-conditions' },
        { name: 'Refund & Return Policy', path: '/refund-policy' },
      ],
    },
  ];

  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-12 md:pt-16 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 text-gray-400">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info Column */}
          <div className="lg:col-span-1 space-y-4">
            <Logo variant="footer" />
            <p className="text-xs leading-relaxed text-gray-400">
              Premium technology and electronics store offering the latest in
              high-performance audio, smartwatches, gaming gear, and mobile
              accessories.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <a
                href="https://www.instagram.com/apexstor.pk?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-apex-red transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-apex-red transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@apexstorepk?_r=1&_t=ZS-98rNnZGljxY"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-apex-red transition-colors"
                aria-label="TikTok"
              >
                <TiktokIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-apex-red transition-colors"
                aria-label="YouTube"
              >
                <YoutubeIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {footerSections.map((sec) => (
            <div key={sec.id}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                {sec.title}
              </h3>
              <ul className="space-y-2.5">
                {sec.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-xs hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile Accordion Navigation */}
        <div className="md:hidden space-y-3 mb-10 border-b border-white/10 pb-8">
          {footerSections.map((sec) => {
            const isOpen = openSection === sec.id;
            return (
              <div key={sec.id} className="border-b border-white/5 pb-3">
                <button
                  onClick={() => toggleAccordion(sec.id)}
                  className="w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-widest text-white text-left cursor-pointer"
                >
                  <span>{sec.title}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className={`inline-flex items-center justify-center ${
                      isOpen ? 'text-apex-red' : 'text-gray-400'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key={`sec-${sec.id}`}
                      variants={accordionContentVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="overflow-hidden"
                    >
                      <ul className="pt-2 pb-1 space-y-2.5 pl-2">
                        {sec.links.map((link) => (
                          <li key={link.name}>
                            <Link
                              to={link.path}
                              className="text-xs text-gray-400 hover:text-white transition-colors block py-0.5"
                            >
                              {link.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Mobile Brand Info & Social Icons */}
        <div className="md:hidden text-center space-y-4 mb-8">
          <div className="flex justify-center">
            <Logo variant="footer" />
          </div>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            Premium technology store offering high-performance wearables, audio,
            and gaming gear.
          </p>
          <div className="flex justify-center items-center space-x-5 pt-2">
            <a
              href="https://www.instagram.com/apexstor.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-apex-red transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-apex-red transition-colors"
              aria-label="Facebook"
            >
              <FacebookIcon className="w-5 h-5" />
            </a>
            <a
              href="https://www.tiktok.com/@apexstorepk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-apex-red transition-colors"
              aria-label="TikTok"
            >
              <TiktokIcon className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-apex-red transition-colors"
              aria-label="YouTube"
            >
              <YoutubeIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Bottom Rights & Payments */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 APEX STORE. All rights reserved.</p>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase">
            <span className="px-2 py-1 bg-white/5 rounded border border-white/5">
              Visa
            </span>
            <span className="px-2 py-1 bg-white/5 rounded border border-white/5">
              Mastercard
            </span>
            <span className="px-2 py-1 bg-white/5 rounded border border-white/5">
              Cash on Delivery
            </span>
            <span className="px-2 py-1 bg-white/5 rounded border border-white/5">
              Easypaisa / JazzCash
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
