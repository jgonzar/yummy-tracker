import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { viajes, viajeClientes, viajeParadas, ubicaciones } from '$lib/server/schema';
import { sql, isNull } from 'drizzle-orm';

type FormLoc = { id: number | null; nombre: string };

async function resolveLocation(loc: FormLoc): Promise<number> {
	if (loc.id !== null) return loc.id;
	const [row] = await db
		.insert(ubicaciones)
		.values({ nombre: loc.nombre.trim() })
		.onConflictDoUpdate({
			target: ubicaciones.nombre,
			set: { nombre: sql`excluded.nombre` }
		})
		.returning({ id: ubicaciones.id });
	return row.id;
}

export const PATCH: RequestHandler = async () => {
	const updated = await db
		.update(viajes)
		.set({ pagadoEn: new Date() })
		.where(isNull(viajes.pagadoEn))
		.returning({ id: viajes.id });
	return json({ count: updated.length });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body) error(400, 'Cuerpo de solicitud inválido');

	const {
		clienteIds,
		conductorNombre,
		origen,
		paradas = [],
		destino,
		precioUsd,
		minutosEspera,
		notas,
		creadoEn
	} = body;

	if (!clienteIds?.length) error(400, 'Se requiere al menos un cliente');
	if (!origen) error(400, 'Origen requerido');
	if (!destino) error(400, 'Destino requerido');

	try {
		const origenId = await resolveLocation(origen);
		const paradaIds: number[] = [];
		for (const p of paradas) {
			paradaIds.push(await resolveLocation(p));
		}
		const destinoId = await resolveLocation(destino);

		const [newViaje] = await db
			.insert(viajes)
			.values({
				conductorNombre: conductorNombre || 'MC',
				precioUsd: precioUsd ? String(precioUsd) : null,
				minutosEspera: minutosEspera ?? null,
				notas: notas || null,
				...(creadoEn ? { creadoEn: new Date(creadoEn + 'T12:00:00Z') } : {})
			})
			.returning();

		await db.insert(viajeClientes).values(
			clienteIds.map((uid: number) => ({ viajeId: newViaje.id, usuarioId: uid }))
		);

		const stops = [
			{ viajeId: newViaje.id, ubicacionId: origenId, orden: 0 },
			...paradaIds.map((id, i) => ({
				viajeId: newViaje.id,
				ubicacionId: id,
				orden: i + 1
			})),
			{ viajeId: newViaje.id, ubicacionId: destinoId, orden: paradaIds.length + 1 }
		];
		await db.insert(viajeParadas).values(stops);

		return json(newViaje, { status: 201 });
	} catch (e) {
		console.error('[POST /api/viajes]', e);
		error(500, 'Error al crear la carrera');
	}
};
