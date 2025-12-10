
import { JSDOM } from 'jsdom';

const fetchText = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
};

const main = async () => {
    try {
        console.log('Testing ACVP pagination parameters...');
        const algoParams = [173, 174, 175, 176, 177, 178, 179, 180].map(id => `algorithm=${id}`).join('&');

        // Test different pagination approaches
        const tests = [
            { name: 'Page 1 (pg=1)', url: `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&${algoParams}&ipp=500&pg=1` },
            { name: 'Page 2 (pg=2)', url: `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&${algoParams}&ipp=500&pg=2` },
            { name: 'Offset 500 (offset=500)', url: `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&${algoParams}&ipp=500&offset=500` },
            { name: 'No pagination', url: `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&${algoParams}&ipp=5000` },
        ];

        for (const test of tests) {
            console.log(`\n=== ${test.name} ===`);
            const html = await fetchText(test.url);
            const dom = new JSDOM(html);
            const doc = dom.window.document;

            const allRows = Array.from(doc.querySelectorAll('tr'));
            const candidateRows = allRows.filter(row => {
                const cells = row.querySelectorAll('td');
                return cells.length >= 4;
            });

            console.log(`Found ${candidateRows.length} data rows`);

            if (candidateRows.length > 0) {
                const firstVendor = candidateRows[0].querySelectorAll('td')[0]?.textContent?.trim();
                const lastVendor = candidateRows[candidateRows.length - 1].querySelectorAll('td')[0]?.textContent?.trim();
                console.log(`First vendor: ${firstVendor}`);
                console.log(`Last vendor: ${lastVendor}`);
            }
        }

    } catch (e) {
        console.error(e);
    }
};

main();
