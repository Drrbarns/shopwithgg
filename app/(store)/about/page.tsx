'use client';

import Link from 'next/link';
import { useCMS } from '@/context/CMSContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import AnimatedSection, { AnimatedGrid } from '@/components/AnimatedSection';
import PageHero from '@/components/PageHero';

export default function AboutPage() {
  usePageTitle("Our Story");
  const { getSetting } = useCMS();
  const siteName = getSetting("site_name") || "Frebys Fashion GH";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 overflow-hidden selection:bg-amber-200 selection:text-black pb-0 font-sans">

      <PageHero
        title="Where Culture, Color and Childhood Style Meet"
        subtitle="Discover the story behind Frebys Fashion GH and our passion for standout kids Ankara wear."
      />



      {/* 
        ==================================================
        3. ASYMMETRICAL EDITORIAL STORY
        ==================================================
      */}
      <div className="py-32 lg:py-48 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto bg-[#FDFBF7]">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 relative">

          <div className="lg:col-span-5 lg:col-start-2 order-2 lg:order-1 relative">
            <AnimatedSection animation="fade-right">
              <div className="aspect-[4/5] overflow-hidden rounded-t-full shadow-2xl relative isolate bg-gray-100">
                <img src="/hero1.png" alt="Founder" className="w-full h-full object-cover filter contrast-125" />
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/60 to-transparent z-10"></div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-center w-full">
                  <span className="bg-white/90 backdrop-blur-md text-gray-900 text-xs font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-full shadow-lg">Frebys Family</span>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={200} className="absolute -bottom-20 -right-10 w-48 h-48 bg-gray-900 rounded-full flex items-center justify-center p-8 text-center text-white hidden md:flex shadow-2xl z-20">
              <p className="text-sm font-medium tracking-wide">"Unique kids wear for all occasions."</p>
            </AnimatedSection>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center order-1 lg:order-2 z-10">
            <AnimatedSection animation="fade-up" delay={100}>
              <h2 className="text-xs font-bold tracking-[0.3em] text-amber-600 mb-8 uppercase flex items-center gap-4">
                <span className="w-12 h-px bg-amber-600"></span> The Genesis
              </h2>
              <div className="text-[2.5rem] lg:text-[4rem] leading-[1.1] font-black text-gray-900 mb-12 tracking-tight">
                Dressing children with <span className="italic font-serif font-normal text-amber-600">confidence</span>, comfort and heritage.
              </div>
            </AnimatedSection>

            <AnimatedGrid className="space-y-8 text-xl lg:text-2xl font-light text-gray-600 leading-relaxed" staggerDelay={150}>
              <p>
                {siteName} was built around one purpose: to create standout kids ready-to-wear Ankara outfits that feel special yet practical for real family life.
              </p>
              <p>
                From playful casual sets to premium luxury looks, every piece is designed with quality fabric, comfortable fits, and bold African-inspired style that kids love to wear.
              </p>
              <p>
                Based in Haatso, Accra, Ghana, we proudly serve families at home and abroad with worldwide delivery, responsive support, and a genuine passion for kids fashion.
              </p>
              <div className="pt-8 flex items-center gap-6">
                <Link href="/shop" className="group flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-gray-900 hover:text-amber-600 transition-colors">
                  <span className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-amber-600 transition-colors">
                    <i className="ri-arrow-right-up-line text-xl group-hover:rotate-45 transition-transform"></i>
                  </span>
                  Explore Kids Collection
                </Link>
              </div>
            </AnimatedGrid>
          </div>
        </div>
      </div>





    </div>
  );
}

