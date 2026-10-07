import Button from '@/Components/common/Button';
import PageHeader from '@/Components/common/PageHeader';
import Panel from '@/Components/common/Panel';
import ImageUploadField from '@/Components/form/ImageUploadField';
import SelectField from '@/Components/form/SelectField';
import SwitchField from '@/Components/form/SwitchField';
import TagsField from '@/Components/form/TagsField';
import TextareaField from '@/Components/form/TextareaField';
import TextField from '@/Components/form/TextField';
import { useCheckboxField, useFormField } from '@/hooks/useFormField';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatRupiah } from '@/lib/format';
import { useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';

const FACILITY_SUGGESTIONS = [
    'LED lighting',
    'Panoramic glass',
    'AC hall',
    'Locker',
    'Shower',
    'Floodlight',
    'Water station',
    'Parkir',
    'Sewa raket',
];
const TYPE_LABELS = { indoor: 'Indoor', outdoor: 'Outdoor' };

export default function CourtForm({ court, types, nextSortOrder }) {
    const isEdit = Boolean(court);

    const form = useForm({
        name: court?.name ?? '',
        slug: court?.slug ?? '',
        type: court?.type ?? types[0],
        surface: court?.surface ?? '',
        description: court?.description ?? '',
        rules: court?.rules ?? '',
        facilities: court?.facilities ?? [],
        base_price: court?.base_price ?? '',
        is_active: court?.is_active ?? true,
        sort_order: court?.sort_order ?? nextSortOrder,
        images: [],
        removed_images: [],
    });
    const field = useFormField(form);
    const checkbox = useCheckboxField(form);

    const imageError = form.errors.images ?? Object.entries(form.errors).find(([key]) => key.startsWith('images.'))?.[1];

    const submit = (event) => {
        event.preventDefault();

        // Upload file lewat PUT tidak didukung PHP, jadi update dikirim sebagai POST + _method.
        // transform() tidak mengembalikan form (Inertia 2), jadi post() harus dipanggil terpisah.
        if (isEdit) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(route('admin.courts.update', court.id), { forceFormData: true, preserveScroll: true });

            return;
        }

        form.post(route('admin.courts.store'), { forceFormData: true, preserveScroll: true });
    };

    return (
        <AdminLayout title={isEdit ? `Ubah ${court.name}` : 'Tambah lapangan'}>
            <PageHeader
                back={{ href: route('admin.courts.index'), label: 'Lapangan' }}
                title={isEdit ? court.name : 'Tambah lapangan'}
                description={isEdit ? 'Perbarui detail lapangan. Perubahan langsung tampil di halaman publik.' : 'Lengkapi detail lapangan baru.'}
            />

            <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-12">
                <div className="flex flex-col gap-4 lg:col-span-8">
                    <Panel title="Informasi dasar" bodyClassName="grid gap-5 md:grid-cols-2">
                        <TextField id="name" label="Nama lapangan" placeholder="Court 1 — Panoramic" className="md:col-span-2" {...field('name')} />
                        <TextField
                            id="slug"
                            label="Slug URL"
                            placeholder="Otomatis dari nama"
                            hint="Kosongkan untuk dibuat otomatis dari nama."
                            {...field('slug')}
                        />
                        <SelectField
                            id="type"
                            label="Tipe"
                            options={types.map((type) => ({ value: type, label: TYPE_LABELS[type] ?? type }))}
                            {...field('type')}
                        />
                        <TextField id="surface" label="Permukaan" placeholder="Artificial grass" {...field('surface')} />
                        <TextField
                            id="sort_order"
                            type="number"
                            min="0"
                            label="Urutan tampil"
                            hint="Angka kecil tampil lebih dulu."
                            {...field('sort_order')}
                        />
                        <TextareaField id="description" label="Deskripsi" rows={4} className="md:col-span-2" {...field('description')} />
                        <TextareaField
                            id="rules"
                            label="Aturan lapangan"
                            rows={3}
                            placeholder="Wajib sepatu padel, maksimal 4 pemain…"
                            className="md:col-span-2"
                            {...field('rules')}
                        />
                    </Panel>

                    <Panel title="Foto" description="JPG, PNG, atau WebP maksimal 4 MB per foto. Foto pertama menjadi cover.">
                        <ImageUploadField
                            id="images"
                            existing={court?.images ?? []}
                            removed={form.data.removed_images}
                            files={form.data.images}
                            onRemovedChange={(ids) => form.setData('removed_images', ids)}
                            onFilesChange={(files) => {
                                form.setData('images', files);
                                form.clearErrors('images');
                            }}
                            error={imageError}
                        />
                    </Panel>

                    <Panel title="Fasilitas">
                        <TagsField
                            id="facilities"
                            placeholder="Ketik lalu tekan Enter"
                            suggestions={FACILITY_SUGGESTIONS}
                            value={form.data.facilities}
                            onChange={(value) => form.setData('facilities', value)}
                            error={form.errors.facilities}
                        />
                    </Panel>
                </div>

                <div className="flex flex-col gap-4 lg:col-span-4">
                    <Panel title="Harga & status" bodyClassName="flex flex-col gap-5">
                        <TextField
                            id="base_price"
                            type="number"
                            min="0"
                            step="1000"
                            inputMode="numeric"
                            label="Harga dasar per jam"
                            hint={
                                form.data.base_price ? formatRupiah(Number(form.data.base_price)) : 'Dipakai bila tidak ada aturan harga yang cocok.'
                            }
                            {...field('base_price')}
                        />
                        <SwitchField
                            id="is_active"
                            label="Lapangan aktif"
                            description="Nonaktif = tidak bisa dibooking."
                            {...checkbox('is_active')}
                        />
                    </Panel>

                    <div className="flex flex-col gap-2 lg:sticky lg:top-6">
                        <Button type="submit" size="lg" icon={Check} loading={form.processing} disabled={form.processing} className="w-full">
                            {isEdit ? 'Simpan perubahan' : 'Tambah lapangan'}
                        </Button>
                        <Button href={route('admin.courts.index')} variant="ghost" className="w-full">
                            Batal
                        </Button>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
