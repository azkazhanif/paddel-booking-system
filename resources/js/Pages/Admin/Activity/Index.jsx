import DataTable from '@/Components/admin/DataTable';
import FilterBar from '@/Components/admin/FilterBar';
import EmptyState from '@/Components/common/EmptyState';
import PageHeader from '@/Components/common/PageHeader';
import Pagination from '@/Components/common/Pagination';
import Panel from '@/Components/common/Panel';
import StatusBadge from '@/Components/common/StatusBadge';
import SelectField from '@/Components/form/SelectField';
import { Input } from '@/Components/ui/input';
import { useFilters } from '@/hooks/useFilters';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateTime } from '@/lib/format';
import { ScrollText } from 'lucide-react';

export default function AdminActivity({ logs, filters, actions, users }) {
    const { values, set, reset, active } = useFilters('admin.activity.index', {
        action: filters.action ?? '',
        user_id: filters.user_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const columns = [
        { key: 'created_at', header: 'Waktu', cell: (log) => <span className="whitespace-nowrap">{formatDateTime(log.created_at)}</span> },
        {
            key: 'user',
            header: 'Oleh',
            cell: (log) =>
                log.user?.name ? (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{log.user.name}</span>
                        {log.user.role && <StatusBadge type="role" value={log.user.role} className="px-2 py-0.5 text-[10px]" />}
                    </div>
                ) : (
                    <span className="text-bone-50/40">Sistem</span>
                ),
        },
        { key: 'label', header: 'Aksi', cell: (log) => <span className="font-medium">{log.label}</span> },
        { key: 'subject', header: 'Objek', cell: (log) => log.subject ?? <span className="text-bone-50/30">—</span> },
        {
            key: 'properties',
            header: 'Detail',
            cell: (log) =>
                log.properties ? (
                    <code className="block max-w-80 truncate font-mono text-xs text-bone-50/50">{JSON.stringify(log.properties)}</code>
                ) : (
                    <span className="text-bone-50/30">—</span>
                ),
        },
        { key: 'ip', header: 'IP', cell: (log) => <span className="font-mono text-xs text-bone-50/45">{log.ip_address ?? '—'}</span> },
    ];

    return (
        <AdminLayout title="Log aktivitas">
            <PageHeader title="Log aktivitas" description="Jejak aksi staff & admin yang menyangkut uang, akses, dan kebijakan venue." />

            <Panel>
                <FilterBar showReset={active} onReset={() => reset({ action: '', user_id: '', date_from: '', date_to: '' })}>
                    <SelectField
                        id="filter-action"
                        size="sm"
                        value={values.action}
                        onChange={(event) => set('action', event.target.value)}
                        placeholder="Semua aksi"
                        options={actions}
                    />
                    <SelectField
                        id="filter-user"
                        size="sm"
                        value={values.user_id}
                        onChange={(event) => set('user_id', event.target.value)}
                        placeholder="Semua user"
                        options={users.map((user) => ({ value: String(user.id), label: user.name }))}
                    />
                    <Input
                        type="date"
                        aria-label="Dari tanggal"
                        value={values.date_from}
                        onChange={(event) => set('date_from', event.target.value)}
                        className="h-10 text-sm"
                    />
                    <Input
                        type="date"
                        aria-label="Sampai tanggal"
                        value={values.date_to}
                        onChange={(event) => set('date_to', event.target.value)}
                        className="h-10 text-sm"
                    />
                </FilterBar>

                <DataTable
                    className="mt-5"
                    bare
                    columns={columns}
                    rows={logs.data}
                    empty={<EmptyState icon={ScrollText} title="Belum ada aktivitas" description="Aksi staff & admin akan tercatat di sini." />}
                />

                <Pagination paginator={logs} className="mt-5" />
            </Panel>
        </AdminLayout>
    );
}
