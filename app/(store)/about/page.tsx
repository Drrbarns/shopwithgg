'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCMS } from '@/context/CMSContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import AnimatedSection, { AnimatedGrid } from '@/components/AnimatedSection';

type ValueCard = {
  icon: string;
  title: string;
  body: string;
};

type JourneyStep = {
  label: string;
  title: string;
  body: string;
};

export default function AboutPage() {
  usePageTitle('Our Story');
  const { getSetting } = useCMS();

  const siteName = getSetting('site_name') || 'ShopWithGG';

  const valueCards: ValueCard[] = [
    {
      icon: 'ri-eye-line',
      title: 'Transparency first',
      body: "We believe in honest pricing, clear communication, and no hidden costs — so you always know exactly what you're getting.",
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Quality assurance',
      body: 'Every product is carefully sourced and inspected to ensure it meets our standards before it reaches you.',
    },
    {
      icon: 'ri-hand-heart-line',
      title: 'Long-term relationships',
      body: "We don't just fulfil orders — we build trust with every customer, one delivery at a time.",
    },
  ];

  const journeySteps: JourneyStep[] = [
    {
      label: '01',
      title: 'Product selection support',
      body: 'Tell us what you need — we help you identify the right products from our global network of carefully vetted international suppliers.',
    },
    {
      label: '02',
      title: 'Supplier coordination',
      body: "We handle supplier vetting, negotiations, and quality checks so you don't have to worry about the details.",
    },
    {
      label: '03',
      title: 'Logistics & delivery',
      body: 'From supplier to your doorstep — we manage shipping and last-mile delivery with full transparency and real-time tracking.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <section className="border-b border-brand-carton/15 bg-[#EDE6D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <AnimatedSection className="lg:col-span-6" animation="fade-up">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-brown">
                About {siteName}
              </p>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-gray-900">
                Your trusted sourcing and procurement partner.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-gray-700 max-w-xl">
                We leverage a global network of trusted manufacturers and suppliers to bring you premium products at direct-from-supplier pricing — simplifying sourcing so you can shop confidently without stress, uncertainty or inflated costs.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-brown border border-brand-carton/20">
                  <i className="ri-map-pin-line mr-2" /> Based in Lagos, Nigeria
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-brown border border-brand-carton/20">
                  <i className="ri-global-line mr-2" /> Global procurement network
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center rounded-full bg-brand-brown px-7 py-3 text-sm font-semibold text-white hover:bg-brand-gold transition-colors"
                >
                  Browse products
                  <i className="ri-arrow-right-up-line ml-2" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full border border-brand-carton/35 bg-white px-7 py-3 text-sm font-semibold text-brand-brown hover:bg-brand-cream transition-colors"
                >
                  Contact our team
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection className="lg:col-span-6" animation="fade-left">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="relative overflow-hidden rounded-2xl aspect-[4/5] border border-brand-carton/15 bg-brand-carton/10">
                  <Image
                    src="/hero-1.png"
                    alt="ShopWithGG products"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="relative overflow-hidden rounded-2xl aspect-[4/5] border border-brand-carton/15 bg-brand-carton/10 mt-8">
                  <Image
                    src="/hero-2.png"
                    alt="ShopWithGG sourcing"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <AnimatedSection className="py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-carton">
              Our core values
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Built on trust, driven by quality.
            </h2>
          </div>

          <AnimatedGrid className="mt-8 grid gap-4 md:grid-cols-3" staggerDelay={120}>
            {valueCards.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-brand-carton/15 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-carton text-white">
                  <i className={`${item.icon} text-xl`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
              </div>
            ))}
          </AnimatedGrid>
        </div>
      </AnimatedSection>

      <section className="bg-white py-14 sm:py-16 border-b border-brand-carton/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-brand-carton/15 bg-brand-cream/40 p-6 sm:p-8">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-brown text-white">
                <i className="ri-lightbulb-line text-xl" />
              </div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-carton mb-2">Our Vision</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Making quality accessible
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                To make luxury, quality and functionality easily accessible — without breaking the bank.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-carton/15 bg-brand-cream/40 p-6 sm:p-8">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-brown text-white">
                <i className="ri-compass-3-line text-xl" />
              </div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-brown mb-2">Our Mission</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your personalized sourcing partner
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                To become a globally trusted, personalized sourcing and shopping partner — delivering carefully sourced products, expert guidance and dependable logistics; one order at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-cream/45 py-14 sm:py-16 border-y border-brand-carton/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-brand-brown">
              How it works
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
              From sourcing to your doorstep.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {journeySteps.map((step) => (
              <div
                key={step.label}
                className="rounded-2xl border border-brand-carton/15 bg-white p-6"
              >
                <span className="text-xs font-bold tracking-[0.22em] uppercase text-brand-carton">
                  Step {step.label}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#2C1D00] border border-[#1a1200] px-6 py-10 sm:px-10 sm:py-12 text-white text-center">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#F3F3F3]">
              Start sourcing with us
            </p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold">
              Quality and functionality, without breaking the bank.
            </h2>
            <p className="mt-3 text-[#F3F3F3]/80 max-w-2xl mx-auto">
              Whether for personal use, resale, or business growth — discover carefully curated international products delivered to your doorstep.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center rounded-full bg-brand-brown px-7 py-3 text-sm font-semibold text-white hover:bg-brand-gold transition-colors"
              >
                Shop now
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-7 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
