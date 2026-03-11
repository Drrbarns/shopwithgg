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

  const siteName = getSetting('site_name') || 'Deliz Beauty Tools';
  const siteTagline = getSetting('site_tagline') || 'Premium Quality Products For Less.';
  const contactEmail = getSetting('contact_email') || '';
  const contactPhone = getSetting('contact_phone') || '0278549831';
  const socialFacebook = getSetting('social_facebook') || '';
  const socialInstagram = getSetting('social_instagram') || '';
  const socialTwitter = getSetting('social_twitter') || '';

  return (
    <footer className="bg-gray-900 text-white rounded-t-[2.5rem] mt-8 lg:mt-0 overflow-hidden">

      {/* Newsletter Section */}
      <div className="bg-black/30 py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <i className="ri-mail-star-line text-3xl text-gray-300"></i>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-3 font-serif">Join Our Community</h3>
          <p className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
            Get exclusive access to new arrivals, beauty tips, and special offers.
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full pl-6 pr-32 py-4 bg-white/10 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all backdrop-blur-sm"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-white hover:bg-gray-200 text-gray-900 font-bold px-6 rounded-full transition-all disabled:opacity-75 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? '...' : 'Join'}
            </button>
          </form>

          {submitStatus === 'success' && (
            <p className="text-gray-300 text-sm mt-4 animate-in fade-in slide-in-from-bottom-2">
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
              {/* Using the logo directly can be nice, or text if needed. Assuming white version exists or adjusting brightness. */}
              <img src="/logo1.png" alt={siteName} className="h-8 w-auto object-contain brightness-0 invert opacity-90" />
            </Link>
            <p className="text-gray-300/90 leading-relaxed text-sm">
              {siteTagline.replace(/Less\.?$/i, '').trimEnd()}{' '}
              <Link href="/admin" className="text-inherit hover:text-inherit no-underline">Less.</Link>
            </p>

            <div className="flex gap-4 pt-2">
              {[
                { link: socialInstagram, icon: 'ri-instagram-line' },
                { link: socialFacebook, icon: 'ri-facebook-fill' },
                { link: socialTwitter, icon: 'ri-twitter-x-fill' }
              ].map((social, i) => social.link && (
                <a
                  key={i}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-300 hover:bg-white hover:text-gray-900 transition-all hover:-translate-y-1"
                >
                  <i className={social.icon}></i>
                </a>
              ))}
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
