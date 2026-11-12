import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const outDir = process.env.RECORD_OUT || '/tmp/context-switcher-recordings-pr626';
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const field = (page, label) => page.locator(`[role="combobox"][aria-label^="${label}:"]`);

const stories = [
  {
    id: 'app-elements-context-switcher--in-header',
    file: 'in-header',
    title: 'In Header',
    run: async (page) => {
      await field(page, 'Organization').click();
      await page.waitForTimeout(400);
      await page.getByRole('option', { name: 'Demo Organization' }).click();
      await page.waitForTimeout(600);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      await field(page, 'Organization').click();
      await page.getByRole('option', { name: 'WSO2' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('option', { name: 'Finance Web' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('option', { name: 'MIS ARR Backend' }).click();
      await page.waitForTimeout(800);
    },
  },
  {
    id: 'app-elements-context-switcher--selected',
    file: 'selected',
    title: 'Selected',
    run: async (page) => {
      await field(page, 'Project').click();
      await page.waitForTimeout(400);
      await page.getByRole('option', { name: 'Finance Web' }).click();
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      await field(page, 'Organization').click();
      await page.waitForTimeout(600);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    },
  },
  {
    id: 'app-elements-context-switcher--with-back',
    file: 'with-back',
    title: 'With Back',
    run: async (page) => {
      await page.getByRole('button', { name: 'Go to the Project level' }).click();
      await page.waitForTimeout(700);
      await page.getByRole('button', { name: 'Go to the Organization level' }).click();
      await page.waitForTimeout(700);
      await field(page, 'Organization').click();
      await page.getByRole('option', { name: 'Demo Organization' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('option', { name: 'Sales' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('option', { name: 'Salesforce Sync' }).click();
      await page.waitForTimeout(800);
    },
  },
  {
    id: 'app-elements-context-switcher--with-back-at-first-level',
    file: 'with-back-at-first-level',
    title: 'With Back at first level',
    run: async (page) => {
      await field(page, 'Organization').click();
      await page.getByRole('option', { name: 'WSO2' }).click();
      await page.waitForTimeout(600);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await field(page, 'Organization').click();
      await page.getByRole('option', { name: 'Demo Organization' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('option', { name: 'Finance Web' }).click();
      await page.waitForTimeout(600);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Go to the Organization level' }).click();
      await page.waitForTimeout(800);
    },
  },
  {
    id: 'app-elements-context-switcher--open-panel',
    file: 'open-panel',
    title: 'Open Panel',
    run: async (page) => {
      await page.getByRole('listbox', { name: 'Organization' }).waitFor({ timeout: 15000 });
      await page.waitForTimeout(1600);
    },
  },
  {
    id: 'app-elements-context-switcher--no-options',
    file: 'no-options',
    title: 'No Options',
    run: async (page) => {
      await page.getByRole('option', { name: 'No options' }).waitFor({ timeout: 15000 });
      await page.waitForTimeout(1600);
    },
  },
  {
    id: 'app-elements-context-switcher--loading',
    file: 'loading',
    title: 'Loading',
    run: async (page) => {
      await field(page, 'Project').waitFor({ state: 'attached', timeout: 15000 });
      await page.getByRole('progressbar', { name: 'Loading Project' }).waitFor({ timeout: 15000 });
      await page.waitForTimeout(1800);
    },
  },
];

const themes = [
  { key: 'classic', label: 'Classic' },
  { key: 'wso2', label: 'WSO2' },
  { key: 'highContrast', label: 'High Contrast' },
  { key: 'acrylicOrange', label: 'Acrylic Orange' },
  { key: 'acrylicPurple', label: 'Acrylic Purple' },
  { key: 'paleGray', label: 'Pale Gray' },
  { key: 'paleIndigo', label: 'Pale Indigo' },
];

const failures = [];
let browser = await chromium.launch({ headless: true });

for (const theme of themes) {
  const themeDir = path.join(outDir, theme.key);
  fs.mkdirSync(themeDir, { recursive: true });
  for (const story of stories) {
    if (!browser.isConnected()) {
      browser = await chromium.launch({ headless: true });
    }
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'light',
      recordVideo: { dir: themeDir, size: { width: 1280, height: 800 } },
    });
    const page = await context.newPage();
    const url =
      `http://127.0.0.1:6006/iframe.html?id=${story.id}&viewMode=story` +
      `&globals=theme:${theme.key};colorScheme:light`;
    console.log(`Recording ${theme.label} / ${story.title}…`);
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await page.locator('[role="combobox"]').first().waitFor({ state: 'attached', timeout: 20000 });
      await page.waitForTimeout(500);
      if (theme.key === 'classic' && (story.file === 'with-back' || story.file === 'loading')) {
        await page.screenshot({ path: path.join(outDir, `${story.file}-still.png`) });
      }
      await story.run(page);
    } catch (err) {
      console.error(`FAILED ${theme.label} / ${story.title}: ${err.message}`);
      failures.push(`${theme.key}/${story.file}: ${err.message}`);
      await page.screenshot({ path: path.join(themeDir, `${story.file}-error.png`) }).catch(() => {});
    }
    const video = page.video();
    await context.close();
    const rawPath = await video.path();
    const dest = path.join(themeDir, `${story.file}.webm`);
    if (!fs.existsSync(rawPath)) {
      failures.push(`${theme.key}/${story.file}: video file missing`);
      console.error(`FAILED ${theme.label} / ${story.title}: video file missing`);
      continue;
    }
    fs.renameSync(rawPath, dest);
    const size = fs.statSync(dest).size;
    console.log(`Wrote ${dest} (${size} bytes)`);
    if (size < 1000) {
      failures.push(`${theme.key}/${story.file}: empty video`);
    }
  }
}

await browser.close();
if (failures.length > 0) {
  console.error(`\n${failures.length} recording(s) failed:`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}
console.log('Done');
