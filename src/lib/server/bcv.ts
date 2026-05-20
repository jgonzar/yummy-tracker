import { db } from './db';
import { bcvTasaCache } from './schema';
import { desc } from 'drizzle-orm';

const DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';
const TTL_MS = 24 * 60 * 60 * 1000;

export type TasaBcv = { tasa: number; obtenidaEn: Date; stale: boolean };

export async function getTasaBcv(): Promise<TasaBcv | null> {
	const [cached] = await db
		.select()
		.from(bcvTasaCache)
		.orderBy(desc(bcvTasaCache.obtenidaEn))
		.limit(1);

	if (cached) {
		const age = Date.now() - new Date(cached.obtenidaEn).getTime();
		if (age < TTL_MS) {
			return { tasa: parseFloat(cached.tasaVesPorUsd), obtenidaEn: new Date(cached.obtenidaEn), stale: false };
		}
	}

	try {
		const res = await fetch(DOLAR_API_URL);
		if (!res.ok) throw new Error(`dolarapi ${res.status}`);
		const { promedio: rate } = (await res.json()) as { promedio: number };
		const obtenidaEn = new Date();
		await db.insert(bcvTasaCache).values({ tasaVesPorUsd: String(rate), obtenidaEn });
		return { tasa: rate, obtenidaEn, stale: false };
	} catch (e) {
		console.error('[getTasaBcv] fetch failed:', e);
		if (cached) {
			return { tasa: parseFloat(cached.tasaVesPorUsd), obtenidaEn: new Date(cached.obtenidaEn), stale: true };
		}
		return null;
	}
}
