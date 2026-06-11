'use client';
import { ReactLenis } from 'lenis/react';
import React, { forwardRef } from 'react';
import { ImageWithFallback } from '@/components/ImagePlaceholder';

interface StickyScrollGalleryProps {
  images?: {
    left: string[];
    center: string[];
    right: string[];
  };
}

const horizonImages = {
  left: [
    '/food-paella.jpg',
    '/food-acai.jpg',
    '/food-octopus.jpg',
    '/food-noodles.jpg',
    '/pool-cocktail.jpg',
  ],
  center: [
    '/food-pasta.jpg',
    '/food-salad.jpg',
    '/food-yogurt.jpg',
  ],
  right: [
    '/food-octopus.jpg',
    '/food-yogurt.jpg',
    '/food-noodles.jpg',
    '/food-acai.jpg',
    '/food-salad.jpg',
  ],
};

const StickyScrollGallery = forwardRef<HTMLElement, StickyScrollGalleryProps>(
  ({ images = horizonImages }, ref) => {
    return (
      <ReactLenis root>
        <main ref={ref} style={{ background: "#0a1628" }}>
          <section className='text-white w-full' style={{ background: "#0a1628" }}>
            <div className='grid grid-cols-12 gap-1.5 p-1.5'>
              <div className='grid gap-1.5 col-span-4'>
                {images.left.map((src, i) => (
                  <figure key={i} className='w-full overflow-hidden rounded-lg'>
                    <ImageWithFallback
                      src={src}
                      alt={`Horizon Ibiza dish ${i + 1}`}
                      className='transition-all duration-500 w-full h-72 sm:h-96 align-bottom object-cover hover:scale-105'
                      loading="lazy"
                      decoding="async"
                      minHeight="18rem"
                      label="Loading…"
                    />
                  </figure>
                ))}
              </div>

              <div className='sticky top-0 h-screen w-full col-span-4 gap-1.5 grid grid-rows-3'>
                {images.center.map((src, i) => (
                  <figure key={i} className='w-full h-full overflow-hidden rounded-lg'>
                    <ImageWithFallback
                      src={src}
                      alt={`Horizon Ibiza featured dish ${i + 1}`}
                      className='transition-all duration-500 h-full w-full align-bottom object-cover hover:scale-105'
                      loading="lazy"
                      decoding="async"
                      minHeight="100%"
                      label="Loading…"
                    />
                  </figure>
                ))}
              </div>

              <div className='grid gap-1.5 col-span-4'>
                {images.right.map((src, i) => (
                  <figure key={i} className='w-full overflow-hidden rounded-lg'>
                    <ImageWithFallback
                      src={src}
                      alt={`Horizon Ibiza dish ${i + 1}`}
                      className='transition-all duration-500 w-full h-72 sm:h-96 align-bottom object-cover hover:scale-105'
                      loading="lazy"
                      decoding="async"
                      minHeight="18rem"
                      label="Loading…"
                    />
                  </figure>
                ))}
              </div>
            </div>
          </section>

          <footer className='group' style={{ background: "#0a1628" }}>
            <h2 className='text-[12vw] translate-y-16 leading-none uppercase font-semibold text-center bg-gradient-to-r from-blue-400/60 to-blue-800/40 bg-clip-text text-transparent py-4'>
              Horizon Ibiza
            </h2>
            <div className='h-32 relative z-10 rounded-tr-3xl rounded-tl-3xl' style={{ background: "oklch(1 0 0)" }} />
          </footer>
        </main>
      </ReactLenis>
    );
  }
);

StickyScrollGallery.displayName = 'StickyScrollGallery';

export default StickyScrollGallery;
