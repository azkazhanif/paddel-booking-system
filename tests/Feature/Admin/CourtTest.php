<?php

namespace Tests\Feature\Admin;

use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CourtTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        Storage::fake('public');
    }

    public function test_index_lists_courts(): void
    {
        Court::factory()->count(2)->create();

        $this->actingAs($this->admin)
            ->get(route('admin.courts.index'))
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Courts/Index')->has('courts', 2));
    }

    public function test_store_creates_court_with_auto_slug_and_images(): void
    {
        $this->actingAs($this->admin)
            ->post(route('admin.courts.store'), [
                'name' => 'Court 9 Panoramic',
                'type' => 'indoor',
                'facilities' => ['LED lighting', 'Locker'],
                'base_price' => 275000,
                'is_active' => '1',
                'sort_order' => 9,
                'images' => [UploadedFile::fake()->image('court.jpg')],
            ])
            ->assertRedirect(route('admin.courts.index'));

        $court = Court::query()->with('images')->sole();

        $this->assertSame('court-9-panoramic', $court->slug);
        $this->assertSame(['LED lighting', 'Locker'], $court->facilities);
        $this->assertCount(1, $court->images);
        Storage::disk('public')->assertExists($court->images->first()->path);
    }

    public function test_store_validates_input(): void
    {
        Court::factory()->create(['slug' => 'court-1']);

        $this->actingAs($this->admin)
            ->post(route('admin.courts.store'), ['name' => 'Court 1', 'type' => 'rooftop', 'base_price' => -1, 'is_active' => '1', 'sort_order' => 0])
            ->assertSessionHasErrors(['slug', 'type', 'base_price']);
    }

    public function test_update_can_remove_images(): void
    {
        $court = Court::factory()->create();
        Storage::disk('public')->put('courts/old.jpg', 'x');
        $image = $court->images()->create(['path' => 'courts/old.jpg', 'sort_order' => 1]);

        $this->actingAs($this->admin)
            ->put(route('admin.courts.update', $court), [
                'name' => 'Court Baru',
                'slug' => '',
                'type' => 'outdoor',
                'base_price' => 200000,
                'is_active' => '0',
                'sort_order' => 2,
                'removed_images' => [$image->id],
            ])
            ->assertRedirect(route('admin.courts.index'));

        $court->refresh();
        $this->assertSame('court-baru', $court->slug);
        $this->assertFalse($court->is_active);
        $this->assertDatabaseMissing('court_images', ['id' => $image->id]);
        Storage::disk('public')->assertMissing('courts/old.jpg');
    }

    public function test_toggle_flips_active_status(): void
    {
        $court = Court::factory()->create(['is_active' => true]);

        $this->actingAs($this->admin)->patch(route('admin.courts.toggle', $court))->assertRedirect();

        $this->assertFalse($court->refresh()->is_active);
    }

    public function test_court_with_upcoming_bookings_cannot_be_deleted(): void
    {
        $court = Court::factory()->create();
        Booking::factory()->for($court)->create(['date' => now(Booking::TIMEZONE)->addDays(3)->toDateString()]);

        $this->actingAs($this->admin)->delete(route('admin.courts.destroy', $court))->assertSessionHas('error');
        $this->assertNotSoftDeleted($court);

        $empty = Court::factory()->create();
        $this->actingAs($this->admin)->delete(route('admin.courts.destroy', $empty))->assertRedirect(route('admin.courts.index'));
        $this->assertSoftDeleted($empty);
    }
}
