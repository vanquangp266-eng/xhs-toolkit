import { generateKeywords } from './src/tools/keyword-miner/services/api.js';

async function test() {
    try {
        const result = await generateKeywords('护肤');
        console.log("Success:", result);
    } catch (e) {
        console.error("Failed:", e);
    }
}

test();
