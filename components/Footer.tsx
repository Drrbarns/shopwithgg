"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';
import { useRecaptcha } from '@/hooks/useRecaptcha';

function FooterSection({ title, children }: { title: string, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-700 lg:border-none last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left lg:py-0 lg:cursor-default lg:mb-6"
      >
        <h4 className="font-bold text-lg text-white">{title}</h4>
        <i className={`ri-arrow-down-s-line text-gray-400 text-xl transition-transform duration-300 lg:hidden ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0 lg:max-h-full lg:overflow-visible'}`}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const { getSetting } = useCMS();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { getToken } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // reCAPTCHA verification
    const isHuman = await getToken('newsletter');
    if (!isHuman) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Newsletter simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setEmail('');
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawSiteName = getSetting("site_name") || "";
  const siteName =
    rawSiteName && !/deliz/i.test(rawSiteName) ? rawSiteName : "Frebys Fashion GH";
  const siteTagline =
    getSetting("site_tagline") ||
    "Unique kids ready-to-wear Ankara clothes for all occasions.";
  const contactEmail = getSetting('contact_email') || '';
  const contactPhone = getSetting("contact_phone") || "0244720197";
  const whatsappLink = `https://wa.me/233${contactPhone.replace(/^0/, "")}`;

  return (
    <footer className="bg-gray-900 text-white rounded-t-[2.5rem] mt-8 lg:mt-0 overflow-hidden">

      {/* Newsletter Section */}
      <div className="relative overflow-hidden py-12 md:py-16 px-4 border-b border-brand-green/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(248,119,26,0.18),transparent_40%),radial-gradient(circle_at_85%_85%,rgba(42,181,42,0.2),transparent_45%),linear-gradient(130deg,#0c1a11,#102215,#1a2f1a)]" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="w-16 h-16 bg-brand-green/20 border border-brand-green/40 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_12px_30px_rgba(42,181,42,0.25)]">
            <i className="ri-mail-star-line text-3xl text-brand-orange"></i>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-3 font-serif text-white">Join Our Community</h3>
          <p className="text-brand-greenLight mb-6 max-w-md mx-auto leading-relaxed">
            Get first access to new kids Ankara arrivals, styling tips, and special offers.
          </p>
          <div className="mb-8 flex items-center justify-center gap-3 text-xs">
            <span className="inline-flex items-center rounded-full border border-brand-green/45 bg-brand-green/20 px-3 py-1 text-brand-greenLight">
              <i className="ri-sparkling-line mr-1.5 text-brand-orange" />
              New drops
            </span>
            <span className="inline-flex items-center rounded-full border border-brand-orange/45 bg-brand-orange/20 px-3 py-1 text-brand-orangeLight">
              <i className="ri-price-tag-3-line mr-1.5 text-brand-orange" />
              Exclusive offers
            </span>
          </div>

          <form onSubmit={handleSubmit} className="max-w-lg mx-auto relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full pl-6 pr-32 py-4 bg-white/10 border border-brand-green/35 rounded-full text-white placeholder-brand-greenLight/70 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all backdrop-blur-sm"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-brand-orange hover:bg-brand-orangeDark text-white font-bold px-6 rounded-full transition-all disabled:opacity-75 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? '...' : 'Join'}
            </button>
          </form>

          {submitStatus === 'success' && (
            <p className="text-brand-greenLight text-sm mt-4 animate-in fade-in slide-in-from-bottom-2">
              <i className="ri-checkbox-circle-line mr-1 align-middle"></i> You're on the list!
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-4 gap-12">

          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="inline-block">
              <span className="text-xl font-extrabold tracking-[0.2em] text-white">FREBYS</span>
            </Link>
            <p className="text-gray-300/90 leading-relaxed text-sm">
              {siteTagline.replace(/Less\.?$/i, "").trimEnd()}{" "}
              <Link href="/admin" className="text-inherit hover:text-inherit no-underline">Less.</Link>
            </p>

            <div className="flex gap-4 pt-2">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-300 hover:bg-white hover:text-gray-900 transition-all hover:-translate-y-1"
                aria-label="Chat on WhatsApp"
              >
                <i className="ri-whatsapp-line"></i>
              </a>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-700">
              {contactPhone && (
                <div className="flex flex-col gap-2">
                  <a href={`tel:${contactPhone}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors text-sm">
                    <i className="ri-phone-line"></i> {contactPhone}
                  </a>
                </div>
              )}
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors text-sm">
                  <i className="ri-mail-line"></i> {contactEmail}
                </a>
              )}
            </div>
          </div>

          {/* Links Sections (Accordion on Mobile) */}
          <div className="lg:col-span-3 grid lg:grid-cols-3 gap-8 lg:gap-12">

            <FooterSection title="Shop">
              <ul className="space-y-4 text-gray-300/90">
                <li><Link href="/shop" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> All Products</Link></li>
                <li><Link href="/categories" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Categories</Link></li>
                <li><Link href="/shop?sort=newest" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> New Arrivals</Link></li>
                <li><Link href="/shop?sort=bestsellers" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Best Sellers</Link></li>
              </ul>
            </FooterSection>

            <FooterSection title="Customer Care">
              <ul className="space-y-4 text-gray-300/90">
                <li><Link href="/contact" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Contact Us</Link></li>
                <li><Link href="/order-tracking" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Track My Order</Link></li>
                <li><Link href="/shipping" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Shipping Info</Link></li>
                <li><Link href="/returns" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Returns Policy</Link></li>
              </ul>
            </FooterSection>

            <FooterSection title="Company">
              <ul className="space-y-4 text-gray-300/90">
                <li><Link href="/about" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Our Story</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Blog</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors flex items-center gap-2"><i className="ri-arrow-right-s-line opacity-50"></i> Terms of Service</Link></li>
              </ul>
            </FooterSection>

          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <p>
            Powered by{' '}
            <a
              href="https://doctorbarns.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors font-medium"
            >
              Doctor Barns Tech
            </a>
          </p>
          <div className="flex gap-4 grayscale opacity-50">
            <i className="ri-visa-line text-2xl"></i>
            <i className="ri-mastercard-line text-2xl"></i>
            <i className="ri-paypal-line text-2xl"></i>
          </div>
        </div>
      </div>
    </footer>
  );
}
