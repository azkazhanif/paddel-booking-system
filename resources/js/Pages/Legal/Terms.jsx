import LegalDocument from '@/Components/common/LegalDocument';
import PageHero from '@/Components/common/PageHero';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatDate, formatRupiah } from '@/lib/format';
import { Head } from '@inertiajs/react';

export default function Terms({ venue, policy, updatedAt }) {
    const sections = [
        {
            id: 'umum',
            title: 'Ketentuan umum',
            paragraphs: [
                `Dengan membuat booking di ${venue.name}, kamu dianggap membaca dan menyetujui ketentuan ini. Seluruh waktu yang disebut di sini memakai zona waktu WIB (Asia/Jakarta).`,
                'Kami dapat memperbarui ketentuan ini sewaktu-waktu. Booking yang sudah dibuat tetap tunduk pada ketentuan yang berlaku saat booking dibuat.',
            ],
        },
        {
            id: 'booking',
            title: 'Pemesanan lapangan',
            items: [
                `Satu slot berdurasi ${policy.slot_minutes} menit. Satu booking maksimal ${policy.max_slots} slot berurutan pada lapangan dan tanggal yang sama.`,
                `Booking dapat dibuat untuk hari ini hingga ${policy.advance_days} hari ke depan.`,
                policy.guest_enabled
                    ? 'Booking bisa dibuat tanpa akun (tamu) dengan kewajiban membayar penuh, atau dengan akun member.'
                    : 'Untuk sementara booking hanya dapat dibuat oleh pengguna yang memiliki akun.',
                'Harga dihitung ulang oleh sistem saat booking dibuat berdasarkan tanggal dan jam yang dipilih. Harga yang tersimpan pada booking tidak berubah meski daftar harga diperbarui kemudian.',
                policy.service_fee > 0
                    ? `Setiap booking dikenakan biaya layanan ${formatRupiah(policy.service_fee)}.`
                    : 'Tidak ada biaya layanan tambahan di luar harga sewa.',
            ],
        },
        {
            id: 'pembayaran',
            title: 'Pembayaran',
            items: [
                `Slot ditahan selama ${policy.hold_minutes} menit sejak booking dibuat. Bila pembayaran belum masuk sampai batas itu, booking otomatis kedaluwarsa dan slot dilepas untuk umum.`,
                'Pembayaran diproses oleh Midtrans (QRIS, e-wallet, virtual account, kartu). Kami tidak menyimpan data kartu atau kredensial pembayaranmu.',
                'Status pembayaran hanya diakui setelah dikonfirmasi oleh Midtrans, atau setelah dicatat oleh staf untuk pembayaran di tempat.',
                'Invoice diterbitkan untuk setiap booking dan diperbarui setiap kali ada pembayaran masuk.',
            ],
        },
        ...(policy.dp_enabled
            ? [
                  {
                      id: 'dp',
                      title: `Uang muka (DP ${policy.dp_percentage}%)`,
                      items: [
                          `Opsi DP hanya tersedia untuk member dengan email terverifikasi dan untuk jadwal main minimal H-${policy.dp_min_days_ahead}.`,
                          `Nominal DP adalah ${policy.dp_percentage}% dari total, dibulatkan ke atas ke kelipatan Rp1.000.`,
                          `Sisa tagihan wajib dilunasi paling lambat ${policy.dp_settle_before_hours} jam sebelum jam main secara online, atau di lokasi sebelum check-in.`,
                          `Bila booking tidak dilunasi dan kamu tidak hadir sampai ${policy.dp_no_show_grace_minutes} menit setelah jam mulai, booking ditandai no-show dan DP hangus.`,
                          'Member dengan no-show berulang dapat kehilangan akses pembayaran DP untuk sementara.',
                      ],
                  },
              ]
            : []),
        {
            id: 'pembatalan',
            title: 'Pembatalan & refund',
            items: [
                `Booking yang belum dibayar dapat dibatalkan kapan saja. Booking yang sudah terkonfirmasi dapat dibatalkan sendiri paling lambat ${policy.cancel_before_hours} jam sebelum jam main.`,
                'Setelah lewat batas tersebut, pembatalan hanya dapat dilakukan dengan menghubungi admin venue dan dapat dikenakan biaya.',
                `Pembayaran penuh yang dibatalkan sesuai kebijakan akan diproses refund-nya oleh admin. DP tidak dikembalikan bila pembatalan dilakukan kurang dari ${policy.dp_refundable_before_hours} jam sebelum jam main.`,
                'Refund diproses manual oleh admin ke rekening atau metode pembayaran yang sama, dan dapat memakan waktu beberapa hari kerja.',
            ],
        },
        {
            id: 'venue',
            title: 'Aturan di venue',
            items: [
                'Tunjukkan kode booking atau e-ticket kepada staf saat tiba. Datang beberapa menit lebih awal agar jam mainmu tidak terpotong.',
                'Gunakan sepatu dan perlengkapan yang sesuai untuk lapangan padel. Staf berhak menolak pemain yang perlengkapannya membahayakan permukaan lapangan atau pemain lain.',
                'Kerusakan fasilitas akibat kelalaian pemain menjadi tanggung jawab pemesan.',
                'Venue dapat membatalkan atau memindahkan jadwal karena kondisi darurat (perbaikan, cuaca untuk lapangan outdoor, atau sebab lain di luar kendali). Dalam hal ini kami menawarkan penjadwalan ulang atau refund penuh.',
            ],
        },
        {
            id: 'akun',
            title: 'Akun member',
            items: [
                'Kamu bertanggung jawab menjaga kerahasiaan kata sandi akunmu.',
                'Data pada akun (nama, email, nomor WhatsApp) harus benar karena dipakai untuk konfirmasi booking, invoice, dan pengingat jadwal.',
                'Kami dapat menonaktifkan akun yang terbukti menyalahgunakan sistem, misalnya menahan banyak slot tanpa membayar.',
            ],
        },
    ];

    return (
        <PublicLayout venue={venue}>
            <Head title="Syarat & Ketentuan">
                <meta name="description" content={`Syarat dan ketentuan pemesanan lapangan di ${venue.name}.`} />
            </Head>

            <PageHero
                eyebrow="Legal"
                title="Syarat & ketentuan."
                description={`Berlaku untuk seluruh pemesanan lapangan di ${venue.name}. Terakhir diperbarui ${formatDate(updatedAt)}.`}
            />

            <LegalDocument
                sections={sections}
                note={`Ada yang kurang jelas? Hubungi admin venue${venue.whatsapp ? ` di WhatsApp +${venue.whatsapp}` : ''} sebelum melakukan pemesanan.`}
            />
        </PublicLayout>
    );
}
