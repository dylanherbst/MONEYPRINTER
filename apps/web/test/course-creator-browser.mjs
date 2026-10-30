import assert from 'node:assert/strict';
// Explicit test runner paths keep Playwright optional for the application's runtime.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({executablePath: process.env.CHROME_EXECUTABLE, headless: true});
try {
 const page = await browser.newPage();
 await page.goto(process.env.QA_BASE_URL || 'http://127.0.0.1:3107/tools/course-creator');
 await page.getByLabel('Course title',{exact:true}).fill('Browser tested course');
 await page.getByLabel('Summary',{exact:true}).fill('Learn practical skills');
 await page.getByRole('button',{name:'Add lesson',exact:true}).click();
 await page.getByLabel('Lesson title',{exact:true}).fill('First lesson');
 await page.getByLabel('Lesson content',{exact:true}).fill('Practice and reflect');
 await page.getByRole('button',{name:'Save course',exact:true}).click();
 assert.match(await page.locator('main main [role=status]').innerText(), /Course saved/);
 await page.reload();
 await page.getByLabel('Lesson content',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('Lesson content',{exact:true}).inputValue(),'Practice and reflect');
 await page.getByRole('button',{name:'Preview course',exact:true}).click();
 await page.getByRole('region',{name:'Learner preview'}).waitFor();
 console.log('PASS real Chrome: author, save, reload persistence and learner preview');
} finally { await browser.close(); }
