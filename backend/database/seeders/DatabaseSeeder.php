<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Approval;
use App\Models\AuditFinding;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Certificate;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Accounts strictly from environment; fail hard if missing in non-testing
        $isTesting = app()->environment('testing');
        $userPassword = env('SEED_USER_PASSWORD');
        $adminPassword = env('SEED_ADMIN_PASSWORD');
        $spiPassword = env('SEED_SPI_PASSWORD');

        if (! $isTesting) {
            if (empty($userPassword)) {
                throw new \RuntimeException('Seeder gagal: Variabel environment SEED_USER_PASSWORD belum diatur. Seeder dilarang membuat sandi acak diam-diam di lingkungan selain testing.');
            }
            if (empty($adminPassword)) {
                throw new \RuntimeException('Seeder gagal: Variabel environment SEED_ADMIN_PASSWORD belum diatur. Seeder dilarang membuat sandi acak diam-diam di lingkungan selain testing.');
            }
            if (empty($spiPassword)) {
                throw new \RuntimeException('Seeder gagal: Variabel environment SEED_SPI_PASSWORD belum diatur. Seeder dilarang membuat sandi acak diam-diam di lingkungan selain testing.');
            }
        } else {
            $userPassword = $userPassword ?: 'TestUserPass123!';
            $adminPassword = $adminPassword ?: 'TestAdminPass123!';
            $spiPassword = $spiPassword ?: 'TestSpiPass123!';
        }

        $user = User::updateOrCreate(
            ['email' => env('SEED_USER_EMAIL', 'siti.rahma@gmail.com')],
            [
                'name' => env('SEED_USER_NAME', 'Siti Rahma'),
                'phone' => '081239887711',
                'password' => Hash::make($userPassword),
                'role' => 'user',
                'status' => 'active',
                'email_verified_at' => now(),
                'locale' => 'id',
                'theme' => 'light',
                'must_change_password' => true,
            ]
        );

        $admin = User::updateOrCreate(
            ['email' => env('SEED_ADMIN_EMAIL', 'admin@cdepearls.com')],
            [
                'name' => env('SEED_ADMIN_NAME', 'Administrator CD\'E'),
                'phone' => '081239887722',
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => now(),
                'locale' => 'id',
                'theme' => 'light',
                'must_change_password' => true,
            ]
        );

        $spi = User::updateOrCreate(
            ['email' => env('SEED_SPI_EMAIL', 'owner.spi@cdepearls.com')],
            [
                'name' => env('SEED_SPI_NAME', 'Satuan Pengawas Internal'),
                'phone' => '081239887733',
                'password' => Hash::make($spiPassword),
                'role' => 'spi',
                'status' => 'active',
                'email_verified_at' => now(),
                'locale' => 'id',
                'theme' => 'light',
                'must_change_password' => true,
            ]
        );

        // 2. Customer Address for User
        Address::updateOrCreate(
            ['user_id' => $user->id, 'is_default' => true],
            [
                'label' => 'Rumah Utama',
                'recipient_name' => 'Siti Rahma',
                'phone' => '081239887711',
                'address_line' => 'Jl. Sriwijaya No. 45, RT 02 / RW 04, Mataram',
                'city' => 'Mataram',
                'province' => 'Nusa Tenggara Barat',
                'postal_code' => '83232',
                'is_default' => true,
            ]
        );

        // 3. Settings & Otorisasi Rules
        $settings = [
            'boutique_name' => 'CD\'E Pearls Lombok',
            'boutique_address' => 'Jl. Raya Senggigi No. 88, Batu Layar, Lombok Barat, NTB 83355',
            'boutique_farm_location' => 'Sekotong & Medana, Lombok',
            'whatsapp_number' => '6281239887766',
            'currency' => 'IDR',
            'price_change_percent_threshold' => '10',
            'price_change_nominal_threshold' => '2000000',
            'discount_percent_threshold' => '15',
        ];

        foreach ($settings as $key => $val) {
            Setting::updateOrCreate(['key' => $key], ['value' => $val]);
        }

        // 4. Categories
        $categories = [
            [
                'slug' => 'kalung-mutiara',
                'name' => 'Kalung Mutiara',
                'description' => 'Untaian Strand & Collar dari perairan Sekotong & Medana Lombok',
                'icon' => 'sparkles',
                'is_active' => true,
            ],
            [
                'slug' => 'gelang-mutiara',
                'name' => 'Gelang Mutiara',
                'description' => 'Bangle & Rantai Emas 18K mutiara laut eksklusif',
                'icon' => 'gem',
                'is_active' => true,
            ],
            [
                'slug' => 'anting-mutiara',
                'name' => 'Anting Mutiara',
                'description' => 'Stud, Drop & Dangle klasik bermahkota mutiara laut',
                'icon' => 'sparkles',
                'is_active' => true,
            ],
            [
                'slug' => 'cincin-mutiara',
                'name' => 'Cincin Mutiara',
                'description' => 'Solitaire & Mahkota Emas bertatahkan mutiara bulat murni',
                'icon' => 'gem',
                'is_active' => true,
            ],
            [
                'slug' => 'mutiara-lepas',
                'name' => 'Mutiara Lepas',
                'description' => 'Mutiara laut mentah kelas kolektor dengan kilau cermin tinggi',
                'icon' => 'sparkles',
                'is_active' => true,
            ],
            [
                'slug' => 'bros-mutiara',
                'name' => 'Bros Mutiara',
                'description' => 'Bros kebaya & jas berdesain flora khas Sasak Lombok',
                'icon' => 'sparkles',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }

        // 5. Certificates
        $certs = [
            [
                'nomor' => 'CDE-GL-2026-8921',
                'lab' => 'Sertifikat lab gemologi',
                'grade' => 'AAA',
                'ukuran' => '11-12 mm',
                'tanggal' => '2026-01-15',
                'pdf_path' => '/storage/certificates/CDE-GL-2026-8921.pdf',
            ],
            [
                'nomor' => 'CDE-GL-2026-8922',
                'lab' => 'Sertifikat lab gemologi',
                'grade' => 'AAA',
                'ukuran' => '10-11 mm',
                'tanggal' => '2026-01-20',
                'pdf_path' => '/storage/certificates/CDE-GL-2026-8922.pdf',
            ],
            [
                'nomor' => 'CDE-GL-2026-8923',
                'lab' => 'Sertifikat lab gemologi',
                'grade' => 'AAA',
                'ukuran' => '9-10 mm',
                'tanggal' => '2026-02-01',
                'pdf_path' => '/storage/certificates/CDE-GL-2026-8923.pdf',
            ],
            [
                'nomor' => 'CDE-GL-2026-8924',
                'lab' => 'Sertifikat lab gemologi',
                'grade' => 'AAA',
                'ukuran' => '12-13 mm',
                'tanggal' => '2026-02-10',
                'pdf_path' => '/storage/certificates/CDE-GL-2026-8924.pdf',
            ],
        ];

        $certIds = [];
        foreach ($certs as $cert) {
            $createdCert = Certificate::updateOrCreate(['nomor' => $cert['nomor']], $cert);
            $certIds[$cert['nomor']] = $createdCert->id;
        }

        // 6. Products
        $products = [
            [
                'code' => 'PRD-LMB-001',
                'category_slug' => 'kalung-mutiara',
                'certificate_id' => $certIds['CDE-GL-2026-8921'] ?? null,
                'name' => 'Kalung Mutiara Air Laut Selatan Ratu Sire',
                'price' => 18500000,
                'original_price' => 20000000,
                'discount_percent' => 7,
                'stock' => 5,
                'rating' => 5.0,
                'reviews_count' => 12,
                'varietas' => 'South Sea Pearl',
                'grade' => 'AAA',
                'logam' => 'Emas Kuning 18K (750)',
                'ukuran_mm' => '11-12 mm',
                'berat' => '5.4 gr',
                'is_featured' => true,
                'is_bestseller' => true,
                'image' => '/images/hero_pearl_shell.jpg',
                'images' => ['/images/hero_pearl_shell.jpg', '/images/featured_pearl_dark_luxury.jpg'],
                'description' => 'Kalung untaian mutiara air laut selatan pilihan dari kedalaman perairan Lombok dengan kilau cermin tinggi (Mirror Luster). Pengait emas 18K bersertifikat resmi.',
                'status' => 'published',
            ],
            [
                'code' => 'PRD-LMB-002',
                'category_slug' => 'gelang-mutiara',
                'certificate_id' => $certIds['CDE-GL-2026-8922'] ?? null,
                'name' => 'Gelang Rantai Mutiara Emas Imperial',
                'price' => 14200000,
                'original_price' => 15000000,
                'discount_percent' => 5,
                'stock' => 3,
                'rating' => 4.9,
                'reviews_count' => 8,
                'varietas' => 'Golden South Sea',
                'grade' => 'AAA',
                'logam' => 'Emas Kuning 18K (750)',
                'ukuran_mm' => '10-11 mm',
                'berat' => '4.8 gr',
                'is_featured' => true,
                'is_bestseller' => true,
                'image' => '/images/featured_pearl_dark_luxury.jpg',
                'images' => ['/images/featured_pearl_dark_luxury.jpg'],
                'description' => 'Mutiara laut warna emas keemasan alami tanpa pewarna kimia, dipadukan rantai emas kuning 18K bermotif elegan.',
                'status' => 'published',
            ],
            [
                'code' => 'PRD-LMB-003',
                'category_slug' => 'anting-mutiara',
                'certificate_id' => $certIds['CDE-GL-2026-8923'] ?? null,
                'name' => 'Anting Stud Mutiara Putih Lombok AAA',
                'price' => 7800000,
                'original_price' => 7800000,
                'discount_percent' => 0,
                'stock' => 8,
                'rating' => 5.0,
                'reviews_count' => 15,
                'varietas' => 'South Sea Pearl',
                'grade' => 'AAA',
                'logam' => 'Emas Putih 18K (750)',
                'ukuran_mm' => '9-10 mm',
                'berat' => '2.6 gr',
                'is_featured' => true,
                'is_bestseller' => true,
                'image' => '/images/terroir_pearl_plate_left.jpg',
                'images' => ['/images/terroir_pearl_plate_left.jpg'],
                'description' => 'Anting stud klasik dengan mutiara bulat sempurna (round) berdiameter 9.5mm dan dudukan emas putih 18K tahan lama.',
                'status' => 'published',
            ],
            [
                'code' => 'PRD-LMB-004',
                'category_slug' => 'cincin-mutiara',
                'certificate_id' => $certIds['CDE-GL-2026-8924'] ?? null,
                'name' => 'Cincin Solitaire Tahitian Black Pearl 12mm',
                'price' => 12600000,
                'original_price' => 13500000,
                'discount_percent' => 6,
                'stock' => 2,
                'rating' => 4.9,
                'reviews_count' => 6,
                'varietas' => 'Tahitian Black Pearl',
                'grade' => 'AAA',
                'logam' => 'Emas Putih 18K (750)',
                'ukuran_mm' => '12-13 mm',
                'berat' => '3.9 gr',
                'is_featured' => true,
                'is_bestseller' => true,
                'image' => '/images/cat_ring_silk.jpg',
                'images' => ['/images/cat_ring_silk.jpg'],
                'description' => 'Mutiara hitam eksotis Tahiti dengan kilau peacock hijau keperakan di atas rangka mahkota emas putih 18K beraksen pavé.',
                'status' => 'published',
            ],
            [
                'code' => 'PRD-LMB-005',
                'category_slug' => 'mutiara-lepas',
                'certificate_id' => null,
                'name' => 'Mutiara Lepas Golden South Sea 14mm AAA',
                'price' => 9500000,
                'original_price' => 9500000,
                'discount_percent' => 0,
                'stock' => 1,
                'rating' => 5.0,
                'reviews_count' => 4,
                'varietas' => 'Golden South Sea',
                'grade' => 'AAA',
                'logam' => 'Tanpa Rangka Logam',
                'ukuran_mm' => '14 mm',
                'berat' => '3.8 gr',
                'is_featured' => false,
                'is_bestseller' => false,
                'image' => '/images/hero_pearl_dark_luxury.jpg',
                'images' => ['/images/hero_pearl_dark_luxury.jpg'],
                'description' => 'Mutiara lepas mentah kelas kolektor dengan permukaan mulus di atas 98%, nacre tebal, dan warna deep golden memukau.',
                'status' => 'published',
            ],
            [
                'code' => 'PRD-LMB-006',
                'category_slug' => 'kalung-mutiara',
                'certificate_id' => null,
                'name' => 'Kalung Choker Mutiara Gradasi Laut Selatan',
                'price' => 32000000,
                'original_price' => 35000000,
                'discount_percent' => 8,
                'stock' => 2,
                'rating' => 5.0,
                'reviews_count' => 3,
                'varietas' => 'South Sea Pearl',
                'grade' => 'AA+',
                'logam' => 'Emas Kuning 18K (750)',
                'ukuran_mm' => '10-13 mm',
                'berat' => '38.5 gr',
                'is_featured' => false,
                'is_bestseller' => false,
                'image' => '/images/hero_pearl_bg.jpg',
                'images' => ['/images/hero_pearl_bg.jpg'],
                'description' => 'Untaian choker 42cm dengan susunan gradasi simetris yang dirangkai manual dengan sutra khusus perhiasan berkekuatan tinggi.',
                'status' => 'published',
            ],
        ];

        foreach ($products as $prd) {
            $createdProduct = Product::updateOrCreate(['code' => $prd['code']], $prd);

            // Record initial stock movement
            StockMovement::create([
                'product_id' => $createdProduct->id,
                'type' => 'in',
                'quantity' => $createdProduct->stock,
                'stock_before' => 0,
                'stock_after' => $createdProduct->stock,
                'reference_type' => 'initial_seed',
                'notes' => 'Stok awal panen butik perhiasan CD\'E Pearls',
                'created_by' => 'System Seeder',
            ]);
        }

        // 7. Sample Orders for User
        $firstProduct = Product::where('code', 'PRD-LMB-001')->first();
        if ($firstProduct) {
            $order = Order::updateOrCreate(
                ['order_number' => 'ORD-2026-081'],
                [
                    'user_id' => $user->id,
                    'customer_name' => 'Siti Rahma',
                    'customer_phone' => '081239887711',
                    'customer_address' => 'Jl. Sriwijaya No. 45, Mataram, Lombok Barat, NTB',
                    'notes' => 'Harap dikemas dengan kotak beludru merah marun dan pita emas.',
                    'subtotal' => $firstProduct->price,
                    'discount' => 0,
                    'shipping_cost' => 50000,
                    'insurance_cost' => 25000,
                    'total' => $firstProduct->price + 75000,
                    'payment_method' => 'TRANSFER_BANK',
                    'payment_status' => 'PAID',
                    'order_status' => 'PROCESSING',
                    'tracking_number' => 'JNE-REG-882910291',
                    'courier' => 'JNE Express',
                ]
            );

            OrderItem::updateOrCreate(
                ['order_id' => $order->id, 'product_id' => $firstProduct->id],
                [
                    'product_name' => $firstProduct->name,
                    'product_image' => $firstProduct->image,
                    'pearl_size' => $firstProduct->ukuran_mm,
                    'metal' => $firstProduct->logam,
                    'price' => $firstProduct->price,
                    'quantity' => 1,
                    'subtotal' => $firstProduct->price,
                ]
            );
        }

        // 8. Sample SPI Approvals (Pending, Approved, Rejected)
        Approval::updateOrCreate(
            ['title' => 'Perubahan Harga Kalung Mutiara Ratu Sire (>10%)'],
            [
                'type' => 'price_change',
                'target_type' => 'product',
                'target_id' => (string) ($firstProduct ? $firstProduct->id : 1),
                'old_value' => ['price' => 18500000, 'name' => 'Kalung Mutiara Air Laut Selatan Ratu Sire'],
                'new_value' => ['price' => 21500000, 'reason' => 'Kenaikan indeks harga emas 18K global'],
                'requester_id' => $admin->id,
                'status' => 'pending',
                'reason' => 'Perubahan harga melebihi batas 10% (selisih Rp 3.000.000). Membutuhkan otorisasi SPI.',
            ]
        );

        Approval::updateOrCreate(
            ['title' => 'Otorisasi Konfirmasi Pembayaran Manual ORD-2026-081'],
            [
                'type' => 'payment_override',
                'target_type' => 'order',
                'target_id' => 'ORD-2026-081',
                'old_value' => ['payment_status' => 'WAITING_PAYMENT'],
                'new_value' => ['payment_status' => 'PAID', 'verified_by' => 'admin@cdepearls.com'],
                'requester_id' => $admin->id,
                'status' => 'approved',
                'decider_id' => $spi->id,
                'reason' => 'Mutasi rekening Bank BCA Butik CD\'E Pearls sudah diverifikasi valid dan dana masuk.',
                'decided_at' => now()->subHours(2),
            ]
        );

        Approval::updateOrCreate(
            ['title' => 'Diskon Khusus VIP 20% Anting Stud Putih'],
            [
                'type' => 'discount_over_limit',
                'target_type' => 'product',
                'target_id' => 'PRD-LMB-003',
                'old_value' => ['discount_percent' => 0],
                'new_value' => ['discount_percent' => 20],
                'requester_id' => $admin->id,
                'status' => 'rejected',
                'decider_id' => $spi->id,
                'reason' => 'Diskon melebihi batas margin keuntungan kuartal I 2026. Maksimal diskon 12%.',
                'decided_at' => now()->subDay(),
            ]
        );

        // 9. Initial Append-Only Audit Logs
        AuditLog::create([
            'actor_id' => $spi->id,
            'actor_name' => $spi->name,
            'actor_role' => 'spi',
            'action' => 'APPROVE_PAYMENT_OVERRIDE',
            'target_type' => 'order',
            'target_id' => 'ORD-2026-081',
            'old_value' => ['payment_status' => 'WAITING_PAYMENT'],
            'new_value' => ['payment_status' => 'PAID'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CD\'E Pearls Atelier',
            'created_at' => now()->subHours(2),
        ]);

        AuditLog::create([
            'actor_id' => $admin->id,
            'actor_name' => $admin->name,
            'actor_role' => 'admin',
            'action' => 'SUBMIT_PRICE_APPROVAL',
            'target_type' => 'product',
            'target_id' => (string) ($firstProduct ? $firstProduct->id : 1),
            'old_value' => ['price' => 18500000],
            'new_value' => ['price' => 21500000],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CD\'E Pearls Atelier',
            'created_at' => now()->subHours(5),
        ]);

        // 10. SPI Audit Findings
        AuditFinding::updateOrCreate(
            ['code' => 'AUD-2026-001'],
            [
                'category' => 'Inventaris',
                'severity' => 'high',
                'title' => 'Selisih Pencatatan Stok Mutiara Lepas di Brankas Sekotong',
                'description' => 'Terdapat selisih 1 butir mutiara kelas 14mm antara buku fisik brankas dan catatan sistem gudang pusat.',
                'recommendation' => 'Lakukan rekonsiliasi stok brankas sekotong bersama penanggung jawab farm dan kunci ganda brankas.',
                'assignee_id' => $admin->id,
                'status' => 'open',
                'due_date' => now()->addDays(7)->toDateString(),
            ]
        );

        AuditFinding::updateOrCreate(
            ['code' => 'AUD-2026-002'],
            [
                'category' => 'Kepatuhan Gemologi',
                'severity' => 'medium',
                'title' => 'Pembaruan Dokumen Sertifikat Uji Lab Mutiara Batch 12',
                'description' => 'Arsip PDF sertifikat gemologi untuk 3 lot mutiara putih belum diunggah ke repositori digital.',
                'recommendation' => 'Unggah salinan PDF bertanda tangan digital gemologis ke modul sertifikat sistem.',
                'assignee_id' => $admin->id,
                'status' => 'in_progress',
                'due_date' => now()->addDays(14)->toDateString(),
            ]
        );
    }
}
