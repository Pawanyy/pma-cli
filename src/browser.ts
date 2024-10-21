import puppeteer, { Browser, Page } from 'puppeteer';

export async function launchBrowser(debug: boolean): Promise<Browser> {
  return await puppeteer.launch({ headless: debug ? false : true });
}

export async function createPage(browser: Browser, url?: string, absoluteHtmlPath?: string | null): Promise<Page> {
  const page = await browser.newPage();

  if (url) {
    await page.goto(url, { waitUntil: 'networkidle0' });
  } else if (absoluteHtmlPath) {
    await page.goto(absoluteHtmlPath, { waitUntil: 'networkidle0' });
  }

  return page;
}