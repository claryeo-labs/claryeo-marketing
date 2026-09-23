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
        Schema::table('post_views', function (Blueprint $table) {
            // Composite index on views and last_viewed_at to optimize PostViews::topIds()
            // query: ORDER BY views DESC, last_viewed_at DESC LIMIT x
            $table->index(['views', 'last_viewed_at'], 'post_views_views_last_viewed_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('post_views', function (Blueprint $table) {
            $table->dropIndex('post_views_views_last_viewed_at_index');
        });
    }
};
