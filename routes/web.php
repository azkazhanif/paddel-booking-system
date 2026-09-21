<?php

use App\Http\Controllers\Admin\Booking\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\Booking\CancelBookingController as AdminCancelBookingController;
use App\Http\Controllers\Admin\Booking\CheckInBookingController as AdminCheckInBookingController;
use App\Http\Controllers\Admin\Court\CourtController as AdminCourtController;
use App\Http\Controllers\Admin\Customer\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\Dashboard\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\User\UserController as AdminUserController;
use App\Http\Controllers\Home\HomeController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

Route::get('/', [HomeController::class, 'index'])->name('home');

/*
|--------------------------------------------------------------------------
| Customer
|--------------------------------------------------------------------------
*/

// Setelah login: owner/admin → /admin, staff → /staff, customer → /my-bookings (fallback beranda selama halamannya belum ada)
Route::get('/dashboard', function (Request $request) {
    $target = match (true) {
        $request->user()->canAccessAdmin() => 'admin.dashboard',
        $request->user()->isStaff() => 'staff.today',
        default => 'my-bookings.index',
    };

    return redirect()->route(Route::has($target) ? $target : 'home');
})->middleware(['auth', 'verified'])->name('dashboard');

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
    Route::resource('courts', AdminCourtController::class)->except('show');

    Route::get('bookings', [AdminBookingController::class, 'index'])->name('bookings.index');
    Route::get('bookings/{booking}', [AdminBookingController::class, 'show'])->name('bookings.show');
    Route::post('bookings/{booking}/cancel', AdminCancelBookingController::class)->name('bookings.cancel');
    Route::post('bookings/{booking}/check-in', AdminCheckInBookingController::class)->name('bookings.check-in');

    Route::get('customers', [AdminCustomerController::class, 'index'])->name('customers.index');
    Route::get('customers/{user}', [AdminCustomerController::class, 'show'])->name('customers.show');
    Route::patch('customers/{user}', [AdminCustomerController::class, 'update'])->name('customers.update');
    Route::patch('customers/{user}/block', [AdminCustomerController::class, 'block'])->name('customers.block');

    Route::middleware('role:owner')->group(function () {
        Route::patch('users/{user}/toggle', [AdminUserController::class, 'toggle'])->name('users.toggle');
        Route::resource('users', AdminUserController::class)->except(['show', 'destroy']);
    });
});

require __DIR__.'/auth.php';
