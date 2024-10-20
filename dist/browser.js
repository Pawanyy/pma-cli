import puppeteer from 'puppeteer';
export async function launchBrowser() {
    return await puppeteer.launch();
}
export async function createPage(browser, url, html) {
    const page = await browser.newPage();
    if (url) {
        await page.goto(url, { waitUntil: 'networkidle0' });
    }
    else if (html) {
        await page.setContent(html, { waitUntil: 'networkidle0' });
    }
    return page;
}
