import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = path.resolve(__dirname, '../public/assets');

async function capture() {
    console.log(`Output directory: ${OUTPUT_DIR}`);
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 1440, height: 1080 });

    console.log(`Navigating to ${BASE_URL}...`);
    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 60000 });
        console.log("Page loaded.");
    } catch (e) {
        console.error("Navigation failed or timed out", e);
    }

    // Wait a bit for render
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'debug_initial.png') });
    console.log("Saved debug_initial.png");

    const views = [
        { name: 'Dashboard', file: 'dashboard.png' },
        { name: 'Demand Forecasting', file: 'forecasting.png' },
        { name: 'No-Show Predictor', file: 'noshow.png' },
        { name: 'Pricing Optimizer', file: 'pricing.png' },
        { name: 'RM Assistant', file: 'assistant.png' }
    ];

    for (const view of views) {
        console.log(`Looking for view: ${view.name}`);

        try {
            const buttons = await page.$$('button');
            let found = false;
            for (const button of buttons) {
                const text = await page.evaluate(el => el.innerText || el.textContent, button);
                if (text && text.includes(view.name)) {
                    console.log(`Found button for ${view.name}, clicking...`);
                    await button.click();
                    found = true;

                    // Wait for transition
                    await new Promise(r => setTimeout(r, 2000));

                    const filePath = path.join(OUTPUT_DIR, view.file);
                    await page.screenshot({ path: filePath });
                    console.log(`Saved ${view.file}`);
                    break;
                }
            }

            if (!found) {
                console.error(`Could not find button for ${view.name}`);
            }
        } catch (err) {
            console.error(`Error capturing ${view.name}:`, err);
        }
    }

    await browser.close();
    console.log('Done.');
}

capture();
