// Simple in-memory state for passing data between pages
// This persists as long as the SPA is loaded (client-side navigation)
export const globalState = {
    beforeImage: null as string | null,
    afterImage: null as string | null,
    products: [] as any[],
};
