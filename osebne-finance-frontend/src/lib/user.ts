export type AppUser = {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    defaultCurrency: string;
    showAmounts: boolean;
    createdAt?: string | Date;
};

export function normalizeUser(d: any): AppUser {
    return {
        id: Number(d?.id ?? 0),
        email: String(d?.email ?? ''),
        firstName: String(d?.firstName ?? ''),
        lastName: String(d?.lastName ?? ''),
        defaultCurrency: String(d?.defaultCurrency ?? 'EUR'),
        showAmounts: Boolean(d?.showAmounts ?? true),
        createdAt: d?.createdAt,
    };
}
