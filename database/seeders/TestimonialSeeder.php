<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    /**
     * Data contoh untuk lokal/staging — jangan dijalankan di production.
     */
    public function run(): void
    {
        $testimonials = [
            ['Rina A.', 'Main 2x seminggu', 'Cek slot kosong jam 7 malam sekarang cuma butuh beberapa detik. Bayar pakai QRIS langsung beres.', 5],
            ['Dimas P.', 'Kapten komunitas', 'DP 30% bikin kami bisa amankan lapangan seminggu sebelumnya tanpa harus patungan penuh dulu.', 5],
            ['Andre S.', 'Pemain baru', 'Booking tanpa bikin akun, e-ticket langsung masuk email. Simpel banget.', 5],
            ['Maya K.', 'Pemain rutin', 'Lapangan panoramic-nya juara, dan jadwalnya selalu akurat.', 5],
            ['Fajar R.', 'Karyawan', 'Pengingat pelunasan sangat membantu, tidak pernah lupa bayar sisa DP.', 4],
            ['Sinta W.', 'Pemain weekend', 'UI-nya enak dipakai di HP, dari pilih jam sampai bayar kurang dari 3 menit.', 5],
        ];

        foreach ($testimonials as $index => [$name, $role, $content, $rating]) {
            Testimonial::query()->updateOrCreate(
                ['name' => $name],
                ['role' => $role, 'content' => $content, 'rating' => $rating, 'is_published' => true, 'sort_order' => $index + 1],
            );
        }
    }
}
