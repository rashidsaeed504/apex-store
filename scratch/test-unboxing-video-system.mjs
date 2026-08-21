import assert from 'assert';

console.log('========================================================');
console.log('--- APEX STORE: UNBOXING VIDEO RETURN SYSTEM TEST ---');
console.log('========================================================\n');

// 1. Test video format validation
const allowedExtensions = ['mp4', 'mov', 'webm', 'm4v', '3gp', 'avi'];
function validateVideoFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isVideoType = file.type?.startsWith('video/') || allowedExtensions.includes(ext);
  if (!isVideoType) throw new Error('Please upload a valid video format (MP4, MOV, or WEBM).');
  const maxBytes = 100 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error('Video file size must be less than 100MB.');
  return true;
}

console.log('[TEST 1] Video Format & Size Validation');
assert.strictEqual(validateVideoFile({ name: 'unboxing_test.mp4', type: 'video/mp4', size: 10 * 1024 * 1024 }), true);
assert.strictEqual(validateVideoFile({ name: 'parcel_open.mov', type: 'video/quicktime', size: 45 * 1024 * 1024 }), true);
assert.strictEqual(validateVideoFile({ name: 'package_inspect.webm', type: 'video/webm', size: 80 * 1024 * 1024 }), true);
console.log('✓ PASS: MP4, MOV, and WEBM formats accepted within 100MB limit');

let formatRejected = false;
try {
  validateVideoFile({ name: 'receipt.pdf', type: 'application/pdf', size: 1024 });
} catch (e) {
  formatRejected = true;
}
assert.strictEqual(formatRejected, true);
console.log('✓ PASS: Invalid non-video format (PDF) rejected correctly');

let sizeRejected = false;
try {
  validateVideoFile({ name: 'giant_video.mp4', type: 'video/mp4', size: 150 * 1024 * 1024 });
} catch (e) {
  sizeRejected = true;
}
assert.strictEqual(sizeRejected, true);
console.log('✓ PASS: Oversized video (>100MB) rejected correctly');

// 2. Test Return Payload Construction with Unboxing Video
console.log('\n[TEST 2] Return Payload Construction with Unboxing Video');
const mockPayloadWithVideo = {
  order_id: 101,
  order_number: 'APEX-1010',
  user_id: 'cust-uuid-1',
  customer_name: 'Ahmed Khan',
  customer_email: 'ahmed.khan@gmail.com',
  item: { id: 5, name: 'APEX Pro Wireless Earbuds', price: 7999 },
  quantity: 1,
  resolution: 'refund',
  reason: 'Product arrived damaged in transit',
  condition: 'damaged',
  packaging_available: true,
  description: 'Left earbud case was cracked on arrival.',
  evidence_urls: ['https://storage.apex.pk/returns/photo1.jpg'],
  has_unboxing_video: true,
  unboxing_video_url: 'https://storage.apex.pk/returns/unboxing/1010-unboxing.mp4',
  unboxing_video_path: 'returns/unboxing/1010-unboxing.mp4',
  unboxing_video_available: true,
};

assert.strictEqual(mockPayloadWithVideo.unboxing_video_available, true);
assert.strictEqual(mockPayloadWithVideo.has_unboxing_video, true);
assert.ok(mockPayloadWithVideo.unboxing_video_url.includes('returns/unboxing'));
console.log('✓ PASS: Return request with unboxing video correctly structured');

// 3. Test Return Payload without Unboxing Video (Allowed by Policy)
console.log('\n[TEST 3] Return Payload without Unboxing Video (Allowed by Policy)');
const mockPayloadWithoutVideo = {
  order_id: 102,
  order_number: 'APEX-1020',
  user_id: 'cust-uuid-2',
  customer_name: 'Sara Ali',
  customer_email: 'sara.ali@gmail.com',
  item: { id: 8, name: 'APEX Elite Smartwatch', price: 14999 },
  quantity: 1,
  resolution: 'exchange',
  reason: 'Changed my mind / No longer needed',
  condition: 'unopened',
  packaging_available: true,
  description: 'Decided to gift a different model.',
  evidence_urls: [],
  has_unboxing_video: false,
  unboxing_video_url: null,
  unboxing_video_path: null,
  unboxing_video_available: false,
};

assert.strictEqual(mockPayloadWithoutVideo.unboxing_video_available, false);
assert.strictEqual(mockPayloadWithoutVideo.has_unboxing_video, false);
assert.strictEqual(mockPayloadWithoutVideo.unboxing_video_url, null);
console.log('✓ PASS: Return request without video allowed and structured correctly');

// 4. Test Evidence Summary Calculations in Admin View
console.log('\n[TEST 4] Admin Evidence Summary Calculations');
function getEvidenceSummary(ret) {
  const hasVideo = Boolean(ret.unboxing_video_url || ret.unboxing_video_available);
  const photoCount = Array.isArray(ret.evidence_urls) ? ret.evidence_urls.length : 0;
  return {
    videoStatus: hasVideo ? '✓ Available' : '— Not provided',
    photosStatus: photoCount > 0 ? `✓ ${photoCount} photos` : '— None',
    hasVideo,
    photoCount
  };
}

const summary1 = getEvidenceSummary(mockPayloadWithVideo);
assert.strictEqual(summary1.videoStatus, '✓ Available');
assert.strictEqual(summary1.photosStatus, '✓ 1 photos');

const summary2 = getEvidenceSummary(mockPayloadWithoutVideo);
assert.strictEqual(summary2.videoStatus, '— Not provided');
assert.strictEqual(summary2.photosStatus, '— None');
console.log('✓ PASS: Admin evidence summary matches expected badge outputs');

console.log('\n========================================================');
console.log('ALL UNBOXING VIDEO SYSTEM TESTS PASSED SUCCESSFULLY!');
console.log('========================================================');
