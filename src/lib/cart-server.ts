import 'server-only'
import { cookies } from 'next/headers'

export type ServerCartItem = {
	name: string;
	quantity: number;
	price?: number;
	currency?: string;
};

export function readCartFromCookies(): ServerCartItem[] {
	try {
		const value = cookies().get('cart')?.value
		if (!value) return []
		const decoded = decodeURIComponent(value)
		const parsed = JSON.parse(decoded)
		if (!Array.isArray(parsed)) return []
		return parsed.filter((i: any) => i && typeof i.name === 'string' && Number.isFinite(i.quantity))
	} catch {
		return []
	}
}


