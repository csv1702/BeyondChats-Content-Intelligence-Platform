require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- CONFIGURATION ---
console.log("🤖 Worker Script Initialized...");

// Use the stable free-tier model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// --- HELPER FUNCTIONS ---

async function searchGoogle(query) {
    console.log(`🔎 Searching Google for: "${query}"...`);
    try {
        const response = await axios.post('https://google.serper.dev/search', {
            q: query,
            num: 5
        }, {
            headers: {
                'X-API-KEY': process.env.SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const results = response.data.organic || [];
        return results.slice(0, 2).map(r => r.link);
    } catch (error) {
        console.error("❌ Google Search Failed:", error.message);
        return [];
    }
}

async function scrapeExternalPage(url) {
    console.log(`⬇️ Scraping: ${url}`);
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        let text = $('article').text() || $('main').text() || $('body').text();
        return text.replace(/\s+/g, ' ').substring(0, 4000); 
    } catch (error) {
        console.warn(`⚠️ Failed to scrape ${url}`);
        return "";
    }
}

async function processArticles() {
    try {
        // Fetch all articles
        const response = await axios.get(`${process.env.LARAVEL_API_URL}/articles`);
        const pendingArticles = response.data.filter(a => a.status === 'pending');

        if (pendingArticles.length === 0) {
            return false; // No work done
        }

        console.log(`🚀 Found ${pendingArticles.length} pending articles.`);

        for (const article of pendingArticles) {
            console.log(`\n⚡ Processing ID ${article.id}: "${article.title}"`);

            // 1. Research
            const links = await searchGoogle(article.title);
            let research = "";
            for (const link of links) {
                const content = await scrapeExternalPage(link);
                if (content) research += `\nSource: ${link}\n${content}\n`;
            }

            // 2. AI Writing
            console.log("🧠 Sending to Gemini...");
            const prompt = `
                Rewrite this article to be comprehensive.
                Original: "${article.original_content}"
                Research: ${research}
                Requirements: Professional tone, HTML formatting, List sources at end.
            `;

            const result = await model.generateContent(prompt);
            const newContent = result.response.text();

            // 3. Save
            await axios.put(`${process.env.LARAVEL_API_URL}/articles/${article.id}`, {
                updated_content: newContent
            });

            console.log(`✅ Article ${article.id} Done!`);
            
            // Safety pause
            await new Promise(r => setTimeout(r, 2000));
        }
        return true; // Work was done

    } catch (error) {
        console.error("❌ Error in process loop:", error.message);
        return false;
    }
}

// --- MAIN WATCHER LOOP ---
async function startWorker() {
    console.log("👀 Worker started. Waiting for tasks...");
    
    while (true) {
        const didWork = await processArticles();
        
        if (!didWork) {
            // If no work was found, wait 5 seconds before checking again
            // using process.stdout.write to avoid spamming new lines
            process.stdout.write("."); 
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            console.log("\n💤 Batch finished. checking again in 5s...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

startWorker();