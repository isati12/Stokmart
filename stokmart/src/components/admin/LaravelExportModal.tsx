import React, { useState } from 'react';
import {
  X,
  Code,
  Copy,
  Check,
  FileCode,
  FolderTree,
  Terminal,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface LaravelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LaravelExportModal: React.FC<LaravelExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeFile, setActiveFile] = useState<string>('service');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files: Record<
    string,
    { filename: string; path: string; language: string; content: string }
  > = {
    service: {
      filename: 'TsbAlgorithmService.php',
      path: 'app/Services/TsbAlgorithmService.php',
      language: 'php',
      content: `<?php

namespace App\\Services;

class TsbAlgorithmService
{
    protected array $serviceLevelZScores = [
        0.90 => 1.282,
        0.95 => 1.645,
        0.98 => 2.054,
        0.99 => 2.326,
    ];

    /**
     * Hitung Algoritma Teunter-Syntetos-Babai (TSB)
     */
    public function calculate(
        array $demandHistory,
        int $currentStock,
        int $leadTimeDays = 4,
        float $alpha = 0.20,
        float $beta = 0.15,
        float $serviceLevel = 0.95
    ): array {
        $n = count($demandHistory);
        if ($n === 0) return [];

        $nonZeroDemands = array_values(array_filter($demandHistory, fn($d) => $d > 0));
        $currentZ = count($nonZeroDemands) > 0 ? (float)$nonZeroDemands[0] : 1.0;
        $currentP = max(0.05, count($nonZeroDemands) / max(1, $n));
        $periods = [];

        foreach ($demandHistory as $t => $y_t) {
            if ($y_t > 0) {
                // Ada permintaan: magnitude & probabilitas diperbarui
                $currentZ = ($alpha * $y_t) + ((1.0 - $alpha) * $currentZ);
                $currentP = ($beta * 1.0) + ((1.0 - $beta) * $currentP);
            } else {
                // Nol permintaan: magnitude tetap, probabilitas meluruh (KUNCI TSB)
                $currentP = (1.0 - $beta) * $currentP;
            }

            $forecast = $currentZ * $currentP;
            $periods[] = [
                'period' => $t + 1,
                'actual_demand' => $y_t,
                'z_t' => round($currentZ, 4),
                'p_t' => round($currentP, 4),
                'forecast' => round($forecast, 4),
            ];
        }

        $forecastPerDay = $currentZ * $currentP;

        // Deviasi standar untuk Safety Stock
        $meanDemand = array_sum($demandHistory) / max(1, $n);
        $variance = 0.0;
        if ($n > 1) {
            foreach ($demandHistory as $d) {
                $variance += pow($d - $meanDemand, 2);
            }
            $variance /= ($n - 1);
        }
        $stdDev = sqrt($variance);

        $zScore = $this->serviceLevelZScores[$serviceLevel] ?? 1.645;
        $safetyStock = (int)ceil($zScore * sqrt($leadTimeDays) * $stdDev);
        $demandDuringLeadTime = $forecastPerDay * $leadTimeDays;
        $reorderPoint = (int)ceil($demandDuringLeadTime + $safetyStock);
        $orderUpToLevel = max($reorderPoint + 5, $reorderPoint + (int)ceil($forecastPerDay * $leadTimeDays * 2.5));

        $recommendedRestockQty = $currentStock <= $reorderPoint ? max(1, $orderUpToLevel - $currentStock) : 0;

        return [
            'forecast_per_day' => $forecastPerDay,
            'safety_stock' => $safetyStock,
            'reorder_point' => $reorderPoint,
            'order_up_to_level' => $orderUpToLevel,
            'recommended_restock_qty' => $recommendedRestockQty,
            'stock_status' => $currentStock <= $reorderPoint ? 'CRITICAL' : 'OPTIMAL',
            'periods' => $periods,
        ];
    }
}`,
    },
    controller: {
      filename: 'InventoryController.php',
      path: 'app/Http/Controllers/InventoryController.php',
      language: 'php',
      content: `<?php

namespace App\\Http\\Controllers;

use App\\Models\\Product;
use App\\Models\\RestockOrder;
use App\\Services\\TsbAlgorithmService;
use Illuminate\\Http\\Request;

class InventoryController extends Controller
{
    protected TsbAlgorithmService $tsbService;

    public function __construct(TsbAlgorithmService $tsbService)
    {
        $this->tsbService = $tsbService;
    }

    public function dashboard(Request $request)
    {
        $products = Product::all();
        $analyses = [];

        foreach ($products as $product) {
            $history = [0, 0, 2, 0, 1, 0, 0, 0, 3, 0, 0, 1]; // atau dari tabel demand_histories
            $analyses[$product->id] = $this->tsbService->calculate(
                $history,
                $product->current_stock,
                $product->lead_time_days ?? 4
            );
        }

        return view('admin.dashboard', compact('products', 'analyses'));
    }

    public function createRestockOrder(Request $request, Product $product)
    {
        $order = RestockOrder::create([
            'po_number' => 'PO-' . date('Y') . '-' . rand(1000, 9999),
            'product_id' => $product->id,
            'supplier_name' => $product->supplier_name,
            'quantity' => $request->quantity,
            'unit_cost' => $product->cost_price,
            'total_cost' => $product->cost_price * $request->quantity,
            'status' => 'IN_TRANSIT',
        ]);

        return back()->with('success', 'PO Restok TSB berhasil dibuat!');
    }
}`,
    },
    migration: {
      filename: 'create_products_and_tsb_tables.php',
      path: 'database/migrations/2026_01_01_000001_create_products_and_tsb_tables.php',
      language: 'php',
      content: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('name');
            $table->string('category');
            $table->decimal('price', 15, 2);
            $table->decimal('cost_price', 15, 2);
            $table->integer('current_stock')->default(0);
            $table->integer('lead_time_days')->default(4);
            $table->string('supplier_name')->nullable();
            $table->timestamps();
        });

        Schema::create('restock_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->foreignId('product_id')->constrained();
            $table->integer('quantity');
            $table->decimal('total_cost', 15, 2);
            $table->string('status')->default('IN_TRANSIT');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restock_orders');
        Schema::dropIfExists('products');
    }
};`,
    },
    routes: {
      filename: 'web.php',
      path: 'routes/web.php',
      language: 'php',
      content: `<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\InventoryController;
use App\\Http\\Controllers\\OrderController;

// Storefront & Public Tracking
Route::get('/', function () { return view('storefront.index'); });
Route::post('/checkout', [OrderController::class, 'checkout'])->name('order.checkout');
Route::get('/track', [OrderController::class, 'publicTrack'])->name('order.track');

// Admin Panel & Konfirmasi Pembayaran
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [InventoryController::class, 'dashboard'])->name('dashboard');
    Route::post('/orders/{order}/confirm-payment', [OrderController::class, 'confirmPayment'])->name('orders.confirm');
    Route::post('/products/{product}/restock', [InventoryController::class, 'createRestockOrder'])->name('restock');
});`,
    },
    order_controller: {
      filename: 'OrderController.php',
      path: 'app/Http/Controllers/OrderController.php',
      language: 'php',
      content: `<?php

namespace App\\Http\\Controllers;

use App\\Models\\CustomerOrder;
use App\\Models\\Product;
use App\\Models\\TrackingStep;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;

class OrderController extends Controller
{
    // Checkout dengan Bank Indonesia, QRIS, dan 5 Kurir
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string',
            'customer_email' => 'required|email',
            'customer_address' => 'required|string',
            'payment_method' => 'required|in:bank_transfer,qris,po_corporate',
            'selected_bank' => 'nullable|string',
            'selected_courier_id' => 'required|string',
            'courier_name' => 'required|string',
            'shipping_cost' => 'required|numeric',
            'items' => 'required|array|min:1',
        ]);

        return DB::transaction(function () use ($validated) {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $p = Product::findOrFail($item['product_id']);
                $subtotal += $p->price * $item['quantity'];
                $p->decrement('current_stock', $item['quantity']);
            }

            $order = CustomerOrder::create([
                'order_number' => 'INV-' . date('Ymd') . '-' . rand(1000, 9999),
                'tracking_code' => 'TRK-NETS-' . rand(10000, 99999),
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'customer_phone' => $validated['customer_phone'],
                'customer_address' => $validated['customer_address'],
                'subtotal_amount' => $subtotal,
                'shipping_cost' => $validated['shipping_cost'],
                'total_amount' => $subtotal + $validated['shipping_cost'],
                'payment_method' => $validated['payment_method'],
                'selected_bank' => $validated['selected_bank'] ?? 'BCA',
                'selected_courier_id' => $validated['selected_courier_id'],
                'courier_name' => $validated['courier_name'],
                'status' => 'WAITING_PAYMENT',
            ]);

            TrackingStep::create([
                'order_id' => $order->id,
                'status_title' => 'Pesanan Dibuat',
                'description' => 'Pesanan masuk sistem. Menunggu verifikasi pembayaran Admin.',
                'location' => 'NetSolusions Store',
            ]);

            return response()->json(['success' => true, 'order' => $order]);
        });
    }

    // Lacak Pesanan Tanpa Login
    public function publicTrack(Request $request)
    {
        $q = trim($request->get('q', ''));
        $order = CustomerOrder::with('trackingSteps')
            ->where('tracking_code', $q)
            ->orWhere('order_number', $q)
            ->orWhere('customer_phone', 'LIKE', "%{$q}%")
            ->firstOrFail();

        return response()->json([
            'order' => $order,
            'is_unlocked' => $order->status !== 'WAITING_PAYMENT'
        ]);
    }

    // Admin Konfirmasi Pembayaran -> Buka Live Tracking
    public function confirmPayment(Request $request, CustomerOrder $order)
    {
        $awb = $request->awb ?: strtoupper($order->selected_courier_id) . '-' . rand(100000000, 999999999);
        $order->update([
            'status' => 'PROCESSING',
            'shipping_awb_number' => $awb,
            'payment_confirmed_at' => now(),
            'payment_confirmed_by' => auth()->user()?->name ?? 'Admin',
        ]);

        TrackingStep::create([
            'order_id' => $order->id,
            'status_title' => 'Pembayaran Dikonfirmasi',
            'description' => "Pembayaran diverifikasi. Tracking kurir aktif. Resi: {$awb}",
            'location' => 'Kantor Keuangan NetSolusions',
        ]);

        return back()->with('success', 'Pembayaran dikonfirmasi! Tracking kurir terbuka.');
    }
}`,
    },
    sql_dump: {
      filename: 'netsolusions_tsb.sql',
      path: 'database/netsolusions_tsb.sql',
      language: 'sql',
      content: `-- IMPORT INI DI LARAGON (HEIDISQL / PHPMYADMIN)
CREATE DATABASE IF NOT EXISTS \`netsolusions_tsb\` DEFAULT CHARACTER SET utf8mb4;
USE \`netsolusions_tsb\`;

-- Tabel Produk Suku Cadang & Otomasi
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`sku\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`price\` DECIMAL(15,2) NOT NULL,
  \`cost_price\` DECIMAL(15,2) NOT NULL,
  \`current_stock\` INT NOT NULL DEFAULT 0,
  \`minimum_stock\` INT NOT NULL DEFAULT 5,
  \`lead_time_days\` INT NOT NULL DEFAULT 4,
  \`unit\` VARCHAR(30) NOT NULL DEFAULT 'Unit',
  \`image_url\` TEXT,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pesanan Pelanggan
CREATE TABLE IF NOT EXISTS \`customer_orders\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`order_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`tracking_code\` VARCHAR(50) NOT NULL UNIQUE,
  \`customer_name\` VARCHAR(150) NOT NULL,
  \`customer_email\` VARCHAR(150) NOT NULL,
  \`customer_phone\` VARCHAR(50) NOT NULL,
  \`customer_address\` TEXT NOT NULL,
  \`subtotal_amount\` DECIMAL(15,2) NOT NULL,
  \`shipping_cost\` DECIMAL(12,2) NOT NULL,
  \`total_amount\` DECIMAL(15,2) NOT NULL,
  \`payment_method\` ENUM('bank_transfer', 'qris', 'po_corporate') NOT NULL,
  \`selected_bank\` VARCHAR(30) NULL,
  \`selected_courier_id\` VARCHAR(30) NOT NULL,
  \`courier_name\` VARCHAR(100) NOT NULL,
  \`shipping_awb_number\` VARCHAR(100) NULL,
  \`status\` ENUM('WAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'WAITING_PAYMENT',
  \`payment_confirmed_at\` TIMESTAMP NULL,
  \`payment_confirmed_by\` VARCHAR(100) NULL,
  \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

-- Rekening Resmi PT NetSolusions Solusi Teknologi
-- BCA: 8830-1928-33 | Mandiri: 157-00-8839210-4 | BNI: 089-2231-890 | BRI: 0341-01-002891-30-2 | BSI: 718-9201-445`,
    },
    guide: {
      filename: 'PANDUAN_PEMULA_LARAGON.md',
      path: 'PANDUAN_PEMULA_LARAGON_VSCODE.md',
      language: 'markdown',
      content: `# Panduan Cepat Menjalankan di Laragon & VS Code (Pemula)

1. Buka Laragon -> Klik "Start All".
2. Buka HeidiSQL di Laragon -> Buat database: 'netsolusions_tsb'.
3. Import file 'netsolusions_tsb.sql' di HeidiSQL.
4. Buat Laravel di C:\\laragon\\www\\:
   composer create-project laravel/laravel netsolusions-backend
5. Atur .env:
   DB_DATABASE=netsolusions_tsb
   DB_USERNAME=root
   DB_PASSWORD=
6. Jalankan: php artisan serve
7. Buka browser: http://127.0.0.1:8000`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Source Code Proyek Laravel 11 / 12 / 13 (MySQL &amp; TSB)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  PHP 8.2+ / MySQL Laragon
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lengkap dengan Algoritma TSB, Pembayaran Bank &amp; QRIS, 5 Kurir, dan Tracking Tanpa Login.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left file explorer tabs */}
          <div className="w-full md:w-64 border-r border-slate-800 p-3 space-y-1 bg-slate-900/50 overflow-y-auto shrink-0">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">
              File Proyek Laravel &amp; MySQL:
            </div>

            {[
              { id: 'service', label: 'TsbAlgorithmService.php', folder: 'app/Services' },
              { id: 'order_controller', label: 'OrderController.php', folder: 'app/Http/Controllers' },
              { id: 'controller', label: 'InventoryController.php', folder: 'app/Http/Controllers' },
              { id: 'sql_dump', label: 'netsolusions_tsb.sql', folder: 'database (HeidiSQL)' },
              { id: 'migration', label: 'Migration Database.php', folder: 'database/migrations' },
              { id: 'routes', label: 'routes/web.php', folder: 'routes' },
              { id: 'guide', label: 'Panduan Laragon.md', folder: 'Dokumentasi Pemula' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFile(f.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 ${
                  activeFile === f.id
                    ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileCode className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <span className="block truncate font-mono text-[11px]">{f.label}</span>
                  <span className={`block text-[9px] truncate ${activeFile === f.id ? 'text-red-100' : 'text-slate-500'}`}>
                    {f.folder}
                  </span>
                </div>
              </button>
            ))}

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 p-2 space-y-2">
              <span className="font-bold text-white block text-[11px]">Langkah Cepat di Laragon:</span>
              <div className="p-2 rounded-lg bg-slate-800/80 font-mono text-[10px] text-emerald-400 space-y-1">
                <div>1. Laragon: Start All</div>
                <div>2. Import netsolusions_tsb.sql</div>
                <div>3. php artisan serve</div>
              </div>
            </div>
          </div>

          {/* Right code viewer */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <span className="font-mono text-xs text-slate-400">
                {files[activeFile].path}
              </span>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto">
              <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                <code>{files[activeFile].content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            Seluruh file di atas juga telah otomatis disimpan di direktori <strong>/laravel_export/</strong> proyek ini.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
