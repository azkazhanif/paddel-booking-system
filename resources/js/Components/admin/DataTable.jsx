import EmptyState from '@/Components/common/EmptyState';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' };

/**
 * Tabel data. columns: [{ key, header, cell?: (row) => node, align?, className?, headerClassName? }].
 * bare: tanpa border & latar (saat sudah dibungkus Panel).
 * rowHref: (row) => url agar seluruh baris bisa diklik (link utama tetap perlu ada di salah satu cell untuk keyboard).
 */
export default function DataTable({ columns, rows, rowKey = 'id', rowHref, empty, bare = false, className }) {
    const frame = bare ? 'border-t border-ink-800' : 'rounded-md border border-ink-800 bg-ink-900';

    if (!rows.length) {
        return <div className={cn(frame, className)}>{empty ?? <EmptyState title="Belum ada data" />}</div>;
    }

    return (
        <div className={cn('overflow-x-auto', frame, className)}>
            <table className="w-full min-w-max text-sm">
                <thead>
                    <tr className="border-b border-ink-800">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                className={cn(
                                    'px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-bone-50/45 uppercase first:pl-5 last:pr-5',
                                    ALIGN[column.align ?? 'left'],
                                    column.headerClassName,
                                )}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                    {rows.map((row) => (
                        <tr
                            key={row[rowKey]}
                            onClick={
                                rowHref
                                    ? (event) => {
                                          if (event.target.closest('a, button, input, [role="switch"]')) return;
                                          router.visit(rowHref(row));
                                      }
                                    : undefined
                            }
                            className={cn('transition-colors', rowHref && 'cursor-pointer hover:bg-white/[0.03]')}
                        >
                            {columns.map((column) => (
                                <td key={column.key} className={cn('px-4 py-3.5 align-middle first:pl-5 last:pr-5', ALIGN[column.align ?? 'left'], column.className)}>
                                    {column.cell ? column.cell(row) : row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
