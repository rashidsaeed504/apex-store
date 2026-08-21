import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('========================================================');
console.log('--- APEX STORE: ABOUT SECTION IMAGE VERIFICATION ---');
console.log('========================================================\n');

// 1. Verify bundled asset exists in dist
const distAssetsDir = path.join(process.cwd(), 'dist', 'assets');
const distFiles = fs.readdirSync(distAssetsDir);
const bundledOurStory = distFiles.find((f) => f.startsWith('our-story') && f.endsWith('.png'));

assert.ok(bundledOurStory, 'bundled our-story asset must exist in dist/assets');
console.log(`✓ PASS: Bundled asset found: ${bundledOurStory}`);

// 2. Verify public storage fallback exists
const publicImagePath = path.join(process.cwd(), 'public', 'site-images', 'about', 'about-apex.png');
assert.ok(fs.existsSync(publicImagePath), 'public/site-images/about/about-apex.png must exist');
console.log('✓ PASS: Public fallback asset exists at /site-images/about/about-apex.png');

// 3. Verify AboutSection chunk references bundled asset
const aboutChunk = distFiles.find((f) => f.startsWith('AboutSection') && f.endsWith('.js'));
assert.ok(aboutChunk, 'AboutSection chunk must exist in dist/assets');
const chunkContent = fs.readFileSync(path.join(distAssetsDir, aboutChunk), 'utf8');
assert.ok(chunkContent.includes('our-story'), 'AboutSection bundle must import bundled our-story asset');
console.log('✓ PASS: AboutSection bundle properly references bundled our-story asset');

console.log('\n========================================================');
console.log('ALL ABOUT SECTION IMAGE TESTS PASSED WITH 100% SUCCESS!');
console.log('========================================================');
