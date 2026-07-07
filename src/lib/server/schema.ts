import { pgTable, serial, text, numeric, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const usuarios = pgTable('usuarios', {
	id: serial('id').primaryKey(),
	nombre: text('nombre').notNull().unique(),
	iniciales: text('iniciales').notNull().unique(),
	rol: text('rol').notNull()
});

export const ubicaciones = pgTable('ubicaciones', {
	id: serial('id').primaryKey(),
	nombre: text('nombre').notNull().unique(),
	direccion: text('direccion')
});

export const viajes = pgTable('viajes', {
	id: serial('id').primaryKey(),
	creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
	pagadoEn: timestamp('pagado_en', { withTimezone: true }),
	borradoEn: timestamp('borrado_en', { withTimezone: true }),
	conductorNombre: text('conductor_nombre').notNull().default('MC'),
	precioUsd: numeric('precio_usd', { precision: 10, scale: 2 }),
	minutosEspera: integer('minutos_espera'),
	notas: text('notas')
});

export const viajeClientes = pgTable(
	'viaje_clientes',
	{
		viajeId: integer('viaje_id')
			.notNull()
			.references(() => viajes.id, { onDelete: 'cascade' }),
		usuarioId: integer('usuario_id')
			.notNull()
			.references(() => usuarios.id)
	},
	(t) => ({
		pk: primaryKey({ columns: [t.viajeId, t.usuarioId] })
	})
);

export const viajeParadas = pgTable('viaje_paradas', {
	id: serial('id').primaryKey(),
	viajeId: integer('viaje_id')
		.notNull()
		.references(() => viajes.id, { onDelete: 'cascade' }),
	orden: integer('orden').notNull(),
	ubicacionId: integer('ubicacion_id')
		.notNull()
		.references(() => ubicaciones.id)
});

export const bcvTasaCache = pgTable('bcv_tasa_cache', {
	id: serial('id').primaryKey(),
	tasaVesPorUsd: numeric('tasa_ves_por_usd', { precision: 18, scale: 4 }).notNull(),
	obtenidaEn: timestamp('obtenida_en', { withTimezone: true }).notNull()
});
