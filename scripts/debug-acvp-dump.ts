
import { JSDOM } from 'jsdom';

const fetchText = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
};

const main = async () => {
    try {
        console.log('Fetching ACVP Search Page for Dump...');
        const algoParams = [173, 174, 175, 176, 177, 178, 179, 180].map(id => `algorithm=${id}`).join('&');
        const url = `https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/validation-search?searchMode=implementation&productType=-1&${algoParams}&ipp=10`;

        const html = await fetchText(url);
        // Dump first 2000 chars of body or specific areas to identify structure
        console.log(html.substring(0, 5000));

    } catch (e) {
        console.error(e);
    }
};

main();
