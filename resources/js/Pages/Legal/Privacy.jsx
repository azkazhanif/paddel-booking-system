import LegalDocument from '@/Components/common/LegalDocument';
import PageHero from '@/Components/common/PageHero';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatDate } from '@/lib/format';
import { Head } from '@inertiajs/react';

export default function Privacy({ venue, updatedAt }) {
    const sections = [
        {
            id: 'data',
            title: 'Data yang kami kumpulkan',
            items: [
                'Data pemesan: nama, email, dan nomor WhatsApp — dipakai untuk mengirim link pembayaran, invoice, e-ticket, dan pengingat jadwal.',
                'Data booking: lapangan, tanggal, jam, jumlah pemain, catatan, serta riwayat pembayaran.',
                'Data akun member: nama, email, nomor WhatsApp, foto profil (bila diunggah), dan kata sandi yang disimpan dalam bentuk hash.',
                'Data teknis: alamat IP saat membuat booking, dipakai untuk mencegah penyalahgunaan dan penahanan slot massal.',
            ],
        },
        {
            id: 'penggunaan',
            title: 'Bagaimana data dipakai',
            items: [
                'Memproses pemesanan dan pembayaran, serta menerbitkan invoice dan e-ticket.',
                'Mengirim pemberitahuan terkait booking: link pembayaran, bukti pembayaran, pengingat pelunasan, dan pengingat jadwal main.',
                'Menjalankan operasional venue, misalnya check-in dan rekap pemakaian lapangan.',
                'Memperbaiki layanan dan mencegah penyalahgunaan sistem.',
            ],
        },
        {
            id: 'pihak-ketiga',
            title: 'Pihak ketiga',
            items: [
                'Midtrans sebagai payment gateway memproses pembayaran. Data kartu dan kredensial pembayaran diproses langsung oleh Midtrans dan tidak pernah disimpan di sistem kami.',
                'Penyedia email dan gateway WhatsApp dipakai untuk mengirim pemberitahuan terkait bookingmu.',
                'Kami tidak menjual atau menyewakan data pribadimu kepada pihak mana pun.',
            ],
        },
        {
            id: 'penyimpanan',
            title: 'Penyimpanan & keamanan',
            items: [
                'Data booking disimpan selama diperlukan untuk keperluan operasional, akuntansi, dan penyelesaian sengketa.',
                'Kata sandi disimpan dalam bentuk hash dan tidak dapat dibaca oleh siapa pun, termasuk staf kami.',
                'Akses data di panel admin dibatasi sesuai peran: staf hanya melihat data operasional, informasi keuangan terbatas untuk pemilik.',
            ],
        },
        {
            id: 'hak',
            title: 'Hak kamu',
            items: [
                'Mengakses dan memperbarui data akun kapan saja lewat halaman profil.',
                'Meminta penghapusan akun. Riwayat booking tetap tersimpan sebagai catatan transaksi venue, tetapi tidak lagi tertaut ke akunmu.',
                'Berhenti menerima pengingat dengan menghubungi admin; pemberitahuan penting terkait pembayaran dan booking tetap dikirim.',
            ],
        },
        {
            id: 'kontak',
            title: 'Kontak',
            paragraphs: [
                `Pertanyaan soal privasi dan data dapat disampaikan ke admin ${venue.name}${venue.whatsapp ? ` lewat WhatsApp +${venue.whatsapp}` : ''}.`,
            ],
        },
    ];

    return (
        <PublicLayout venue={venue}>
            <Head title="Kebijakan Privasi">
                <meta name="description" content={`Bagaimana ${venue.name} mengumpulkan dan memakai data pemesan.`} />
            </Head>

            <PageHero
                eyebrow="Legal"
                title="Kebijakan privasi."
                description={`Ringkas dan apa adanya: data apa yang kami simpan, untuk apa, dan hakmu atas data itu. Terakhir diperbarui ${formatDate(updatedAt)}.`}
            />

            <LegalDocument sections={sections} />
        </PublicLayout>
    );
}
