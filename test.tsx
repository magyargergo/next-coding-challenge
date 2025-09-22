import { render, screen} from '@testing-library/react';
import HomeClient from '@/app/[locale]/HomeClient';
import React from 'react';

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
    { id: 1, name: 'Item 1', price: 1 },
    { id: 2, name: 'Item 2', price: 2 },
    { id: 3, name: 'Item 3', price: 3 },
    { id: 4, name: 'Item 4', price: 4 }
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

        const buttons = screen.getAllByRole('button', {
            name: /Add to basket/i,
        });

        await buttons[0].click();

        const basketButton = screen.getByRole('button', {
            name: /Basket:/i,
        });

        expect(basketButton).toHaveTextContent(/Basket: 1 item$/);
    });

    it('renders a basket with 1 of item 1 and 2 of item 2', async () => {
        render(wrapper(<HomeClient initialProducts={initialProducts} currency="GBP" locale="en-GB" />));

        const buttons = screen.getAllByRole('button', {
            name: /Add to basket/i,
        });

        await buttons[0].click();
        await buttons[1].click();
        await buttons[1].click();

        const basketButton = screen.getByRole('button', {
            name: /Basket:/i,
        });

        expect(basketButton).toHaveTextContent(/Basket: 2 items$/);
    });
});
