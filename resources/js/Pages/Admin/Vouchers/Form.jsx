import Button from '@/Components/common/Button';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import SelectField from '@/Components/form/SelectField';
import SwitchField from '@/Components/form/SwitchField';
import TextField from '@/Components/form/TextField';
import { useFormField } from '@/hooks/useFormField';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatRupiah } from '@/lib/format';
import { useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

export default function VoucherForm({ voucher, types }) {
    const form = useForm({
        code: voucher?.code ?? '',
        type: voucher?.type ?? 'percent',
        value: voucher?.value ?? '',
        max_discount: voucher?.max_discount ?? '',
        min_amount: voucher?.min_amount ?? 0,
        quota: voucher?.quota ?? '',
        members_only: voucher?.members_only ?? false,
        starts_at: voucher?.starts_at ?? '',
        ends_at: voucher?.ends_at ?? '',
        is_active: voucher?.is_active ?? true,
    });

    const field = useFormField(form);
    const isPercent = form.data.type === 'percent';

    const submit = (event) => {
        event.preventDefault();

        voucher ? form.put(route('admin.vouchers.update', voucher.id)) : form.post(route('admin.vouchers.store'));
    };

    return (
        <AdminLayout title={voucher ? `Ubah ${voucher.code}` : 'Voucher baru'}>
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                <PageHeader
                    back={{ href: route('admin.vouchers.index'), label: 'Voucher' }}
                    title={voucher ? `Ubah voucher ${voucher.code}` : 'Voucher baru'}
                    description="Potongan dihitung dari subtotal + biaya layanan, lalu dipotong dari total tagihan."
                    actions={
                        <Button type="submit" icon={Save} loading={form.processing} disabled={form.processing}>
                            Simpan
                        </Button>
                    }
                />

                <div className="grid gap-4 lg:grid-cols-2">
                    <Panel title="Kode & potongan">
                        <div className="flex flex-col gap-4">
                            <TextField
                                id="code"
                                label="Kode voucher"
                                placeholder="PBS20"
                                hint="Huruf kapital, angka, dan tanda hubung."
                                inputClassName="font-mono uppercase"
                                autoComplete="off"
                                {...field('code')}
                                onChange={(event) => form.setData('code', event.target.value.toUpperCase())}
                            />

                            <SelectField id="type" label="Jenis potongan" options={types} {...field('type')} />

                            <TextField
                                id="value"
                                label={isPercent ? 'Besar diskon (%)' : 'Nominal potongan'}
                                type="number"
                                min="1"
                                max={isPercent ? 100 : undefined}
                                step={isPercent ? 1 : 1000}
                                hint={!isPercent && form.data.value ? formatRupiah(Number(form.data.value)) : undefined}
                                {...field('value')}
                            />

                            {isPercent && (
                                <TextField
                                    id="max_discount"
                                    label="Maksimal potongan (opsional)"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    hint={form.data.max_discount ? formatRupiah(Number(form.data.max_discount)) : 'Kosongkan bila tanpa batas.'}
                                    {...field('max_discount')}
                                />
                            )}
                        </div>
                    </Panel>

                    <Panel title="Syarat & masa berlaku">
                        <div className="flex flex-col gap-4">
                            <TextField
                                id="min_amount"
                                label="Minimal transaksi"
                                type="number"
                                min="0"
                                step="1000"
                                hint={formatRupiah(Number(form.data.min_amount) || 0)}
                                {...field('min_amount')}
                            />

                            <TextField
                                id="quota"
                                label="Kuota pemakaian (opsional)"
                                type="number"
                                min="1"
                                hint={voucher ? `Sudah terpakai ${voucher.used_count} kali.` : 'Kosongkan bila tanpa batas.'}
                                {...field('quota')}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <TextField id="starts_at" label="Mulai berlaku" type="date" {...field('starts_at')} />
                                <TextField id="ends_at" label="Berakhir" type="date" {...field('ends_at')} />
                            </div>

                            <SwitchField
                                id="members_only"
                                label="Khusus member"
                                description="Tamu tanpa akun tidak bisa memakai voucher ini."
                                checked={form.data.members_only}
                                error={form.errors.members_only}
                                onCheckedChange={(value) => form.setData('members_only', value)}
                            />

                            <SwitchField
                                id="is_active"
                                label="Aktif"
                                description="Voucher nonaktif ditolak saat dipakai customer."
                                checked={form.data.is_active}
                                error={form.errors.is_active}
                                onCheckedChange={(value) => form.setData('is_active', value)}
                            />
                        </div>
                    </Panel>
                </div>
            </form>
        </AdminLayout>
    );
}
