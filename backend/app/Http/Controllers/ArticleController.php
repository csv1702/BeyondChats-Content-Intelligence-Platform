<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Article;

class ArticleController extends Controller
{
    // 1. GET /api/articles
    // Used by: React Frontend to list all articles
    public function index()
    {
        return response()->json(Article::all());
    }

    // 2. GET /api/articles/{id}
    // Used by: Node Worker to fetch a specific article to process
    public function show($id)
    {
        $article = Article::find($id);
        
        if (!$article) {
            return response()->json(['message' => 'Article not found'], 404);
        }

        return response()->json($article);
    }

    // 3. PUT /api/articles/{id}
    // Used by: Node Worker to save the AI-rewritten content
    public function update(Request $request, $id)
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json(['message' => 'Article not found'], 404);
        }

        // Validate that we are sending the right data
        $validated = $request->validate([
            'updated_content' => 'required|string',
        ]);

        // Update the article
        $article->updated_content = $validated['updated_content'];
        $article->status = 'completed'; // Mark as done
        $article->save();

        return response()->json(['message' => 'Article updated successfully', 'article' => $article]);
    }
}