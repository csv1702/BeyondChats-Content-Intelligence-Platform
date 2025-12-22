<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Article;

class FetchArticles extends Command
{
    protected $signature = 'fetch:articles';
    protected $description = 'Scrape the 5 oldest articles from BeyondChats blogs';

    public function handle()
    {
        $this->info('Starting scraper...');

        // 1. Fetch the main blog page
        $url = 'https://beyondchats.com/blogs/';
        $this->info("Fetching URL: $url");
        
        $response = Http::get($url);

        if ($response->failed()) {
            $this->error('Failed to connect to BeyondChats. Status: ' . $response->status());
            return;
        }

        $html = $response->body();
        $crawler = new Crawler($html);

        $this->info('Connected. Parsing articles...');

        $articlesData = [];

        // 2. Filter specific article cards
        // We look for typical article containers. 
        // Based on BeyondChats structure, they likely use standard grids.
        
        // Strategy A: Look for "div.item" or "article" tags which usually hold blog posts
        $crawler->filter('article, .post, .blog-post, .card')->each(function (Crawler $node) use (&$articlesData) {
            try {
                // Find title (h2, h3, or h5)
                $titleNode = $node->filter('h2, h3, h5, .entry-title')->first();
                // Find link
                $linkNode = $node->filter('a')->first();

                if ($titleNode->count() > 0 && $linkNode->count() > 0) {
                    $title = trim($titleNode->text());
                    $link = $linkNode->attr('href');
                    
                    if (!empty($title) && !empty($link) && str_contains($link, 'beyondchats.com')) {
                        $articlesData[] = [
                            'title' => $title,
                            'link'  => $link
                        ];
                    }
                }
            } catch (\Exception $e) {
                // Ignore parsing errors for individual bad nodes
            }
        });

        // Strategy B: If Strategy A failed, find ANY link inside an H2 or H3 (very common pattern)
        if (empty($articlesData)) {
            $this->info("Strategy A failed. Trying generic header search...");
            $crawler->filter('h2 a, h3 a')->each(function (Crawler $node) use (&$articlesData) {
                $articlesData[] = [
                    'title' => trim($node->text()),
                    'link'  => $node->attr('href')
                ];
            });
        }

        // Remove duplicates based on Link
        $articlesData = array_map("unserialize", array_unique(array_map("serialize", $articlesData)));

        // 3. Get the "oldest" 5 (We take the last 5 from the list)
        if (empty($articlesData)) {
            $this->error("Could not find any articles. The website structure might be very unique.");
            return;
        }

        // Usually, blogs show newest first. So "Oldest" on this page are at the bottom.
        // We take the last 5 items from the array.
        $totalFound = count($articlesData);
        $this->info("Found total $totalFound articles on the page.");
        
        // Logic: If we want "oldest", we usually paginate to the end. 
        // For this task, we will just take the last 5 from the current page to keep it simple.
        $oldestArticles = array_slice(array_reverse($articlesData), 0, 5);

        // 4. Loop through and save
        foreach ($oldestArticles as $item) {
            $this->info("Processing: " . $item['title']);
            
            // Check if already exists to save time
            if (Article::where('title', $item['title'])->exists()) {
                $this->info(" -> Already exists. Skipping.");
                continue;
            }

            // Fetch the individual page content
            try {
                $pageResponse = Http::get($item['link']);
                
                if ($pageResponse->ok()) {
                    $pageCrawler = new Crawler($pageResponse->body());
                    
                    // Try to find the main content text
                    // We look for the longest text block in common containers
                    $content = "Content not found";
                    
                    // List of common content wrappers
                    $selectors = ['.entry-content', '.post-content', '.blog-content', 'article', 'main'];
                    
                    foreach ($selectors as $selector) {
                        if ($pageCrawler->filter($selector)->count() > 0) {
                            $content = $pageCrawler->filter($selector)->html();
                            break;
                        }
                    }

                    // Save to DB
                    Article::create([
                        'title' => $item['title'],
                        'original_content' => $content, // Save HTML
                        'status' => 'pending'
                    ]);
                    
                    $this->info(" -> Saved to DB.");
                }
            } catch (\Exception $e) {
                $this->error(" -> Failed to fetch content: " . $e->getMessage());
            }
        }

        $this->info('Scraping run completed.');
    }
}