# Deploy ke Vercel + Supabase

Vercel menjalankan Laravel sebagai serverless function (`vercel-php`). Batasannya diakali begini:

| Batasan Vercel | Solusi di PBS |
| --- | --- |
| Tidak ada database | Supabase Postgres (pooler transaksi, port 6543) |
| Filesystem read-only | Foto & avatar → bucket publik Supabase Storage; PDF invoice → bucket privat; view/font dompdf/log → `/tmp` (`bootstrap/app.php`) |
| Tidak ada `queue:work` / `schedule:work` | Endpoint `GET /cron/tick` (dilindungi `CRON_SECRET`) menjalankan `schedule:run` + memproses antrean, dipanggil tiap menit oleh `pg_cron` Supabase |
| Session/cache tidak persisten | Driver `database` (tabel `sessions`, `cache`, `jobs` di Supabase) |

## 1. Supabase

1. Buat project di region **Southeast Asia (Singapore)** agar dekat dengan function Vercel (`sin1`).
2. **Database**: Project Settings → Database → Connection string.
   - App (Vercel): *Transaction pooler* `...pooler.supabase.com:6543`.
   - Migrasi dari laptop: *Session pooler* / direct `:5432`.
3. **Storage**: buat dua bucket — `public` (centang *Public bucket*) dan `private`.
4. **S3 access key**: Project Settings → Storage → S3 Connection → *New access key*.

Migrasi & seed dari laptop (jangan di build Vercel):

```bash
DB_CONNECTION=pgsql \
DB_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" \
DB_SSLMODE=require \
php artisan migrate --seed --force
```

## 2. Vercel

1. Import repo GitHub di Vercel. `vercel.json` sudah mengatur runtime PHP, build Vite, rewrite, dan env non-rahasia.
2. Tambahkan Environment Variables (Settings → Environment Variables):

```
APP_KEY=base64:...            # php artisan key:generate --show
APP_URL=https://<domain-anda>
DB_URL=postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_STORAGE_KEY=...
SUPABASE_STORAGE_SECRET=...
SUPABASE_STORAGE_REGION=ap-southeast-1
SUPABASE_STORAGE_PUBLIC_BUCKET=public
SUPABASE_STORAGE_PRIVATE_BUCKET=private

CRON_SECRET=<string acak panjang>

MAIL_MAILER=smtp              # atau resend; "log" tidak mengirim apa pun
MAIL_HOST=... MAIL_PORT=... MAIL_USERNAME=... MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=...

MIDTRANS_SERVER_KEY=... MIDTRANS_CLIENT_KEY=... MIDTRANS_MERCHANT_ID=...
MIDTRANS_IS_PRODUCTION=false
WHATSAPP_DRIVER=... FONNTE_TOKEN=...
TURNSTILE_SITE_KEY=... TURNSTILE_SECRET=...
```

3. Deploy, lalu atur URL notifikasi Midtrans ke `https://<domain-anda>/midtrans/notification`.

## 3. Cron tiap menit (pg_cron Supabase)

Vercel Cron paket Hobby hanya boleh sekali sehari, jadi pemicu per menit memakai Supabase. Jalankan di SQL Editor:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'pbs-tick',
  '* * * * *',
  $$
  select net.http_get(
    url := 'https://<domain-anda>/cron/tick',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>'),
    timeout_milliseconds := 55000
  );
  $$
);
```

Cek hasil: `select * from net._http_response order by created desc limit 5;`
Hentikan: `select cron.unschedule('pbs-tick');`

> Paket Vercel Pro: bisa memakai Vercel Cron saja dengan menambahkan
> `"crons": [{ "path": "/cron/tick", "schedule": "* * * * *" }]` ke `vercel.json`
> — Vercel otomatis mengirim header `Authorization: Bearer $CRON_SECRET`.

## Catatan

- Email (invoice, e-ticket, pengingat) masuk antrean dan terkirim paling lambat ±1 menit, saat tick berikutnya.
- Cold start pertama setelah idle bisa 1–3 detik.
- `withoutOverlapping()` di scheduler memakai cache `database`, jadi aman bila dua tick berjalan bersamaan.
- Untuk development lokal tidak ada yang berubah: SQLite, disk lokal, dan `composer dev` tetap dipakai.
