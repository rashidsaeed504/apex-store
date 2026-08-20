import { fetchBestSellers, fetchTrendingProducts, fetchNewArrivals } from './src/services/api.js';

async function verifySections() {
  console.log('=== VERIFY HOMEPAGE SECTIONS NON-EMPTY ===');
  const bestSellers = await fetchBestSellers();
  const trending = await fetchTrendingProducts();
  const newArrivals = await fetchNewArrivals();

  console.log('Best Sellers Count:', bestSellers.length, '| Sample:', bestSellers[0]?.name);
  console.log('Trending Count:', trending.length, '| Sample:', trending[0]?.name);
  console.log('New Arrivals Count:', newArrivals.length, '| Sample:', newArrivals[0]?.name);

  if (bestSellers.length > 0 && trending.length > 0 && newArrivals.length > 0) {
    console.log('ALL HOMEPAGE SECTIONS ARE GUARANTEED VISIBLE! PASS');
  } else {
    console.log('FAIL: One or more sections are empty.');
  }
}

verifySections();
