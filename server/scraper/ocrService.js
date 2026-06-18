import { createWorker } from 'tesseract.js';
import fetch from 'node-fetch'; // Use global fetch in Node 18+

let worker = null;

export async function initOcrWorker() {
    if (worker) return worker;
    console.log('[OCR] 正在初始化本地 OCR 引擎 (加载中文语言包)...');
    try {
        worker = await createWorker('chi_sim+eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text' && m.progress % 0.2 < 0.01) {
                    // console.log(`[OCR 进度] ${(m.progress * 100).toFixed(0)}%`);
                }
            }
        });
        console.log('[OCR] 引擎初始化完成！');
        return worker;
    } catch (e) {
        console.error('[OCR] 引擎初始化失败:', e);
        throw e;
    }
}

export async function recognizeImagesText(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return '';
    
    try {
        const w = await initOcrWorker();
        let fullText = '';
        
        for (let i = 0; i < imageUrls.length; i++) {
            const url = imageUrls[i];
            console.log(`[OCR] 正在提取第 ${i + 1}/${imageUrls.length} 张图片的文字...`);
            try {
                // Fetch image buffer to avoid canvas/CORS issues in tesseract.js
                const resp = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://www.xiaohongshu.com/'
                    }
                });
                const buffer = await resp.arrayBuffer();
                
                const { data: { text } } = await w.recognize(Buffer.from(buffer));
                if (text && text.trim()) {
                    fullText += `\n\n--- 图片 ${i + 1} 文字 ---\n` + text.trim();
                }
            } catch (err) {
                console.error(`[OCR] 第 ${i + 1} 张图片提取失败:`, err.message);
            }
        }
        
        return fullText;
    } catch (e) {
        console.error('[OCR] 整体识别过程出错:', e);
        return '';
    }
}
