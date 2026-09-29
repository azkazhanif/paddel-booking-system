<?php

namespace App\Http\Controllers\Admin\Court;

use App\Enums\PriceLabel;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\OperatingHour;
use App\Models\PriceRule;
use App\Models\SpecialPrice;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Harga per lapangan: harga dasar, aturan hari/jam, dan harga khusus tanggal.
 * Prioritas saat booking (BR-07): harga khusus tanggal > aturan hari/jam > harga dasar.
 */
class CourtPricingController extends Controller
{
    public function edit(Court $court)
    {
        $court->load(['priceRules' => fn ($query) => $query->orderBy('start_time'), 'specialPrices' => fn ($query) => $query->orderBy('date')]);

        return Inertia::render('Admin/Courts/Pricing', [
            'court' => [
                'id' => $court->id,
                'name' => $court->name,
                'base_price' => $court->base_price,
            ],
            'rules' => $court->priceRules->map(fn (PriceRule $rule) => [
                'id' => $rule->id,
                'label' => $rule->label->value,
                'days_of_week' => array_map('intval', $rule->days_of_week),
                'start_time' => substr($rule->start_time, 0, 5),
                'end_time' => substr($rule->end_time, 0, 5),
                'price' => $rule->price,
                'is_active' => $rule->is_active,
            ]),
            'specialPrices' => $court->specialPrices->map(fn (SpecialPrice $special) => [
                'id' => $special->id,
                'date' => $special->date->toDateString(),
                'start_time' => $special->start_time ? substr($special->start_time, 0, 5) : '',
                'end_time' => $special->end_time ? substr($special->end_time, 0, 5) : '',
                'price' => $special->price,
                'note' => $special->note,
            ]),
            'labels' => array_map(fn (PriceLabel $label) => ['value' => $label->value, 'label' => match ($label) {
                PriceLabel::OffPeak => 'Off-peak',
                PriceLabel::Peak => 'Peak',
                PriceLabel::Weekend => 'Weekend',
                PriceLabel::Custom => 'Custom',
            }], PriceLabel::cases()),
            'preview' => $this->weeklyPreview($court),
        ]);
    }

    public function update(Request $request, Court $court)
    {
        $validated = $request->validate([
            'base_price' => ['required', 'integer', 'min:0', 'max:10000000'],
            'rules' => ['present', 'array', 'max:20'],
            'rules.*.id' => ['nullable', 'integer'],
            'rules.*.label' => ['required', Rule::enum(PriceLabel::class)],
            'rules.*.days_of_week' => ['required', 'array', 'min:1'],
            'rules.*.days_of_week.*' => ['integer', 'between:1,7'],
            'rules.*.start_time' => ['required', 'date_format:H:i'],
            'rules.*.end_time' => ['required', 'date_format:H:i', 'after:rules.*.start_time'],
            'rules.*.price' => ['required', 'integer', 'min:0', 'max:10000000'],
            'rules.*.is_active' => ['required', 'boolean'],
            'special_prices' => ['present', 'array', 'max:50'],
            'special_prices.*.id' => ['nullable', 'integer'],
            'special_prices.*.date' => ['required', 'date_format:Y-m-d'],
            'special_prices.*.start_time' => ['nullable', 'date_format:H:i', 'required_with:special_prices.*.end_time'],
            'special_prices.*.end_time' => ['nullable', 'date_format:H:i', 'after:special_prices.*.start_time', 'required_with:special_prices.*.start_time'],
            'special_prices.*.price' => ['required', 'integer', 'min:0', 'max:10000000'],
            'special_prices.*.note' => ['nullable', 'string', 'max:150'],
        ]);

        $this->assertNoOverlap($validated['rules']);

        DB::transaction(function () use ($court, $validated) {
            $court->update(['base_price' => $validated['base_price']]);

            $this->sync($court, 'priceRules', $validated['rules'], fn (array $rule) => [
                'label' => $rule['label'],
                'days_of_week' => array_values(array_unique(array_map('intval', $rule['days_of_week']))),
                'start_time' => $rule['start_time'].':00',
                'end_time' => $rule['end_time'].':00',
                'price' => $rule['price'],
                'is_active' => $rule['is_active'],
            ]);

            $this->sync($court, 'specialPrices', $validated['special_prices'], fn (array $special) => [
                'date' => $special['date'],
                'start_time' => $special['start_time'] ? $special['start_time'].':00' : null,
                'end_time' => $special['end_time'] ? $special['end_time'].':00' : null,
                'price' => $special['price'],
                'note' => $special['note'] ?? null,
            ]);
        });

        return redirect()->route('admin.courts.pricing', $court)->with('success', 'Harga lapangan diperbarui.');
    }

    /**
     * Simpan baris baru, perbarui yang ada, hapus baris yang tidak lagi dikirim.
     * Relasi diambil ulang tiap query karena constraint where menempel pada instance yang sama.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    protected function sync(Court $court, string $relation, array $rows, callable $attributes): void
    {
        $keptIds = [];

        foreach ($rows as $row) {
            $model = $row['id']
                ? $court->{$relation}()->whereKey($row['id'])->firstOrFail()
                : $court->{$relation}()->make();

            $model->fill($attributes($row));
            $court->{$relation}()->save($model);

            $keptIds[] = $model->id;
        }

        $court->{$relation}()->whereKeyNot($keptIds)->delete();
    }

    /**
     * Dua aturan tidak boleh menumpuk pada hari & jam yang sama (BR-07).
     *
     * @param  array<int, array<string, mixed>>  $rules
     */
    protected function assertNoOverlap(array $rules): void
    {
        foreach ($rules as $index => $rule) {
            if (! $rule['is_active']) {
                continue;
            }

            foreach (array_slice($rules, 0, $index, true) as $otherIndex => $other) {
                $sharesDay = array_intersect(array_map('intval', $rule['days_of_week']), array_map('intval', $other['days_of_week']));

                if ($other['is_active'] && $sharesDay && $rule['start_time'] < $other['end_time'] && $other['start_time'] < $rule['end_time']) {
                    throw ValidationException::withMessages([
                        "rules.{$index}.start_time" => 'Rentang jam ini bertabrakan dengan aturan nomor '.($otherIndex + 1).' pada hari yang sama.',
                    ]);
                }
            }
        }
    }

    /**
     * Tabel harga hasil kombinasi aturan: Senin–Minggu × jam operasional.
     *
     * @return array{hours: list<int>, rows: list<array{day: int, prices: list<int>}>}
     */
    protected function weeklyPreview(Court $court): array
    {
        $hours = OperatingHour::query()->get()->keyBy('day_of_week');
        $open = $hours->where('is_closed', false);

        if ($open->isEmpty()) {
            return ['hours' => [], 'rows' => []];
        }

        $range = range((int) substr($open->min('open_time'), 0, 2), (int) substr($open->max('close_time'), 0, 2) - 1);

        // Tanggal contoh: minggu depan, supaya harga khusus tanggal tidak ikut mempengaruhi preview aturan rutin
        $monday = CarbonImmutable::now(Booking::TIMEZONE)->startOfWeek()->addWeek();

        return [
            'hours' => $range,
            'rows' => collect(range(1, 7))->map(function (int $day) use ($court, $hours, $monday, $range) {
                $date = $monday->addDays($day - 1);
                $operating = $hours->get($day);

                return [
                    'day' => $day,
                    'prices' => array_map(function (int $hour) use ($court, $date, $operating) {
                        $time = sprintf('%02d:00:00', $hour);

                        if (! $operating || $operating->is_closed || $time < $operating->open_time || $time >= $operating->close_time) {
                            return null;
                        }

                        return $court->priceAt($date, $time);
                    }, $range),
                ];
            })->all(),
        ];
    }
}
