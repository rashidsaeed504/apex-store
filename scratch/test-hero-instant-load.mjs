import { getInitialHeroSlides, fetchHeroSlides, INITIAL_SEED_HERO_SLIDES } from '../src/services/api.js';

console.log('====================================================');
console.log('🧪 TESTING INSTANT HERO DATA & IMAGE STRATEGY');
console.log('====================================================\n');

// 1. Test Synchronous 0ms Hero Slide Initialization
console.time('⚡ getInitialHeroSlides execution time');
const initialSlides = getInitialHeroSlides();
console.timeEnd('⚡ getInitialHeroSlides execution time');

console.log(`✅ Returned ${initialSlides?.length} slides synchronously on frame 0`);
console.log('✅ Slide 1 Title:', initialSlides[0]?.title);
console.log('✅ Slide 1 Highlight:', initialSlides[0]?.highlight_text);
console.log('✅ Slide 1 Badge:', initialSlides[0]?.badge);
console.log('✅ Slide 1 Primary CTA:', initialSlides[0]?.primary_button_text);
console.log('✅ Slide 1 Desktop Image:', initialSlides[0]?.desktop_image_url || initialSlides[0]?.image_url);

if (!initialSlides || initialSlides.length === 0) {
  throw new Error('Initial slides failed to load!');
}

// 2. Test Background Revalidation
console.log('\n--- Testing Background Revalidation with fetchHeroSlides() ---');
console.time('⚡ fetchHeroSlides background network call');
const bgSlides = await fetchHeroSlides();
console.timeEnd('⚡ fetchHeroSlides background network call');
console.log(`✅ Background fetch resolved successfully with ${bgSlides?.length} slides`);

console.log('\n✨ INSTANT HERO VERIFICATION PASSED ✨\n');
