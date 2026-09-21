<?php

namespace App\Http\Controllers\Admin\Court;

use App\Enums\BookingStatus;
use App\Enums\CourtType;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Court;
use App\Models\CourtImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CourtController extends Controller
{
    public function index()
    {
        $today = now(Booking::TIMEZONE);

        return Inertia::render('Admin/Courts/Index', [
            'courts' => Court::query()
                ->with('coverImage')
                ->withCount(['bookings as month_bookings_count' => fn ($query) => $query
                    ->whereBetween('date', [$today->copy()->startOfMonth()->toDateString(), $today->copy()->endOfMonth()->toDateString()])
                    ->whereIn('status', [BookingStatus::Confirmed, BookingStatus::CheckedIn, BookingStatus::Completed])])
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Court $court) => [
                    'id' => $court->id,
                    'name' => $court->name,
                    'slug' => $court->slug,
                    'type' => $court->type->value,
                    'surface' => $court->surface,
                    'base_price' => $court->base_price,
                    'is_active' => $court->is_active,
                    'month_bookings_count' => $court->month_bookings_count,
                    'image' => $court->coverImage ? Storage::url($court->coverImage->path) : null,
                ]),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Courts/Form', [
            'court' => null,
            'types' => CourtType::values(),
            'nextSortOrder' => (int) Court::query()->max('sort_order') + 1,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateCourt($request);

        DB::transaction(function () use ($request, $validated) {
            $court = Court::create($this->courtAttributes($validated));

            $this->storeImages($request, $court);
        });

        return redirect()->route('admin.courts.index')->with('success', 'Lapangan ditambahkan.');
    }

    public function edit(Court $court)
    {
        $court->load('images');

        return Inertia::render('Admin/Courts/Form', [
            'court' => [
                ...$court->only(['id', 'name', 'slug', 'surface', 'description', 'rules', 'base_price', 'is_active', 'sort_order']),
                'type' => $court->type->value,
                'facilities' => $court->facilities ?? [],
                'images' => $court->images->map(fn (CourtImage $image) => [
                    'id' => $image->id,
                    'url' => Storage::url($image->path),
                    'alt' => $image->alt,
                ]),
            ],
            'types' => CourtType::values(),
            'nextSortOrder' => $court->sort_order,
        ]);
    }

    public function update(Request $request, Court $court)
    {
        $validated = $this->validateCourt($request, $court);

        $removedPaths = DB::transaction(function () use ($request, $validated, $court) {
            $court->update($this->courtAttributes($validated));

            $removed = $court->images()->whereIn('id', $validated['removed_images'] ?? [])->get();
            CourtImage::query()->whereKey($removed->modelKeys())->delete();

            $this->storeImages($request, $court);

            return $removed->pluck('path')->all();
        });

        // File dihapus setelah commit agar foto tidak hilang bila transaksi gagal
        Storage::disk('public')->delete($removedPaths);

        return redirect()->route('admin.courts.index')->with('success', 'Lapangan diperbarui.');
    }

    public function toggle(Court $court)
    {
        $court->update(['is_active' => ! $court->is_active]);

        return back()->with('success', $court->is_active ? "{$court->name} diaktifkan." : "{$court->name} dinonaktifkan.");
    }

    public function destroy(Court $court)
    {
        $hasUpcoming = $court->bookings()->upcoming()->active()->exists();

        if ($hasUpcoming) {
            return back()->with('error', 'Lapangan masih punya booking mendatang. Batalkan atau pindahkan booking tersebut dulu, atau nonaktifkan lapangan.');
        }

        $court->delete();

        return redirect()->route('admin.courts.index')->with('success', 'Lapangan dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function validateCourt(Request $request, ?Court $court = null): array
    {
        $request->merge(['slug' => Str::slug($request->input('slug') ?: $request->input('name', ''))]);

        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:120', Rule::unique('courts', 'slug')->ignore($court)],
            'type' => ['required', Rule::enum(CourtType::class)],
            'surface' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:2000'],
            'rules' => ['nullable', 'string', 'max:2000'],
            'facilities' => ['nullable', 'array', 'max:12'],
            'facilities.*' => ['string', 'max:40', 'distinct'],
            'base_price' => ['required', 'integer', 'min:0', 'max:10000000'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:1000'],
            'images' => ['nullable', 'array', 'max:8'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'removed_images' => ['nullable', 'array'],
            'removed_images.*' => ['integer'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    protected function courtAttributes(array $validated): array
    {
        return [
            ...collect($validated)->except(['images', 'removed_images'])->all(),
            'facilities' => array_values($validated['facilities'] ?? []),
        ];
    }

    protected function storeImages(Request $request, Court $court): void
    {
        $sortOrder = (int) $court->images()->max('sort_order');

        foreach ($request->file('images', []) as $file) {
            $court->images()->create([
                'path' => $file->store("courts/{$court->id}", 'public'),
                'alt' => $court->name,
                'sort_order' => ++$sortOrder,
            ]);
        }
    }
}
