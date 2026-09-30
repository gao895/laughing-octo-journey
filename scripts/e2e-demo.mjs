/**
 * End-to-end check of the beginner flow in demo mode (no Supabase needed):
 *   signup → wizard (name, venue, upload, layout) → preview → click artwork
 *   → edit (adjust, save) → publish → open the public URL → phone viewport.
 *
 * Usage: npm run build && npx next start -p 3100 &  then  BASE_URL=http://localhost:3100 npm run test:e2e
 * Screenshots are written to ./screenshots.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const executablePath =
  process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({
  executablePath,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const errors = [];
function watch(page, label) {
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|Download the React DevTools/.test(m.text())) {
      errors.push(`[${label}] console: ${m.text().slice(0, 300)}`);
    }
  });
}

function step(msg) {
  console.log(`✓ ${msg}`);
}

/** Makes simple PNG "artworks" by screenshotting gradients. */
async function makeImages(context) {
  const page = await context.newPage();
  const colors = [
    ['#ff9a8b', '#ff6a88'],
    ['#8ec5fc', '#e0c3fc'],
    ['#f6d365', '#fda085'],
    ['#84fab0', '#8fd3f4'],
  ];
  const files = [];
  for (const [i, [a, b]] of colors.entries()) {
    const portrait = i === 1;
    await page.setViewportSize(
      portrait ? { width: 600, height: 800 } : { width: 900, height: 600 },
    );
    await page.setContent(
      `<body style="margin:0;height:100vh;background:linear-gradient(135deg,${a},${b});display:flex;align-items:center;justify-content:center;font:bold 120px sans-serif;color:#fff">${i + 1}</body>`,
    );
    files.push({
      name: `summer_${i + 1}.png`,
      mimeType: 'image/png',
      buffer: await page.screenshot(),
    });
  }
  await page.close();
  return files;
}

async function waitForScene(page) {
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForFunction(
    () => !document.body.innerText.includes('作品を読み込んでいます'),
    null,
    {
      timeout: 60000,
    },
  );
  await page.waitForTimeout(1500);
}

try {
  // ------------------------------------------------------------------ desktop
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'ja-JP',
  });
  const page = await context.newPage();
  watch(page, 'desktop');

  await page.goto(BASE);
  await page.getByRole('heading', { name: 'あなたの作品を、あなたのギャラリーへ。' }).waitFor();
  await page.screenshot({ path: `${OUT}/01-home.png` });
  step('top page');

  await page.getByRole('link', { name: '個展を作る' }).first().click();
  await page.waitForURL(/\/login\?next=/, { waitUntil: 'commit' });
  step('signed-out user is redirected to login');

  await page.getByRole('link', { name: 'はじめての方はこちら' }).click();
  await page.getByLabel('表示名（作者名）').fill('moco');
  await page.getByLabel('メールアドレス').fill('artist@example.com');
  await page.getByLabel('パスワード').fill('password123');
  await page.screenshot({ path: `${OUT}/02-signup.png` });
  await page.getByRole('button', { name: 'アカウントを作る' }).click();
  await page.waitForURL(/\/dashboard\/new/, { waitUntil: 'commit' });
  step('signup → wizard');

  // STEP 1
  await page.getByRole('button', { name: '次へ' }).click();
  await page.getByText('名前を入力してください。').waitFor();
  await page.getByLabel('個展の名前').fill('夏の思い出');
  await page.getByRole('button', { name: '次へ' }).click();
  // STEP 2
  await page.getByRole('radio', { name: /星空ギャラリー/ }).click();
  await page.screenshot({ path: `${OUT}/03-wizard-venue.png` });
  await page.getByRole('button', { name: '次へ' }).click();
  // STEP 3
  const input = page.getByTestId('artwork-file-input');
  await input.setInputFiles({
    name: 'bad.gif',
    mimeType: 'image/gif',
    buffer: Buffer.from('GIF89a'),
  });
  await page.getByText('JPG、PNG、WEBP画像、またはMP4・MOV動画を選択してください。').first().waitFor();
  step('invalid file type rejected with friendly message');
  await input.setInputFiles(await makeImages(context));
  await page.getByLabel('作品タイトル').nth(3).waitFor({ timeout: 30000 });
  await page.getByLabel('作品タイトル').first().fill('夕焼けの海');
  await page.getByLabel('作品説明').first().fill('夏休みに見た、忘れられない夕焼け。');
  await page.screenshot({ path: `${OUT}/04-wizard-upload.png`, fullPage: true });
  step('4 images uploaded and titled');
  await page.getByRole('button', { name: '次へ' }).click();
  // STEP 4
  await page.getByRole('radio', { name: /おまかせ/ }).click();
  await page.getByRole('button', { name: '個展を作る' }).click();
  await page.getByRole('heading', { name: '完成！' }).waitFor({ timeout: 60000 });
  await page.screenshot({ path: `${OUT}/05-wizard-done.png` });
  step('wizard complete');

  // Preview
  await page.getByRole('link', { name: 'ギャラリーを見る' }).click();
  await page.waitForURL(/\/preview$/, { waitUntil: 'commit' });
  await waitForScene(page);
  await page.screenshot({ path: `${OUT}/06-preview.png` });
  step('3D preview rendered');

  // Walk forward (W) and turn left (←) to face artwork #1, then click it.
  const moveUntil = async (key, ms) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
  };
  await page.mouse.click(640, 700); // focus the canvas without hitting an artwork
  await moveUntil('KeyW', 900);
  await page.screenshot({ path: `${OUT}/07-walked.png` });
  let opened = false;
  for (let attempt = 0; attempt < 12 && !opened; attempt++) {
    await moveUntil('ArrowLeft', 120);
    await page.mouse.click(640, 400);
    opened = await page
      .getByRole('dialog')
      .waitFor({ timeout: 800 })
      .then(() => true)
      .catch(() => false);
  }
  if (!opened) throw new Error('could not open an artwork by clicking in 3D');
  await page.screenshot({ path: `${OUT}/08-artwork-modal.png` });
  const dialogText = await page.getByRole('dialog').innerText();
  if (!dialogText.includes('moco')) throw new Error('author name missing from modal');
  step(`artwork modal opened by clicking in 3D (${dialogText.split('\n')[0]})`);
  await page.getByRole('dialog').getByRole('button', { name: '閉じる' }).last().click();

  // Edit
  await page.getByRole('link', { name: 'プレビューを終わる' }).click();
  await page.waitForURL(/\/edit$/, { waitUntil: 'commit' });
  await page.waitForSelector('canvas');
  await page
    .getByRole('button', { name: /位置を調整/ })
    .first()
    .click();
  await page.getByRole('button', { name: /大きくする/ }).click();
  await page.getByRole('button', { name: /少し上へ/ }).click();
  await page.getByText('未保存の変更があります').waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/09-editor.png` });
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.getByText('保存しました').first().waitFor();
  step('artwork adjusted with beginner buttons and saved');

  // Change venue (with confirmation)
  await page.getByRole('button', { name: '会場', exact: true }).click();
  await page.getByRole('radio', { name: /和風ギャラリー/ }).click();
  await page.getByText('作品の配置を自動調整します。').waitFor();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/10-editor-japanese.png` });
  step('venue changed after confirmation');

  // Publish
  await page.getByRole('button', { name: '公開設定' }).click();
  await page.getByRole('button', { name: '公開する' }).last().click();
  const shareUrl = await page.getByTestId('share-url').inputValue();
  await page.screenshot({ path: `${OUT}/11-published.png` });
  step(`published: ${shareUrl}`);

  // Dashboard shows the card
  await page.goto(`${BASE}/dashboard`);
  await page.getByText('「夏の思い出」').waitFor();
  await page.getByText('公開中').first().waitFor();
  await page.screenshot({ path: `${OUT}/12-dashboard.png` });
  step('dashboard card shows 公開中');

  // Visitor opens the public URL
  const visitor = await context.newPage();
  watch(visitor, 'visitor');
  await visitor.goto(shareUrl);
  await waitForScene(visitor);
  await visitor.getByText('夏の思い出').first().waitFor();
  await visitor.screenshot({ path: `${OUT}/13-public.png` });
  step('public URL opens the 3D gallery');

  await visitor.goto(`${BASE}/gallery/does-not-exist`);
  await visitor.getByText('この個展は見つかりませんでした。').waitFor();
  step('unknown slug shows a friendly message');
  await context.close();

  // ------------------------------------------------------------------ phone
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'ja-JP',
  });
  const mobile = await phone.newPage();
  watch(mobile, 'phone');
  await mobile.goto(BASE);
  await mobile.screenshot({ path: `${OUT}/20-phone-home.png` });
  await mobile.goto(`${BASE}/explore`);
  await mobile.getByText('星空の記憶').first().waitFor();
  await mobile.screenshot({ path: `${OUT}/21-phone-explore.png` });
  await mobile.getByText('星空の記憶').first().click();
  await waitForScene(mobile);
  await mobile.screenshot({ path: `${OUT}/22-phone-gallery.png` });
  const hasStick = await mobile.locator('.touch-none.rounded-full').count();
  if (!hasStick) throw new Error('virtual joystick missing on phone');
  step('phone: sample gallery with virtual stick');
  await mobile.getByRole('button', { name: /次の作品/ }).tap();
  await mobile.waitForTimeout(2500);
  await mobile.screenshot({ path: `${OUT}/22b-phone-tour.png` });
  await mobile.touchscreen.tap(195, 420);
  await mobile.getByRole('dialog').waitFor({ timeout: 5000 });
  await mobile.screenshot({ path: `${OUT}/22c-phone-artwork.png` });
  step(
    `phone: 次の作品 tour + tap artwork (${(await mobile.getByRole('dialog').innerText()).split('\n')[1]})`,
  );
  await mobile.getByRole('dialog').getByRole('button', { name: '閉じる' }).last().tap();

  await mobile.goto(`${BASE}/login`);
  await mobile.getByLabel('メールアドレス').fill('phone@example.com');
  await mobile.getByLabel('パスワード').fill('password123');
  await mobile.getByRole('button', { name: 'ログインする' }).click();
  await mobile.waitForURL(/\/dashboard$/, { waitUntil: 'commit' });
  await mobile.getByText('個展を作るのはとても簡単です。').waitFor();
  await mobile.screenshot({ path: `${OUT}/23-phone-onboarding.png` });
  await mobile.getByRole('button', { name: 'はじめる' }).click();
  await mobile.waitForURL(/\/dashboard\/new/, { waitUntil: 'commit' });
  await mobile.screenshot({ path: `${OUT}/24-phone-wizard.png` });
  step('phone: login → onboarding → wizard');

  const overflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflow) throw new Error('horizontal overflow on phone');
  await phone.close();
} finally {
  await browser.close();
}

if (errors.length) {
  console.log('\nBrowser errors:');
  for (const e of errors) console.log('  ' + e);
  process.exitCode = 1;
} else {
  console.log('\nNo browser errors.');
}
