/**
 * [Automation Doctor 2026-03-28] 🛒 오프라인 우선 장바구니 스토어
 * 
 * 학생 여러분, 이 파일은 사용자가 고른 '보물'들을 임시로 담아두는 바구니 역할을 합니다.
 * localStorage를 사용하여 브라우저를 껐다 켜거나, 인터넷이 끊겨도 데이터가 유지됩니다.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    type: 'tour' | 'landmark' | 'product';
    image?: string;
}

interface CartStore {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const existingItems = get().items;
                const existingItem = existingItems.find((i) => i.id === item.id);

                if (existingItem) {
                    set({
                        items: existingItems.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
                        ),
                    });
                } else {
                    set({ items: [...existingItems, { ...item, quantity: item.quantity || 1 }] });
                }
            },
            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) });
            },
            clearCart: () => set({ items: [] }),
            getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
            getTotalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        }),
        {
            name: 'gps-tours-cart',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
