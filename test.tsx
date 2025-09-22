import { render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeClient from '@/app/[locale]/HomeClient';
import React from 'react';
import { act } from '@testing-library/react';
import { useCartStore } from '@/store/cart';

jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => ({
        title: "Michael's Amazing Web Store",
        basket: 'Basket',
        items: 'items',
        item: 'item',
        addToBasket: 'Add to basket',
        checkout: 'Checkout',
        totalItems: 'Total items'
    } as Record<string, string>)[key] || key
}));

const wrapper = (ui: React.ReactElement) => ui;

const initialProducts = [
    { id: 1, name: 'Item 1', price: 1, currency: 'GBP' },
    { id: 2, name: 'Item 2', price: 2, currency: 'GBP' },
    { id: 3, name: 'Item 3', price: 3, currency: 'GBP' },
    { id: 4, name: 'Item 4', price: 4, currency: 'GBP' }
];

describe('HomeClient', () => {
    it('renders an empty basket', () => {
        render(wrapper(<HomeClient initialProducts={initialProducts} currency="GBP" locale="en-GB" />));

        const basketButton = screen.getByRole('button', {
            name: /Basket:/i,
        });

        expect(basketButton).toHaveTextContent('Basket: 0 items');
    });

    it('renders a basket with 1 item', async () => {
        render(wrapper(<HomeClient initialProducts={initialProducts} currency="GBP" locale="en-GB" />));
        const user = userEvent.setup();

        const buttons = screen.getAllByRole('button', {
            name: /Add to basket/i,
        });

        await user.click(buttons[0]);

        const basketButton = screen.getByRole('button', {
            name: /Basket:/i,
        });

        expect(basketButton).toHaveTextContent(/Basket: 1 item$/);
    });

    it('renders a basket with 1 of item 1 and 2 of item 2', async () => {
        render(wrapper(<HomeClient initialProducts={initialProducts} currency="GBP" locale="en-GB" />));
        const user = userEvent.setup();

        const buttons = screen.getAllByRole('button', {
            name: /Add to basket/i,
        });

        await user.click(buttons[0]);
        await user.click(buttons[1]);
        await user.click(buttons[1]);

        const basketButton = screen.getByRole('button', {
            name: /Basket:/i,
        });

        expect(basketButton).toHaveTextContent(/Basket: 2 items$/);
    });
});

describe('Cart Store', () => {
    beforeEach(() => {
        // Reset store state and cookie before each test
        act(() => {
            useCartStore.setState({ items: [] });
        });
        document.cookie = 'cart=; max-age=0; path=/';
    });

    it('adds a new item and increments quantity on duplicate add', () => {
        act(() => {
            useCartStore.getState().addItem('Widget', 10, 'GBP');
            useCartStore.getState().addItem('Widget', 10, 'GBP');
        });

        const state = useCartStore.getState();
        expect(state.items).toHaveLength(1);
        expect(state.getQuantityFor('Widget')).toBe(2);
        expect(state.getTotalUniqueItems()).toBe(1);
        expect(state.getTotalQuantity()).toBe(2);
    });

    it('decrements quantity and removes when it reaches zero', () => {
        act(() => {
            useCartStore.getState().addItem('Gadget', 5, 'GBP');
            useCartStore.getState().addItem('Gadget', 5, 'GBP');
        });
        expect(useCartStore.getState().getQuantityFor('Gadget')).toBe(2);

        act(() => {
            useCartStore.getState().decrementItem('Gadget');
        });
        expect(useCartStore.getState().getQuantityFor('Gadget')).toBe(1);

        act(() => {
            useCartStore.getState().decrementItem('Gadget');
        });
        expect(useCartStore.getState().getQuantityFor('Gadget')).toBe(0);
        expect(useCartStore.getState().items.find(i => i.name === 'Gadget')).toBeUndefined();
    });

    it('removes an item explicitly', () => {
        act(() => {
            useCartStore.getState().addItem('Thing', 3, 'GBP');
        });
        expect(useCartStore.getState().items).toHaveLength(1);

        act(() => {
            useCartStore.getState().removeItem('Thing');
        });
        expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('setQuantity sets value, floors decimals, and removes on <= 0', () => {
        act(() => {
            useCartStore.getState().addItem('Foo', 2, 'GBP');
        });
        expect(useCartStore.getState().getQuantityFor('Foo')).toBe(1);

        act(() => {
            useCartStore.getState().setQuantity('Foo', 3.7 as unknown as number);
        });
        expect(useCartStore.getState().getQuantityFor('Foo')).toBe(3);

        act(() => {
            useCartStore.getState().setQuantity('Foo', 0);
        });
        expect(useCartStore.getState().items.find(i => i.name === 'Foo')).toBeUndefined();
    });
});
