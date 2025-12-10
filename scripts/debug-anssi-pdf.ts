import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// polyfill PDFParse
const { PDFParse } = require('pdf-parse');

const PRODUCT_PAGE = 'https://cyber.gouv.fr/produits-certifies/multiapp-52-premium-pqc-gp-se-version-52';
const BASE_URL = 'https://cyber.gouv.fr';

async function debug() {
    console.log(`Fetching Product Page: ${PRODUCT_PAGE}...`);
    const pageRes = await fetch(PRODUCT_PAGE, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const pageHtml = await pageRes.text();

    // List all PDF links
    const linkMatches = [...pageHtml.matchAll(/href="([^"]+\.pdf)"[^>]*>([^<]*)<\/a/g)]; // simplified regex
    // Actually standard regex for href extraction is brittle, let's just find href="...pdf"

    const allPdfLinks = [...pageHtml.matchAll(/href="([^"]+\.pdf)"/g)].map(m => m[1]);
    console.log(`Found ${allPdfLinks.length} PDF links:`);
    allPdfLinks.forEach(l => console.log(' - ' + l));

    // Try to find one that looks like the ST ("cible" or "target" or just the *other* one)
    // The previous logic took the first one found via find(). 
    // Usually Report is first. ST is second?
    // Let's print them and then try to fetch the SECOND one if it exists, or one with "cible" in name?
    // Doing a loop to check headers/content of all PDFs?

    // For specific debug, let's just try to fetch the one that isn't the report if possible.
    // Or just pick the one that has "cible" in the url if present.
    let pdfUrl = allPdfLinks.find(l => l.toLowerCase().includes('cible') || l.toLowerCase().includes('security_target') || l.toLowerCase().includes('st'));

    if (!pdfUrl && allPdfLinks.length > 1) {
        // Fallback: Pick the second one? Or the largest one?
        // Let's just pick the second one for now as a guess, assuming Report is #1.
        pdfUrl = allPdfLinks[1];
        console.log('No specific ST link found, trying second PDF...');
    } else if (!pdfUrl && allPdfLinks.length > 0) {
        pdfUrl = allPdfLinks[0];
        console.log('Only one PDF found (or no ST match), using first one...');
    } else if (!pdfUrl) {
        console.error('No PDF link found on page!');
        console.log('HTML Snippet:', pageHtml.substring(0, 500));
        return;
    }
    if (!pdfUrl.startsWith('http')) pdfUrl = BASE_URL + pdfUrl;

    console.log(`Found PDF URL: ${pdfUrl} `);

    console.log('Fetching PDF...');
    const res = await fetch(pdfUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!res.ok) {
        console.error(`Failed to fetch PDF: ${res.status} `);
        return;
    }
    const buffer = await res.arrayBuffer();
    const parser = new PDFParse({ data: Buffer.from(buffer) });
    const data = await parser.getText();

    console.log('--- PDF TEXT EXTRACTION ---');
    // Search specifically for the area around ML-KEM
    const idx = data.text.indexOf('ML-KEM');
    if (idx !== -1) {
        console.log('FOUND "ML-KEM" at index', idx);
        console.log('Context:', data.text.substring(idx - 100, idx + 100));
    } else {
        console.log('"ML-KEM" NOT FOUND straightforwardly.');
        // Check for split variations
        if (data.text.match(/ML\s*-\s*KEM/i)) console.log('Found "ML - KEM" variation.');
        if (data.text.match(/M\s*L\s*-\s*K\s*E\s*M/i)) console.log('Found spaced variation.');
    }

    console.log('--- RAW TEXT SAMPLE (First 3000 chars) ---');
    console.log(data.text.substring(0, 3000));
    console.log('--- ... ---');

    console.log('--- RAW TEXT SAMPLE (Middle) ---');
    console.log(data.text.substring(10000, 13000));
}

debug();
