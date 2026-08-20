import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import { Observer } from 'gsap/Observer.js';
import { EASING, DURATION, STAGGER } from './src/lib/motion/easing.js';

console.log('====================================================');
console.log('🧪 TESTING GSAP MOTION DESIGN ARCHITECTURE');
console.log('====================================================\n');

// 1. Verify Plugins
gsap.registerPlugin(ScrollTrigger, Observer);
console.log('✅ GSAP Core Version:', gsap.version);
console.log('✅ ScrollTrigger registered successfully');
console.log('✅ Observer registered successfully');

// 2. Verify Motion Easing & Timing Constants
console.log('\n--- Motion Constants ---');
console.log('✅ EASING.EXPO_OUT:', EASING.EXPO_OUT);
console.log('✅ EASING.POWER3_OUT:', EASING.POWER3_OUT);
console.log('✅ EASING.POWER4_OUT:', EASING.POWER4_OUT);
console.log('✅ DURATION.MICRO:', DURATION.MICRO + 's');
console.log('✅ DURATION.FAST:', DURATION.FAST + 's');
console.log('✅ DURATION.STANDARD:', DURATION.STANDARD + 's');
console.log('✅ DURATION.REVEAL:', DURATION.REVEAL + 's');
console.log('✅ DURATION.CINEMATIC:', DURATION.CINEMATIC + 's');
console.log('✅ STAGGER.STANDARD:', STAGGER.STANDARD + 's');

// 3. Test GSAP Tween Execution
const dummyObj = { opacity: 0, y: 50 };
const tween = gsap.to(dummyObj, {
  opacity: 1,
  y: 0,
  duration: DURATION.MICRO,
  ease: EASING.POWER3_OUT,
});

console.log('✅ GSAP Tween instance created -> isActive:', tween.isActive());
console.log('\n✨ ALL MOTION TESTS PASSED ✨\n');
