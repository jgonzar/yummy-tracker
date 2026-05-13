import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { ubicaciones } from '$lib/server/schema';
import { asc } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const locs = await db.select().from(ubicaciones).orderBy(asc(ubicaciones.nombre));
	return json(locs);
};
