<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->integer('stock_on_hand')->default(0)->after('stock');
            $table->integer('stock_reserved')->default(0)->after('stock_on_hand');
        });

        // Inisialisasi data yang sudah ada: stock_on_hand diisi dari nilai stock saat ini
        DB::table('products')->update([
            'stock_on_hand' => DB::raw('stock'),
            'stock_reserved' => 0,
        ]);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['stock_on_hand', 'stock_reserved']);
        });
    }
};
