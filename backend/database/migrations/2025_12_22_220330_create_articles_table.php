<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('articles', function (Blueprint $table) {
        $table->id();
        $table->string('title'); // Stores the article headline
        $table->longText('original_content'); // Stores the scraped HTML
        $table->longText('updated_content')->nullable(); // Stores the LLM version (empty at first)
        $table->enum('status', ['pending', 'completed'])->default('pending'); // Tracks progress
        $table->timestamps(); // Created_at and Updated_at
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
