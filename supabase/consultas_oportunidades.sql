-- =====================================================================
-- Motocambio · Consultas de Oportunidades por chat interno
-- ---------------------------------------------------------------------
-- "Me interesa" ya no comparte el mail del interesado: crea una consulta.
-- El vendedor la acepta o la ignora; si la acepta, se abre un chat
-- dentro de la plataforma. Nadie ve el mail ni el teléfono del otro.
--
-- Correr TODO este archivo una sola vez en el editor SQL de Supabase.
-- Es seguro volver a correrlo (no borra datos).
-- =====================================================================

-- 1) Consultas: un interesado por oportunidad
create table if not exists public.consultas (
  id               uuid primary key default gen_random_uuid(),
  oportunidad_ref  text not null,
  interesado       uuid not null references auth.users(id) on delete cascade,
  vendedor         uuid not null references auth.users(id) on delete cascade,
  interesado_nombre text not null default 'Un usuario de Motocambio',
  vendedor_nombre  text not null default 'El vendedor',
  moto_txt         text not null,
  precio           numeric,
  estado           text not null default 'pendiente'
                   check (estado in ('pendiente', 'aceptada', 'ignorada')),
  creada_el        timestamptz not null default now(),
  respondida_el    timestamptz,
  unique (oportunidad_ref, interesado)
);

create index if not exists consultas_vendedor_idx on public.consultas (vendedor);
create index if not exists consultas_interesado_idx on public.consultas (interesado);

-- 2) Mensajes de cada consulta
create table if not exists public.mensajes_consulta (
  id          bigint generated always as identity primary key,
  consulta_id uuid not null references public.consultas(id) on delete cascade,
  autor       uuid not null references auth.users(id) on delete cascade,
  texto       text not null check (char_length(texto) between 1 and 2000),
  enviado_el  timestamptz not null default now(),
  leido       boolean not null default false
);

create index if not exists mensajes_consulta_idx on public.mensajes_consulta (consulta_id, enviado_el);

-- 3) Seguridad: cada uno ve solo sus consultas y sus mensajes
alter table public.consultas enable row level security;
alter table public.mensajes_consulta enable row level security;

drop policy if exists "consultas: las partes las ven" on public.consultas;
create policy "consultas: las partes las ven" on public.consultas
  for select to authenticated
  using (auth.uid() = interesado or auth.uid() = vendedor);
-- Sin políticas de insert/update/delete: las consultas se crean desde el
-- servidor (al tocar "Me interesa") y se responden con responder_consulta().

drop policy if exists "mensajes_consulta: las partes los ven" on public.mensajes_consulta;
create policy "mensajes_consulta: las partes los ven" on public.mensajes_consulta
  for select to authenticated
  using (exists (
    select 1 from public.consultas c
    where c.id = consulta_id and (auth.uid() = c.interesado or auth.uid() = c.vendedor)
  ));

drop policy if exists "mensajes_consulta: escribir si está aceptada" on public.mensajes_consulta;
create policy "mensajes_consulta: escribir si está aceptada" on public.mensajes_consulta
  for insert to authenticated
  with check (
    autor = auth.uid() and leido = false and exists (
      select 1 from public.consultas c
      where c.id = consulta_id and c.estado = 'aceptada'
        and (auth.uid() = c.interesado or auth.uid() = c.vendedor)
    )
  );

-- 4) El vendedor acepta o ignora (solo él, y solo si está pendiente)
create or replace function public.responder_consulta(p_consulta uuid, p_aceptar boolean)
returns setof public.consultas
language sql
security definer
set search_path = public
as $$
  update public.consultas
     set estado = case when p_aceptar then 'aceptada' else 'ignorada' end,
         respondida_el = now()
   where id = p_consulta
     and vendedor = auth.uid()
     and estado = 'pendiente'
  returning *;
$$;

-- 5) Marcar como leídos los mensajes que me mandaron
create or replace function public.leer_consulta(p_consulta uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.mensajes_consulta m
     set leido = true
    from public.consultas c
   where m.consulta_id = p_consulta
     and c.id = m.consulta_id
     and (auth.uid() = c.interesado or auth.uid() = c.vendedor)
     and m.autor <> auth.uid()
     and m.leido = false;
$$;

-- 6) Mis consultas (como vendedor y como interesado), con no leídos
create or replace function public.mis_consultas()
returns table (
  consulta_id uuid,
  rol text,
  otro_nombre text,
  moto_txt text,
  precio numeric,
  estado text,
  creada_el timestamptz,
  no_leidos bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select c.id,
         case when c.vendedor = auth.uid() then 'vendedor' else 'interesado' end,
         case when c.vendedor = auth.uid() then c.interesado_nombre else c.vendedor_nombre end,
         c.moto_txt,
         c.precio,
         c.estado,
         c.creada_el,
         (select count(*) from public.mensajes_consulta m
           where m.consulta_id = c.id and m.autor <> auth.uid() and not m.leido)
    from public.consultas c
   where auth.uid() in (c.interesado, c.vendedor)
   order by c.creada_el desc;
$$;

revoke all on function public.responder_consulta(uuid, boolean) from public, anon;
revoke all on function public.leer_consulta(uuid) from public, anon;
revoke all on function public.mis_consultas() from public, anon;
grant execute on function public.responder_consulta(uuid, boolean) to authenticated;
grant execute on function public.leer_consulta(uuid) to authenticated;
grant execute on function public.mis_consultas() to authenticated;

grant select on public.consultas to authenticated;
grant select, insert on public.mensajes_consulta to authenticated;

-- Verificación: tiene que devolver las dos tablas
select table_name from information_schema.tables
 where table_schema = 'public' and table_name in ('consultas', 'mensajes_consulta');
