import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { recognizeImagesText } from './ocrService.js';
import path from 'path';
import fs from 'fs';

chromium.use(stealthPlugin());

// 随机延迟函数，模拟真人操作
const sleep = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

// 解析点赞数为数字，例如 "1.2万" -> 12000, "800" -> 800
function parseLikeCount(str) {
    if (!str) return 0;
    let num = 0;
    if (str.includes('万') || str.includes('w')) {
        num = parseFloat(str) * 10000;
    } else {
        num = parseInt(str, 10);
    }
    return isNaN(num) ? 0 : num;
}

export async function scrapeAuthorNotes(authorUrl, topCount = 10) {
    // 数据持久化目录，用于保存登录状态
    const userDataDir = path.join(process.cwd(), 'server', 'scraper', 'xhs_browser_data');
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }

    // 启动浏览器，开启界面以便扫码或处理验证码
    console.log('正在启动浏览器...');
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false, // 必须开启界面，防封且可以人工介入
        viewport: { width: 1280, height: 800 },
        args: ['--disable-blink-features=AutomationControlled'] // 降低被检测为爬虫的概率
    });

    const page = await context.newPage();
    
    // 我们使用了 stealth 插件，不再需要手动篡改 webdriver
    // stealth 会处理非常多的指纹伪装，比如 webgl, user-agent, plugins 等
    console.log(`正在访问作者主页: ${authorUrl}`);
    await page.goto(authorUrl, { waitUntil: 'domcontentloaded' });
    
    // 随机停留，等待页面渲染和可能的登录弹窗
    await sleep(3000, 5000);

    // 检查是否在主页加载了笔记列表，如果没有可能是要求登录
    // 这里需要用户人工扫码登录，第一次执行时
    console.log('等待笔记列表加载...');
    try {
        await page.waitForSelector('.note-item, section', { timeout: 15000 });
    } catch (e) {
        console.log('未检测到笔记列表，请检查浏览器是否要求登录或出现验证码。你有30秒时间处理...');
        await sleep(30000, 30000);
    }

    console.log('正在滚动页面加载笔记...');
    const notesMap = new Map(); // 使用 Map 去重
    
    // 滚动 3-5 次加载更多笔记
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
        await sleep(2000, 3000);
        
        // 提取当前视口内的笔记信息
        const currentNotes = await page.evaluate(() => {
            const items = document.querySelectorAll('.note-item, section');
            const data = [];
            items.forEach(item => {
                const aTag = item.querySelector('a[href*="/explore/"]');
                if (!aTag) return;
                const href = aTag.href;
                // 获取点赞数
                const countEl = item.querySelector('.count');
                const likeStr = countEl ? countEl.innerText.trim() : '0';
                
                // 获取封面
                const imgEl = item.querySelector('img');
                const cover = imgEl ? imgEl.src : '';
                
                // 获取标题
                const titleEl = item.querySelector('.title span');
                const title = titleEl ? titleEl.innerText.trim() : '';

                data.push({ href, likeStr, cover, title });
            });
            return data;
        });

        currentNotes.forEach(n => {
            if (n.href) notesMap.set(n.href, n);
        });
    }

    console.log(`共收集到 ${notesMap.size} 篇笔记，开始按点赞数排序...`);
    
    // 转换为数组并解析点赞数
    const allNotes = Array.from(notesMap.values()).map(n => ({
        ...n,
        likeCount: parseLikeCount(n.likeStr)
    }));

    // 按点赞数降序排序，截取前 N 篇
    allNotes.sort((a, b) => b.likeCount - a.likeCount);
    const targetNotes = allNotes.slice(0, topCount);

    console.log(`筛选出前 ${targetNotes.length} 篇高赞笔记，开始抓取详情...`);
    
    const results = [];
    
    // 逐个抓取详情
    for (let i = 0; i < targetNotes.length; i++) {
        const note = targetNotes[i];
        console.log(`[${i+1}/${targetNotes.length}] 正在抓取笔记: ${note.href} (点赞: ${note.likeStr})`);
        
        try {
            await page.goto(note.href, { waitUntil: 'domcontentloaded' });
            await sleep(2000, 4000); // 随机等待，模拟真人阅读
            
            // 提取正文和图片
            const detail = await page.evaluate(() => {
                const titleEl = document.querySelector('#detail-title');
                const descEl = document.querySelector('#detail-desc');
                const title = titleEl ? titleEl.innerText.trim() : '';
                const desc = descEl ? descEl.innerText.trim() : '';
                
                // 完美提取多图：拦截底层数据
                let images = [];
                try {
                    const stateStr = window.__INITIAL_STATE__;
                    if (stateStr && stateStr.note && stateStr.note.noteDetailMap) {
                        const noteId = Object.keys(stateStr.note.noteDetailMap)[0];
                        const noteData = stateStr.note.noteDetailMap[noteId].note;
                        if (noteData && noteData.imageList) {
                            images = noteData.imageList.map(img => img.urlDefault || img.url || img.infoList?.[1]?.url || img.infoList?.[0]?.url);
                        }
                    }
                } catch (e) {
                    console.error('解析底层数据失败', e);
                }
                
                // 如果底层数据没抓到图片，尝试 DOM 结构 fallback
                if (images.length === 0) {
                    const imgElements = document.querySelectorAll('.swiper-slide img.note-image');
                    imgElements.forEach(img => {
                        if (img.src) images.push(img.src);
                    });
                    if (images.length === 0) {
                        const allImgs = document.querySelectorAll('.note-scroller img');
                        allImgs.forEach(img => {
                            if (img.src) images.push(img.src);
                        });
                    }
                }
                
                return {
                    detailTitle: title,
                    detailDesc: desc,
                    images: Array.from(new Set(images.filter(Boolean))) // 去重
                };
            });
            
            // 执行本地 OCR 识别
            let finalContent = detail.detailDesc;
            if (detail.images.length > 0) {
                const ocrText = await recognizeImagesText(detail.images);
                if (ocrText) {
                    finalContent += '\n\n【图片OCR识别结果】:' + ocrText;
                }
            }
            
            results.push({
                ...note,
                title: detail.detailTitle || note.title,
                content: finalContent,
                images: detail.images.length > 0 ? detail.images : [note.cover].filter(Boolean)
            });
            
        } catch (err) {
            console.error(`抓取笔记 ${note.href} 失败:`, err.message);
            // 失败了也保存基础信息
            results.push({ ...note, content: '', images: [note.cover].filter(Boolean) });
        }
    }

    console.log('抓取完成，关闭浏览器上下文。');
    await context.close();
    
    return results;
}
