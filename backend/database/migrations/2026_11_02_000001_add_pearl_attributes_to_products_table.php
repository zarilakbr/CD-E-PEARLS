<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'bentuk')) {
                $table->string('bentuk', 50)->nullable()->after('berat');
            }
            if (! Schema::hasColumn('products', 'kelompok_warna')) {
                $table->string('kelompok_warna', 50)->nullable()->after('bentuk');
            }
            if (! Schema::hasColumn('products', 'varian_warna')) {
                $table->string('varian_warna', 100)->nullable()->after('kelompok_warna');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['bentuk', 'kelompok_warna', 'varian_warna']);
        });
    }
};

