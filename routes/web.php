<?php

use App\Http\Controllers\Account\CancelBookingController;
use App\Http\Controllers\Account\MyBookingController;
use App\Http\Controllers\Admin\Booking\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\Booking\BookingPaymentController as AdminBookingPaymentController;
use App\Http\Controllers\Admin\Booking\CancelBookingController as AdminCancelBookingController;
use App\Http\Controllers\Admin\Booking\CheckInBookingController as AdminCheckInBookingController;
use App\Http\Controllers\Admin\Booking\WalkInBookingController as AdminWalkInBookingController;
use App\Http\Controllers\Admin\Court\CourtController as AdminCourtController;
use App\Http\Controllers\Admin\Court\CourtPricingController as AdminCourtPricingController;
use App\Http\Controllers\Admin\Customer\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\Dashboard\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\Schedule\SlotBlockController as AdminSlotBlockController;
use App\Http\Controllers\Admin\Setting\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\User\UserController as AdminUserController;
use App\Http\Controllers\Booking\BookingController;
use App\Http\Controllers\Booking\GuestBookingController;
use App\Http\Controllers\Court\CourtController;
use App\Http\Controllers\Home\HomeController;
use App\Http\Controllers\Invoice\InvoiceController;
use App\Http\Controllers\Page\PageController;
use App\Http\Controllers\Payment\MidtransNotificationController;
use App\Http\Controllers\Payment\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Schedule\ScheduleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('courts', [CourtController::class, 'index'])->name('courts.index');
Route::get('courts/{court:slug}', [CourtController::class, 'show'])->name('courts.show');
Route::get('schedule', [ScheduleController::class, 'index'])->name('schedule.index');

Route::get('pricing', [PageController::class, 'pricing'])->name('pricing');
Route::get('about', [PageController::class, 'about'])->name('about');
Route::get('contact', [PageController::class, 'contact'])->name('contact');
Route::get('faq', [PageController::class, 'faq'])->name('faq');
Route::get('terms', [PageController::class, 'terms'])->name('terms');
Route::get('privacy', [PageController::class, 'privacy'])->name('privacy');
Route::get('membership', [PageController::class, 'membership'])->name('membership');

/*
|--------------------------------------------------------------------------
| Booking — tamu & member (tanpa middleware auth)
|--------------------------------------------------------------------------
*/

Route::get('booking', [BookingController::class, 'create'])->name('booking.create');
Route::post('booking', [BookingController::class, 'store'])->middleware('throttle:20,60')->name('booking.store');
Route::get('booking/checkout/{booking:code}', [BookingController::class, 'checkout'])->name('booking.checkout');
Route::post('booking/{booking:code}/pay', [PaymentController::class, 'store'])->middleware('throttle:30,60')->name('booking.pay');
Route::get('booking/{booking:code}/status', [PaymentController::class, 'status'])->name('booking.status');

// Link akses booking tamu dari email; signature Laravel menggantikan login.
Route::get('b/{booking:code}', GuestBookingController::class)->middleware('signed')->name('booking.guest.show');

// Nomor invoice mengandung garis miring (INV/PBS/2026/10/000123), jadi pola route dilebarkan.
Route::get('invoices/{invoice:number}/pdf', [InvoiceController::class, 'pdf'])->where('invoice', 'INV/.*')->name('invoices.pdf');
Route::get('invoices/{invoice:number}', [InvoiceController::class, 'show'])->where('invoice', 'INV/.*')->name('invoices.show');

/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/

// Setelah login: owner/admin → /admin, staff → /staff, customer → /my-bookings (fallback beranda bila halamannya belum ada)
Route::get('/dashboard', function (Request $request) {
    $target = match (true) {
        $request->user()->canAccessAdmin() => 'admin.dashboard',
        $request->user()->isStaff() => 'staff.today',
        default => 'my-bookings.index',
    };

    return redirect()->route(Route::has($target) ? $target : 'home');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('my-bookings', [MyBookingController::class, 'index'])->name('my-bookings.index');
    Route::get('my-bookings/{booking:code}', [MyBookingController::class, 'show'])->name('my-bookings.show');
    Route::post('my-bookings/{booking:code}/cancel', CancelBookingController::class)->name('my-bookings.cancel');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*
|--------------------------------------------------------------------------
| Admin (owner & admin) — menu khusus owner dibatasi lagi dengan role:owner
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:owner,admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

    Route::patch('courts/{court}/toggle', [AdminCourtController::class, 'toggle'])->name('courts.toggle');
    Route::get('courts/{court}/pricing', [AdminCourtPricingController::class, 'edit'])->name('courts.pricing');
    Route::put('courts/{court}/pricing', [AdminCourtPricingController::class, 'update'])->name('courts.pricing.update');
    Route::resource('courts', AdminCourtController::class)->except('show');

    Route::get('bookings', [AdminBookingController::class, 'index'])->name('bookings.index');
    Route::get('bookings/create', [AdminWalkInBookingController::class, 'create'])->name('bookings.create');
    Route::post('bookings', [AdminWalkInBookingController::class, 'store'])->name('bookings.store');
    Route::get('bookings/{booking}', [AdminBookingController::class, 'show'])->name('bookings.show');
    Route::get('bookings/{booking}/payment', [AdminBookingPaymentController::class, 'show'])->name('bookings.payment');
    Route::post('bookings/{booking}/payment', [AdminBookingPaymentController::class, 'store'])->name('bookings.payment.store');
    Route::put('bookings/{booking}/payment', [AdminBookingPaymentController::class, 'update'])->name('bookings.payment.refresh');
    Route::post('bookings/{booking}/cancel', AdminCancelBookingController::class)->name('bookings.cancel');
    Route::post('bookings/{booking}/check-in', AdminCheckInBookingController::class)->name('bookings.check-in');

    Route::get('schedule', [AdminSlotBlockController::class, 'index'])->name('schedule.index');
    Route::post('schedule/blocks', [AdminSlotBlockController::class, 'store'])->name('schedule.blocks.store');
    Route::delete('schedule/blocks/{slotBlock}', [AdminSlotBlockController::class, 'destroy'])->name('schedule.blocks.destroy');

    Route::get('customers', [AdminCustomerController::class, 'index'])->name('customers.index');
    Route::get('customers/{user}', [AdminCustomerController::class, 'show'])->name('customers.show');
    Route::patch('customers/{user}', [AdminCustomerController::class, 'update'])->name('customers.update');
    Route::patch('customers/{user}/block', [AdminCustomerController::class, 'block'])->name('customers.block');

    Route::middleware('role:owner')->group(function () {
        Route::get('settings', [AdminSettingController::class, 'edit'])->name('settings.edit');
        Route::put('settings', [AdminSettingController::class, 'update'])->name('settings.update');

        Route::patch('users/{user}/toggle', [AdminUserController::class, 'toggle'])->name('users.toggle');
        Route::resource('users', AdminUserController::class)->except(['show', 'destroy']);
    });
});

/*
|--------------------------------------------------------------------------
| Webhook Midtrans (tanpa auth & CSRF — divalidasi lewat signature)
|--------------------------------------------------------------------------
*/

Route::post('midtrans/notification', MidtransNotificationController::class)->name('midtrans.notification');

require __DIR__.'/auth.php';
