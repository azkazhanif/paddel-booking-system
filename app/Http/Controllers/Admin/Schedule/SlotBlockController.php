<?php

namespace App\Http\Controllers\Admin\Schedule;

use App\Enums\BlockReason;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Court;
use App\Models\SlotBlock;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Jadwal harian per lapangan: melihat slot terisi dan memblokir slot yang tidak
 * boleh dijual (perawatan, turnamen, acara). BR-11: slot yang sudah dibooking
 * tidak bisa diblokir sebelum bookingnya dibatalkan.
 */
class SlotBlockController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'court_id' => ['nullable', 'integer'],
        ]);

        Booking::expireStale();

        $courts = Court::query()->active()->orderBy('sort_order')->get(['id', 'name', 'type']);
        $date = CarbonImmutable::parse($filters['date'] ?? now(Booking::TIMEZONE)->toDateString(), Booking::TIMEZONE);
        $court = $courts->firstWhere('id', (int) ($filters['court_id'] ?? 0)) ?? $courts->first();

        return Inertia::render('Admin/Schedule/Index', [
            'courts' => $courts,
            'selected' => ['date' => $date->toDateString(), 'court_id' => $court?->id],
            'slots' => fn () => $court ? $this->slots($court, $date) : [],
            'blocks' => fn () => SlotBlock::query()
                ->with('court:id,name', 'creator:id,name')
                ->whereDate('date', $date->toDateString())
                ->orderBy('start_time')
                ->get()
                ->map(fn (SlotBlock $block) => [
                    'id' => $block->id,
                    'court' => $block->court?->only(['id', 'name']),
                    'start_time' => $block->start_time,
                    'end_time' => $block->end_time,
                    'reason' => $block->reason->value,
                    'note' => $block->note,
                    'created_by' => $block->creator?->name,
                ]),
            'reasons' => array_map(fn (BlockReason $reason) => [
                'value' => $reason->value,
                'label' => match ($reason) {
                    BlockReason::Maintenance => 'Perawatan',
                    BlockReason::Event => 'Acara',
                    BlockReason::Tournament => 'Turnamen',
                    BlockReason::Other => 'Lainnya',
                },
            ], BlockReason::cases()),
            'today' => now(Booking::TIMEZONE)->toDateString(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'court_id' => ['required', Rule::exists('courts', 'id')->whereNull('deleted_at')],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.now(Booking::TIMEZONE)->toDateString()],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'reason' => ['required', Rule::enum(BlockReason::class)],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $start = $validated['start_time'].':00';
        $end = $validated['end_time'].':00';

        DB::transaction(function () use ($request, $validated, $start, $end) {
            // BR-11: slot yang masih dipegang booking aktif tidak boleh diblokir.
            $clash = Booking::query()
                ->active()
                ->whereHas('items', fn ($query) => $query
                    ->where('court_id', $validated['court_id'])
                    ->whereDate('date', $validated['date'])
                    ->where('is_active', true)
                    ->where('start_time', '<', $end)
                    ->where('end_time', '>', $start))
                ->first();

            if ($clash) {
                throw ValidationException::withMessages([
                    'start_time' => "Masih ada booking {$clash->code} pada rentang jam itu. Batalkan dulu bookingnya.",
                ]);
            }

            SlotBlock::create([
                ...$validated,
                'start_time' => $start,
                'end_time' => $end,
                'created_by' => $request->user()->id,
            ]);
        });

        ActivityLog::record('schedule.blocked', null, $validated);

        return back()->with('success', 'Slot diblokir.');
    }

    public function destroy(SlotBlock $slotBlock)
    {
        $slotBlock->delete();

        ActivityLog::record('schedule.unblocked', null, [
            'court_id' => $slotBlock->court_id,
            'date' => $slotBlock->date->toDateString(),
            'start_time' => $slotBlock->start_time,
        ]);

        return back()->with('success', 'Blokir slot dihapus.');
    }

    /**
     * Slot hari itu beserta status dan kode booking yang mengisinya.
     *
     * @return list<array<string, mixed>>
     */
    protected function slots(Court $court, CarbonImmutable $date): array
    {
        $bookings = Booking::query()
            ->active()
            ->whereHas('items', fn ($query) => $query->activeOn($court->id, $date->toDateString()))
            ->with(['items' => fn ($query) => $query->activeOn($court->id, $date->toDateString())])
            ->get(['id', 'code', 'customer_name', 'status']);

        $byStart = [];

        foreach ($bookings as $booking) {
            foreach ($booking->items as $item) {
                $byStart[$item->start_time] = [
                    'code' => $booking->code,
                    'customer_name' => $booking->customer_name,
                    'status' => $booking->status->value,
                    'id' => $booking->id,
                ];
            }
        }

        return array_map(fn (array $slot) => [
            ...$slot,
            'booking' => $byStart[$slot['start_time']] ?? null,
        ], $court->slotsOn($date));
    }
}
