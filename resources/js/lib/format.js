const number = new Intl.NumberFormat('id-ID');

export function formatRupiah(value) {
    return `Rp${number.format(value ?? 0)}`;
}

export function formatRupiahCompact(value) {
    return `${Math.round((value ?? 0) / 1000)}K`;
}
