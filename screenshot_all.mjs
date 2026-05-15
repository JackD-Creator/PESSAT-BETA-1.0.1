import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const outputDir = 'screenshots';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const USER_PROFILE = {
  id: '7c4c7a1a-e4ff-4261-90cf-3b02eabe2aec',
  email: 'okeu@bgsfarm.id',
  full_name: 'Okeu',
  role: 'owner',
  is_active: true,
  created_at: '2026-05-14T00:00:00Z',
};

const PAGES = [
  { route: '/', name: '01-dashboard' },
  { route: '/livestock', name: '02-livestock-list' },
  { route: '/herd-groups', name: '03-herd-groups' },
  { route: '/feed-inventory', name: '04-feed-inventory' },
  { route: '/feed-purchases', name: '05-feed-purchases' },
  { route: '/medicine-inventory', name: '06-medicine-inventory' },
  { route: '/nutrition-requirements', name: '07-nutrition-requirements' },
  { route: '/production', name: '08-production' },
  { route: '/product-sales', name: '09-product-sales' },
  { route: '/animal-transactions', name: '10-animal-transactions' },
  { route: '/health', name: '11-health' },
  { route: '/vaccinations', name: '12-vaccinations' },
  { route: '/breeding', name: '13-breeding' },
  { route: '/finance/transactions', name: '14-finance-transactions' },
  { route: '/finance/reports', name: '15-finance-reports' },
  { route: '/finance/expenses', name: '16-finance-expenses' },
  { route: '/stock-adjustments', name: '17-stock-adjustments' },
  { route: '/tasks', name: '18-tasks' },
  { route: '/alerts', name: '19-alerts' },
  { route: '/profile', name: '20-profile' },
  { route: '/locations', name: '21-locations' },
];

async function main() {
  console.log(`Connecting to ${BASE_URL}...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  try {
    const page = await context.newPage();

    // Set auth via localStorage
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
    await page.evaluate((profile) => {
      localStorage.setItem('livestock_user', JSON.stringify(profile));
    }, USER_PROFILE);
    await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    for (const { route, name } of PAGES) {
      const fullUrl = `${BASE_URL}${route}`;
      process.stdout.write(`${name}: `);

      try {
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 25000 });
        await page.waitForTimeout(2000);

        // Scroll to bottom then back to top for lazy images
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(400);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);

        const filePath = `${outputDir}/${name}.png`;
        await page.screenshot({ path: filePath, fullPage: true });
        const size = (fs.statSync(filePath).size / 1024).toFixed(0);
        
        // Get page title for verification
        const title = await page.title();
        console.log(`✅ ${size}KB (${title})`);
      } catch (err) {
        console.log(`❌ ${err.message.substring(0, 80)}`);
      }
    }

    console.log(`\n✅ Selesai! Screenshot di folder: ${outputDir}/`);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
