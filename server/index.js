import express from 'express';
import cors from 'cors';
import { scrapeAuthorNotes } from './scraper/xhsPlaywright.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 爬取作者高赞笔记接口
app.post('/api/scrape/author', async (req, res) => {
    const { url, topCount = 10 } = req.body;
    
    if (!url || !url.includes('xiaohongshu.com/user/profile/')) {
        return res.status(400).json({ error: '无效的小红书作者主页链接' });
    }

    try {
        console.log(`开始抓取作者主页: ${url}, 目标数量: 前 ${topCount} 篇`);
        // 传递一个回调函数，用于实时返回进度给前端（可选，如果前端用 SSE 接收）
        // 这里为了简单，先做成同步等待返回结果
        const result = await scrapeAuthorNotes(url, topCount);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('抓取失败:', error);
        res.status(500).json({ error: error.message || '抓取失败，请查看后台日志' });
    }
});

app.listen(PORT, () => {
    console.log(`XHS Toolkit 爬虫服务已启动，监听端口: ${PORT}`);
    console.log(`在前端执行抓取前，请确保服务正在运行...`);
});
