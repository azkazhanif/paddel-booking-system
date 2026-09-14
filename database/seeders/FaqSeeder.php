<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            ['Apakah harus punya akun untuk booking?', 'Tidak. Kamu bisa booking sebagai tamu dengan nama, email, dan nomor WhatsApp, lalu bayar penuh. Link pembayaran, invoice, dan e-ticket dikirim ke email.', true],
            ['Apa keuntungan menjadi member?', 'Member bisa mengamankan slot cukup dengan DP 30%, menyimpan riwayat booking dan invoice, serta checkout lebih cepat.', true],
            ['Metode pembayaran apa saja yang tersedia?', 'Pembayaran diproses oleh Midtrans: QRIS, GoPay, ShopeePay, virtual account BCA, BNI, BRI, Mandiri, Permata, dan kartu kredit.', true],
            ['Kapan sisa pembayaran DP harus dilunasi?', 'Paling lambat 3 jam sebelum jam main secara online, atau di lokasi sebelum check-in.', true],
            ['Berapa lama slot ditahan saat checkout?', 'Slot ditahan 15 menit. Jika belum dibayar, slot otomatis dilepas.', false],
            ['Bisakah booking dibatalkan?', 'Member bisa membatalkan booking paling lambat 24 jam sebelum jam main. Tamu dapat menghubungi admin via WhatsApp.', false],
            ['Apakah tersedia sewa raket?', 'Raket dan bola dapat disewa langsung di resepsionis.', false],
            ['Berapa jumlah pemain per lapangan?', 'Satu lapangan padel ideal untuk 4 pemain (2 lawan 2).', false],
        ];

        foreach ($faqs as $index => [$question, $answer, $showOnHome]) {
            Faq::query()->updateOrCreate(
                ['question' => $question],
                ['answer' => $answer, 'show_on_home' => $showOnHome, 'is_published' => true, 'sort_order' => $index + 1],
            );
        }
    }
}
