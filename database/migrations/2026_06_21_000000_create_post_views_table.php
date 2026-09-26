<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_views', function (Blueprint $table) {
            $table->string('entry_id')->primary();
            $table->unsignedBigInteger('views')->default(0);
            $table->timestamp('last_viewed_at')->nullable();

            // Composite index on (views, last_viewed_at) enables O(limit) index scans
            // for PostViews::topIds() without full table scans or in-memory filesorts.
            $table->index(['views', 'last_viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_views');
    }
};
