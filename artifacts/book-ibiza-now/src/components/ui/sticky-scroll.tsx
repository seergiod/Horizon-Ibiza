'use client';
import { ReactLenis } from 'lenis/react';
import React, { forwardRef } from 'react';
import { ImageWithFallback } from '@/components/ImagePlaceholder';

interface StickyScrollGalleryProps {
  title?: string;
  images?: {
    left: string[];
    center: string[];
    right: string[];
  };
}

const defaultImages = {
  left: [
    'https://images.unsplash.com/photo-1718838541476-d04e71caa347?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1715432362539-6ab2ab480db2?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1718601980986-0ce75101d52d?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1685904042960-66242a0ac352?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1719411182379-ffd97c1f7ebf?w=500&auto=format&fit=crop',
  ],
  center: [
    'https://images.unsplash.com/photo-1718969604981-de826f44ce15?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1476180814856-a36609db0493?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=500&auto=format&fit=crop',
  ],
  right: [
    'https://images.unsplash.com/photo-1719547907790-f661a88302c2?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1599054799131-4b09c73a63cf?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1719963532023-01b573d1d584?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1714328101501-3594de6cb80f?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1719554873571-0fd6bf322bb1?w=500&auto=format&fit=crop',
  ],
};

const StickyScrollGallery = forwardRef<HTMLElement, StickyScrollGalleryProps>(
  ({ title = "Horizon Ibiza Gallery", images = defaultImages }, ref) => {
    return (
      <ReactLenis root>
        <main className='bg-black' ref={ref}>
          <div className='wrapper'>
            <section className='text-white h-screen w-full bg-slate-950 grid place-content-center sticky top-0'>
              <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]' />
              <h1 className='2xl:text-7xl text-5xl px-8 font-semibold text-center tracking-tight leading-[120%]'>
                {title}
              </h1>
            </section>
          </div>

          <section className='text-white w-full bg-slate-950'>
            <div className='grid grid-cols-12 gap-2'>
              <div className='grid gap-2 col-span-4'>
                {images.left.map((src, i) => (
                  <figure key={i} className='w-full'>
                    <ImageWithFallback
                      src={src}
                      alt={`Gallery image ${i + 1}`}
                      className='transition-all duration-300 w-full h-96 align-bottom object-cover rounded-md'
                      loading="lazy"
                      decoding="async"
                      minHeight="24rem"
                      label="Image Coming Soon"
                    />
                  </figure>
                ))}
              </div>

              <div className='sticky top-0 h-screen w-full col-span-4 gap-2 grid grid-rows-3'>
                {images.center.map((src, i) => (
                  <figure key={i} className='w-full h-full'>
                    <ImageWithFallback
                      src={src}
                      alt={`Gallery center image ${i + 1}`}
                      className='transition-all duration-300 h-full w-full align-bottom object-cover rounded-md'
                      loading="lazy"
                      decoding="async"
                      minHeight="100%"
                      label="Image Coming Soon"
                    />
                  </figure>
                ))}
              </div>

              <div className='grid gap-2 col-span-4'>
                {images.right.map((src, i) => (
                  <figure key={i} className='w-full'>
                    <ImageWithFallback
                      src={src}
                      alt={`Gallery right image ${i + 1}`}
                      className='transition-all duration-300 w-full h-96 align-bottom object-cover rounded-md'
                      loading="lazy"
                      decoding="async"
                      minHeight="24rem"
                      label="Image Coming Soon"
                    />
                  </figure>
                ))}
              </div>
            </div>
          </section>

          <footer className='group bg-slate-950'>
            <h1 className='text-[16vw] translate-y-20 leading-[100%] uppercase font-semibold text-center bg-gradient-to-r from-gray-400 to-gray-800 bg-clip-text text-transparent transition-all ease-linear'>
              Horizon Ibiza
            </h1>
            <div className='bg-black h-40 relative z-10 grid place-content-center text-2xl rounded-tr-full rounded-tl-full' />
          </footer>
        </main>
      </ReactLenis>
    );
  }
);

StickyScrollGallery.displayName = 'StickyScrollGallery';

export default StickyScrollGallery;
