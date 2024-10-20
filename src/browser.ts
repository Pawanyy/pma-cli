import puppeteer, { Browser, Page } from 'puppeteer';

export async function launchBrowser(): Promise<Browser> {
  return await puppeteer.launch();
}

export async function createPage(browser: Browser, url?: string, html?: string): Promise<Page> {
  const page = await browser.newPage();

  if (url) {
    await page.goto(url, { waitUntil: 'networkidle0' });
  } else if (html) {
    await page.setContent(html, { waitUntil: 'networkidle0' });
  }

  return page;
}