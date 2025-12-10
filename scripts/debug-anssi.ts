
import { JSDOM } from 'jsdom';
import { fetchText } from './scrapers/utils.js';

const debugAnssi = async () => {
    const url = 'https://cyber.gouv.fr/produits-certifies/sce900u-version-0'; // Sample URL
    console.log(`Fetching ${url}...`);
    try {
        const html = await fetchText(url);
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        console.log('--- Page Debug ---');
        console.log('Title (H1):', doc.querySelector('h1')?.textContent?.trim());
        console.log('Page Title:', doc.title);

        // Check for specific fields often found in Drupal/CMS
        console.log('--- Fields ---');
        const fields = Array.from(doc.querySelectorAll('.field'));
        fields.forEach(f => {
            const label = f.querySelector('.field__label')?.textContent?.trim();
            const value = f.querySelector('.field__item')?.textContent?.trim();
            if (label) console.log(`Field [${label}]: ${value}`);
        });

        // Check body text for Regex testing
        console.log('--- Body Text Start ---');
        console.log(doc.body.textContent?.trim().substring(0, 500));

    } catch (e) {
        console.error(e);
    }
};

debugAnssi();
