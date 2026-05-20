import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTasaBcv } from '$lib/server/bcv';

export const GET: RequestHandler = async () => {
	const result = await getTasaBcv();
	if (!result) error(503, 'Tasa no disponible');
	return json(result);
};
