<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

use App\Http\Controllers\ArticleController;

Route::get('/articles', [ArticleController::class, 'index']);      // List all
Route::get('/articles/{id}', [ArticleController::class, 'show']);  // Get one
Route::put('/articles/{id}', [ArticleController::class, 'update']); // Update one