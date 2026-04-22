const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

export function formatOrderDate(date = new Date()): string {
    return ORDER_DATE_FORMATTER.format(date);
}

export function parseOrderDate(dateStr: string): number {
    if (!dateStr) return 0;

    const normalized = String(dateStr).trim();
    const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (slashMatch) {
        const [, dayRaw, monthRaw, yearRaw] = slashMatch;
        const day = Number(dayRaw);
        const month = Number(monthRaw);
        const year = Number(yearRaw);

        if (
            Number.isInteger(day) &&
            Number.isInteger(month) &&
            Number.isInteger(year) &&
            day >= 1 &&
            day <= 31 &&
            month >= 1 &&
            month <= 12
        ) {
            return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
        }
    }

    const months: Record<string, number> = {
        ene: 0,
        feb: 1,
        mar: 2,
        abr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        ago: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dic: 11,
    };

    const parts = normalized
        .toLowerCase()
        .split(' ')
        .filter((part) => part !== 'de' && part !== 'del' && part !== '');

    if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1].replace('.', '').substring(0, 3);
        const year = parseInt(parts[2], 10);

        if (!Number.isNaN(day) && !Number.isNaN(year) && typeof months[monthStr] !== 'undefined') {
            return new Date(year, months[monthStr], day, 12, 0, 0, 0).getTime();
        }
    }

    return 0;
}
