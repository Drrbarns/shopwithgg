'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MiniCart from './MiniCart';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useCMS } from '@/context/CMSContext';
import AnnouncementBar from './AnnouncementBar';

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistCount, setWishlistCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const { cartCount, isCartOpen, setIsCartOpen } = useCart();
  const { getSetting } = useCMS();

const siteName = getSetting('site_name') || 'ShopWithGG';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const updateWishlistCount = () => {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlistCount(wishlist.length);
    };
    updateWishlistCount();
    window.addEventListener('wishlistUpdated', updateWishlistCount);

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wishlistUpdated', updateWishlistCount);
      subscription.unsubscribe();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Categories', href: '/categories' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const active = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-50 pwa-header transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${
          isScrolled
            ? 'bg-[#2C1D00] shadow-lg shadow-[#2C1D00]/10'
            : 'bg-white'
        }`}
      >
        <div className="safe-area-top" />
        <nav aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className={`flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${isScrolled ? 'h-[52px]' : 'h-16 sm:h-[72px]'}`}>

              {/* Left — hamburger + logo */}
              <div className="flex items-center gap-2 min-w-0">
                <button
                  className={`lg:hidden -ml-1 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    isScrolled ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-[#2C1D00]/70 hover:text-[#2C1D00] hover:bg-[#2C1D00]/5'
                  }`}
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <i className="ri-menu-3-line text-[21px]"></i>
                </button>

                <Link href="/" className="flex items-center gap-2" aria-label="Go to homepage">
                  <img
                    src="/shopwithgg-logo.png"
                    alt={siteName}
                    className={`w-auto object-contain transition-all duration-700 ${isScrolled ? 'h-7 brightness-0 invert' : 'h-9 sm:h-10'}`}
                  />
                </Link>
              </div>

              {/* Center — desktop nav */}
              <div className="hidden lg:flex items-center gap-0.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-1.5 text-[13px] font-medium tracking-[0.01em] rounded-full transition-all duration-300 ${
                      active(link.href)
                        ? isScrolled
                          ? 'text-white bg-white/15'
                          : 'text-[#2C1D00] bg-[#2C1D00]/[0.06]'
                        : isScrolled
                          ? 'text-white/60 hover:text-white hover:bg-white/10'
                          : 'text-[#2C1D00]/50 hover:text-[#2C1D00] hover:bg-[#2C1D00]/[0.04]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Right — actions */}
              <div className="flex items-center gap-0.5 sm:gap-1">

                {/* Search */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    isScrolled ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-[#2C1D00]/45 hover:text-[#2C1D00] hover:bg-[#2C1D00]/5'
                  }`}
                  aria-label="Search"
                >
                  <i className="ri-search-2-line text-[20px]"></i>
                </button>

                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  className={`relative w-10 h-10 hidden sm:flex items-center justify-center rounded-full transition-colors ${
                    isScrolled ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-[#2C1D00]/45 hover:text-[#2C1D00] hover:bg-[#2C1D00]/5'
                  }`}
                  aria-label={`Wishlist, ${wishlistCount} items`}
                >
                  <i className="ri-heart-3-line text-[20px]"></i>
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 w-[14px] h-[14px] bg-[#AB9462] text-white text-[8px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <div className="relative">
                  <button
                    className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                      isScrolled ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-[#2C1D00]/45 hover:text-[#2C1D00] hover:bg-[#2C1D00]/5'
                    }`}
                    onClick={() => setIsCartOpen(!isCartOpen)}
                    aria-label={`Shopping cart, ${cartCount} items`}
                    aria-expanded={isCartOpen}
                    aria-controls="mini-cart"
                  >
                    <i className="ri-shopping-bag-3-line text-[20px]"></i>
                    {cartCount > 0 && (
                      <span className={`absolute top-1 right-1 w-[14px] h-[14px] bg-[#AB9462] text-white text-[8px] font-bold rounded-full flex items-center justify-center ring-2 ${isScrolled ? 'ring-[#2C1D00]' : 'ring-white'}`}>
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                </div>

                {/* Account — desktop */}
                <Link
                  href={user ? '/account' : '/auth/login'}
                  className={`hidden lg:flex w-10 h-10 items-center justify-center rounded-full transition-colors ${
                    isScrolled ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-[#2C1D00]/45 hover:text-[#2C1D00] hover:bg-[#2C1D00]/5'
                  }`}
                  aria-label={user ? 'My account' : 'Login'}
                >
                  <i className={`${user ? 'ri-user-smile-line' : 'ri-user-4-line'} text-[20px]`}></i>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Search overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setIsSearchOpen(false)} />
          <div className="relative max-w-2xl mx-auto mt-[15vh] px-5 animate-in fade-in slide-in-from-top-6 duration-300">
            <form onSubmit={handleSearch} className="relative">
              <div className="bg-white rounded-[20px] shadow-2xl overflow-hidden">
                <div className="flex items-center px-5 gap-3">
                  <i className="ri-search-2-line text-[#2C1D00]/25 text-xl shrink-0"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What are you looking for?"
                    className="flex-1 py-5 text-[16px] text-[#2C1D00] bg-transparent outline-none placeholder-[#2C1D00]/25"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="shrink-0 text-[11px] font-semibold text-[#2C1D00]/30 bg-[#2C1D00]/5 px-2.5 py-1 rounded-md hover:bg-[#2C1D00]/10 hover:text-[#2C1D00]/50 transition-colors"
                  >
                    ESC
                  </button>
                </div>
                <div className="border-t border-[#2C1D00]/5 px-5 py-3 flex flex-wrap gap-2">
                  {['New Arrivals', 'Best Sellers', 'Home & Kitchen'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => { setSearchQuery(tag); }}
                      className="text-[11px] font-medium text-[#2C1D00]/40 bg-[#2C1D00]/[0.03] hover:bg-[#AB9462]/10 hover:text-[#AB9462] px-3 py-1.5 rounded-full transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Full-height panel */}
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-[360px] bg-[#FAFAF8] flex flex-col animate-in slide-in-from-left duration-400 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 h-16 shrink-0">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                <img src="/shopwithgg-logo.png" alt={siteName} className="h-8 w-auto object-contain" />
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-[#2C1D00]/30 hover:text-[#2C1D00] rounded-full hover:bg-[#2C1D00]/5 transition-colors"
                aria-label="Close menu"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">

              {/* Main nav */}
              <div className="space-y-1 mb-6">
                {[{ label: 'Home', href: '/', icon: 'ri-home-5-line' }, ...navLinks.map(l => ({
                  ...l,
                  icon: l.href === '/shop' ? 'ri-store-2-line' : l.href === '/categories' ? 'ri-layout-grid-line' : l.href === '/about' ? 'ri-information-line' : 'ri-mail-send-line',
                }))].map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[15px] font-medium transition-all animate-in slide-in-from-left-3 fade-in duration-300 fill-mode-both ${
                      active(link.href)
                        ? 'bg-[#2C1D00] text-white shadow-md shadow-[#2C1D00]/20'
                        : 'text-[#2C1D00]/70 hover:bg-white hover:text-[#2C1D00] hover:shadow-sm'
                    }`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <i className={`${link.icon} text-lg ${active(link.href) ? 'text-[#AB9462]' : 'text-[#2C1D00]/30'}`}></i>
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-[#2C1D00]/[0.06] mx-2 mb-5" />

              {/* Quick actions */}
              <p className="px-4 mb-2.5 text-[10px] font-bold tracking-[0.15em] uppercase text-[#2C1D00]/25">Quick Links</p>
              <div className="space-y-0.5 mb-6">
                {[
                  { label: 'Track Order', href: '/order-tracking', icon: 'ri-truck-line' },
                  { label: 'Wishlist', href: '/wishlist', icon: 'ri-heart-3-line', badge: wishlistCount },
                  { label: user ? 'My Account' : 'Sign In', href: user ? '/account' : '/auth/login', icon: user ? 'ri-user-smile-line' : 'ri-user-4-line' },
                  { label: 'Help Center', href: '/faqs', icon: 'ri-question-line' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] text-[#2C1D00]/50 hover:text-[#2C1D00] hover:bg-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className={`${link.icon} text-[17px] text-[#2C1D00]/25`}></i>
                    <span className="flex-1">{link.label}</span>
                    {'badge' in link && link.badge! > 0 && (
                      <span className="text-[10px] font-bold text-[#AB9462] bg-[#AB9462]/10 w-5 h-5 rounded-full flex items-center justify-center">{link.badge}</span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Install CTA */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('show-pwa-install-guide'));
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#AB9462]/10 to-[#AB9462]/5 text-[14px] font-semibold text-[#AB9462] hover:from-[#AB9462]/15 hover:to-[#AB9462]/10 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#AB9462]/15 flex items-center justify-center">
                  <i className="ri-smartphone-line text-base text-[#AB9462]"></i>
                </div>
                Install the App
              </button>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t border-[#2C1D00]/[0.04] bg-[#FAFAF8]">
              <p className="text-[10px] text-[#2C1D00]/20 font-medium">&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
