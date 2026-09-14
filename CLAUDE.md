# CLAUDE.md — PBS (Paddel Booking System)

Panduan kerja untuk Claude dan developer di repo ini. Kebutuhan produk lengkap ada di [PRD.md](PRD.md). **Jika ada perbedaan konvensi kode/styling antara PRD.md dan file ini, ikuti CLAUDE.md.**

## Ringkasan Proyek

PBS adalah aplikasi booking lapangan padel:
- **Guest** bisa booking tanpa akun → wajib bayar penuh → link bayar, invoice & e-ticket dikirim via email.
- **Member** (login) bisa bayar penuh atau **DP 30%**, lalu melunasi sebelum main.
- Pembayaran realtime via **Midtrans** (Snap + webhook).
- **Admin/Owner** mengelola lapangan, harga, jadwal, booking, customer, dan melihat analitik.
- **Homepage** premium dengan banyak animasi scroll GSAP.

## Tech Stack

- Laravel 12 (PHP 8.2+), Inertia.js 2, React (`.jsx`, bukan TypeScript), Ziggy (`route()` di JS)
- Tailwind CSS v4 + **shadcn/ui** (`resources/js/Components/ui`), ikon `lucide-react`
- **GSAP 3** + `@gsap/react` (ScrollTrigger, SplitText, ScrollSmoother, Flip, DrawSVG)
- Midtrans (`midtrans/midtrans-php`), dompdf (invoice), Laravel Queue & Scheduler
- DB: SQLite (lokal), MySQL/PostgreSQL (production)

## Perintah

```bash
composer dev                      # server + queue + logs + vite sekaligus
composer test                     # jalankan seluruh test
php artisan test --filter=Booking # test spesifik
php artisan migrate:fresh --seed  # reset DB dengan data contoh
./vendor/bin/pint                 # format kode PHP
npm run build                     # build aset production
npx shadcn@latest add button card # tambah komponen shadcn
```

---

## Backend

### Controller per Fitur

- Controller dikelompokkan **per fitur** dalam folder masing-masing. Satu controller = satu fitur/resource, method mengikuti konvensi resource (`index`, `show`, `create`, `store`, `edit`, `update`, `destroy`). Aksi di luar CRUD boleh dijadikan controller invokable kecil di folder fitur yang sama.
- **Controller memanggil Eloquent model secara langsung.** Jangan membuat Repository, Service layer, atau Action class.
- Validasi langsung di controller dengan `$request->validate([...])`.
- Logika yang dipakai di lebih dari satu controller (hitung harga, hitung DP, cek ketersediaan) ditaruh sebagai **method/scope di model**, bukan di class service terpisah.
- Operasi yang menyentuh slot/pembayaran wajib dibungkus `DB::transaction()` dengan `lockForUpdate()`.
- Controller mengembalikan `Inertia::render('Fitur/Halaman', [...])` atau `redirect()->route(...)`; API internal mengembalikan `response()->json()`.

Struktur:

```
app/Http/Controllers/
├── Home/HomeController.php
├── Court/CourtController.php
├── Schedule/ScheduleController.php
├── Page/PageController.php                  # about, faq, contact, terms, privacy, membership
├── Booking/
│   ├── BookingController.php                # create, store, checkout
│   ├── GuestBookingController.php           # /b/{code} signed
│   └── BookingLookupController.php
├── Payment/
│   ├── PaymentController.php                # buat Snap token, halaman status
│   ├── SettlementController.php             # pelunasan DP
│   └── MidtransNotificationController.php   # webhook
├── Invoice/InvoiceController.php
├── Account/
│   ├── ProfileController.php
│   └── MyBookingController.php
├── Staff/CheckInController.php
├── Admin/
│   ├── Dashboard/DashboardController.php
│   ├── Court/CourtController.php
│   ├── Court/CourtPricingController.php
│   ├── Schedule/SlotBlockController.php
│   ├── Booking/BookingController.php
│   ├── Customer/CustomerController.php
│   ├── Payment/PaymentController.php
│   ├── Receivable/ReceivableController.php
│   ├── Report/ReportController.php
│   └── Setting/SettingController.php
└── Auth/                                    # bawaan Breeze, jangan dipindah
```

Contoh gaya yang diharapkan:

```php
namespace App\Http\Controllers\Admin\Court;

use App\Http\Controllers\Controller;
use App\Models\Court;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourtController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Courts/Index', [
            'courts' => Court::query()
                ->with('images')
                ->withCount('bookings')
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', 'in:indoor,outdoor'],
            'base_price' => ['required', 'integer', 'min:0'],
        ]);

        Court::create($validated);

        return redirect()->route('admin.courts.index')->with('success', 'Lapangan ditambahkan.');
    }
}
```

### Routes

- `routes/web.php` dikelompokkan per area: public, booking (guest & member), customer (`auth`, `verified`), staff (`role:staff,admin`), admin (`role:admin`, prefix `admin`, name `admin.`).
- Semua route wajib bernama; nama & URI mengikuti tabel di PRD.md §7.2.
- Webhook Midtrans dikecualikan dari CSRF di `bootstrap/app.php`.

### Model & Relationship

- Setiap relasi didefinisikan dengan return type (`: HasMany`, `: BelongsTo`, dst.).
- Gunakan method `casts()` (gaya Laravel 12), `$fillable` eksplisit, dan **PHP Enum** di `app/Enums` untuk status.
- Query yang berulang dijadikan **local scope** (`scopeAvailable`, `scopeUpcoming`, `scopeUnsettled`).
- Hindari N+1: selalu `with()` / `withCount()`; aktifkan `Model::preventLazyLoading(! app()->isProduction())` di `AppServiceProvider`.
- Uang disimpan sebagai **integer rupiah** (tanpa desimal).

| Model          | Relasi                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `User`         | `bookings(): HasMany` · `payments(): HasManyThrough(Payment, Booking)` · `invoices(): HasManyThrough(Invoice, Booking)`                  |
| `Court`        | `images(): HasMany(CourtImage)` · `priceRules(): HasMany` · `specialPrices(): HasMany` · `slotBlocks(): HasMany` · `bookings(): HasMany` · `bookingItems(): HasMany` |
| `CourtImage`   | `court(): BelongsTo`                                                                                                                    |
| `PriceRule`    | `court(): BelongsTo`                                                                                                                    |
| `SpecialPrice` | `court(): BelongsTo` (nullable = berlaku semua lapangan)                                                                                |
| `SlotBlock`    | `court(): BelongsTo` · `creator(): BelongsTo(User, 'created_by')`                                                                       |
| `Booking`      | `user(): BelongsTo` (nullable untuk guest) · `court(): BelongsTo` · `items(): HasMany(BookingItem)` · `payments(): HasMany` · `latestPayment(): HasOne->latestOfMany()` · `invoice(): HasOne` · `reminders(): HasMany(PaymentReminder)` · `voucher(): BelongsTo` · `checkedInBy(): BelongsTo(User, 'checked_in_by')` |
| `BookingItem`  | `booking(): BelongsTo` · `court(): BelongsTo`                                                                                           |
| `Payment`      | `booking(): BelongsTo` · `logs(): HasMany(PaymentLog)` · `recordedBy(): BelongsTo(User, 'recorded_by')`                                  |
| `PaymentLog`   | `payment(): BelongsTo`                                                                                                                  |
| `Invoice`      | `booking(): BelongsTo`                                                                                                                  |
| `PaymentReminder` | `booking(): BelongsTo`                                                                                                               |
| `Voucher`      | `bookings(): HasMany`                                                                                                                   |
| `ActivityLog`  | `user(): BelongsTo` · `subject(): MorphTo`                                                                                              |

Enum di `app/Enums`: `UserRole`, `BookingStatus`, `PaymentStatus`, `PaymentOption` (`full`/`dp`), `PaymentType` (`full`/`dp`/`settlement`/`offline`), `CustomerType` (`guest`/`member`), `CourtType`.

Contoh helper bisnis di model (bukan service):

```php
// App\Models\Court
public function priceAt(CarbonInterface $date, string $startTime): int { /* special price > price rule > base_price */ }

// App\Models\Booking
public function dpAmount(): int { return (int) ceil($this->total * $this->dp_percentage / 100 / 1000) * 1000; }
public function isGuest(): bool { return $this->customer_type === CustomerType::Guest; }
public function scopeUnsettled(Builder $query): void { $query->where('payment_status', PaymentStatus::DpPaid); }
```

### Aturan Bisnis Kritis (jangan dilanggar)

- Harga, DP, dan sisa tagihan **selalu dihitung ulang di server**; jangan percaya nilai dari client.
- Guest tidak boleh memakai opsi DP (validasi di server).
- Status pembayaran hanya berubah dari webhook Midtrans yang signature-nya valid + dicek ulang via Status API, atau dari pencatatan offline oleh staff/admin.
- Double booking dicegah dengan unique index `booking_items (court_id, date, start_time, is_active)` + transaction lock.
- Zona waktu `Asia/Jakarta`.

### Testing

- Setiap fitur baru wajib punya Feature test di `tests/Feature/{Fitur}/`.
- Wajib diuji: booking guest & member, perhitungan harga & DP, webhook (valid, signature salah, duplikat, amount tidak cocok), expire/no-show scheduler, otorisasi role.
- Jangan memanggil API Midtrans asli di test — gunakan `Http::fake()`.

---

## Frontend

### Component-Based First

**Buat komponen reusable dulu, baru halaman.** Page hanya menyusun komponen dan meneruskan props dari Inertia.

Alur saat membuat halaman baru:
1. Cek komponen yang sudah ada di `resources/js/Components`.
2. Jika belum ada, buat komponen generik (props jelas, tanpa data hardcode, tanpa panggilan API di dalamnya kecuali memang fungsinya).
3. Pola UI yang muncul **2 kali atau lebih** wajib diekstrak menjadi komponen.
4. Susun page dari komponen tersebut.

Struktur:

```
resources/js/
├── Components/
│   ├── ui/            # shadcn/ui (hasil CLI) — boleh disesuaikan style-nya
│   ├── common/        # Container, Section, SectionHeading, BentoGrid, BentoCard, PageHeader,
│   │                  # StatusBadge, PriceTag, EmptyState, Logo, Pagination
│   ├── animation/     # Reveal, SplitHeading, ParallaxImage, ImageReveal, Marquee,
│   │                  # MagneticButton, PinnedHorizontal, CountUp, StackCards, SmoothScroll, Cursor
│   ├── home/          # section homepage: Hero, CourtsShowcase, HowItWorks, MemberBenefits, dst.
│   ├── booking/       # DateScroller, CourtPicker, SlotGrid, GuestForm, PaymentOptionCard,
│   │                  # PaymentSummary, CountdownTimer, ETicket
│   ├── invoice/       # InvoiceView
│   └── admin/         # KpiCard, ChartCard, DataTable, FilterBar, OccupancyHeatmap
├── Layouts/           # PublicLayout, AppLayout (member), AdminLayout, GuestLayout (auth)
├── Pages/             # mengikuti nama di Inertia::render, mis. Pages/Booking/Create.jsx
├── hooks/             # useCountdown, useAvailability, useMediaQuery
└── lib/               # gsap.js (register plugin), utils.js (cn), format.js (rupiah, tanggal)
```

Konvensi:
- Nama file & komponen **PascalCase**, satu komponen utama per file, `export default`.
- Terima `className` dan gabungkan dengan `cn()` agar komponen fleksibel.
- Form memakai `useForm` dari `@inertiajs/react`; navigasi memakai `<Link>` + `route()`.
- Format uang/tanggal hanya lewat `lib/format.js` (`formatRupiah(350000)` → `Rp350.000`).
- Teks UI berbahasa Indonesia.

### Styling

- **Modern, clean, kontras tinggi**: dasar hitam (`ink-950`), teks `bone-50`, aksen hijau (`court-500`) dipakai hemat. Palet lengkap di PRD.md §13.2.
- **Font sans-serif saja**: `font-display` (Clash Grotesk / Inter Tight) untuk heading besar, `font-sans` (Plus Jakarta Sans) untuk body. Jangan memakai font serif.
- **Radius hanya dua jenis:**
  - `rounded-md` → card, bento cell, input, select, dialog, sheet, gambar, tabel, dropdown.
  - `rounded-full` → button, badge, chip slot, avatar, toggle, pill navigasi, custom cursor.
  - **Jangan** memakai `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, atau `rounded-none` pada komponen baru. Set `--radius: 0.375rem` pada tema shadcn agar komponen `ui/` konsisten.
- **Bento grid** sebagai pola layout utama untuk: fitur/keunggulan, stats, courts showcase, member benefits, gallery, ringkasan profil, dan KPI admin dashboard.
  - Gunakan komponen `BentoGrid` + `BentoCard`, jangan menulis grid bento manual di page.
  - Dasar grid: `grid grid-cols-1 gap-3 md:grid-cols-6 lg:grid-cols-12 md:gap-4 grid-flow-dense`.
  - Ukuran cell lewat prop, mis. `<BentoCard colSpan={{ md: 3, lg: 8 }} rowSpan={2}>`; di mobile semua cell menjadi 1 kolom.
  - Variasikan isi cell (angka besar, foto full-bleed, ikon + teks, mini chart) dan warna latar (`ink-900`, `court-500`, foto) agar terasa hidup.
- Spasi longgar: section `py-24 md:py-32`, container `max-w-7xl mx-auto px-4 md:px-6`.
- Mobile-first, wajib rapi di lebar 375px.

### Animasi GSAP (Homepage)

Referensi gaya: **landonorris.com** — tipografi raksasa yang bergerak, transisi scroll yang halus dan sinematik, reveal gambar dramatis, section yang di-pin, serta interaksi kursor yang playful.

Aturan:
- **Setiap section homepage memiliki animasi yang dipicu scroll** (ScrollTrigger). Tidak ada section yang muncul statis.
- Smooth scroll global dengan ScrollSmoother di homepage.
- Pola yang dipakai:
  - Heading besar uppercase dengan **SplitText** (reveal per karakter/baris dengan mask).
  - **Image reveal** dengan `clip-path` + scale, dan parallax pada foto.
  - **Pinned section**: horizontal scroll untuk daftar lapangan, langkah How It Works yang di-scrub.
  - **Stacked/sticky cards** yang bertumpuk saat scroll.
  - **Marquee** yang kecepatan & kemiringannya mengikuti velocity scroll.
  - **Pergantian warna latar** hitam ↔ hijau antar section saat scroll.
  - Bento cell masuk dengan stagger + sedikit scale.
  - Counter angka, magnetic button, custom cursor (desktop).
- Animasi dibungkus **komponen di `Components/animation`** (mis. `<Reveal>`, `<SplitHeading>`, `<PinnedHorizontal>`), lalu dipakai ulang di section — jangan menulis timeline GSAP panjang langsung di page.
- Selalu gunakan `useGSAP(() => { ... }, { scope: ref })` agar cleanup otomatis saat navigasi Inertia.
- Registrasi plugin **hanya** di `resources/js/lib/gsap.js`, import `gsap` dari file itu.
- Animasikan hanya `transform`, `opacity`, dan `clip-path`.
- Gunakan `gsap.matchMedia()`: `prefers-reduced-motion` → cukup fade; mobile → matikan pin horizontal, parallax dikurangi, cursor dimatikan.
- Panggil `ScrollTrigger.refresh()` setelah gambar/font dimuat.
- Halaman selain homepage cukup micro-interaction ringan (hover, transisi step, toast); dashboard admin tanpa animasi scroll.

---

## Hal yang Harus Dihindari

- Membuat Repository/Service/Action class — panggil model langsung dari controller.
- Controller "gemuk" yang mencampur beberapa fitur dalam satu file.
- Menulis UI berulang di page tanpa diekstrak menjadi komponen.
- Radius selain `rounded-md` / `rounded-full`; font serif.
- Menaruh logika harga/DP di frontend sebagai sumber kebenaran.
- Menyimpan secret Midtrans (server key) di kode frontend atau commit `.env`.
- Mengubah file bawaan Breeze di `Controllers/Auth` tanpa kebutuhan jelas.
