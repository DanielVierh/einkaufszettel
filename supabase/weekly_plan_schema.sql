-- Weekly plan and recipe tables for Supabase
-- Compatible with existing shopping_items.user_id as text

create table if not exists public.recipes (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id text not null,
  title text not null,
  description text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint recipes_pkey primary key (id),
  constraint recipes_user_title_unique unique (user_id, title)
) tablespace pg_default;

create table if not exists public.recipe_ingredients (
  id uuid not null default extensions.uuid_generate_v4(),
  recipe_id uuid not null,
  shopping_item_id uuid not null,
  constraint recipe_ingredients_pkey primary key (id),
  constraint recipe_ingredients_recipe_fkey foreign key (recipe_id)
    references public.recipes (id) on delete cascade,
  constraint recipe_ingredients_item_fkey foreign key (shopping_item_id)
    references public.shopping_items (id) on delete restrict,
  constraint recipe_ingredients_unique unique (recipe_id, shopping_item_id)
) tablespace pg_default;

create table if not exists public.weekly_plan (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id text not null,
  weekday smallint not null,
  recipe_id uuid not null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint weekly_plan_pkey primary key (id),
  constraint weekly_plan_recipe_fkey foreign key (recipe_id)
    references public.recipes (id) on delete cascade,
  constraint weekly_plan_weekday_check check (weekday between 1 and 7),
  constraint weekly_plan_user_weekday_unique unique (user_id, weekday)
) tablespace pg_default;

create index if not exists idx_recipes_user_id on public.recipes (user_id);
create index if not exists idx_recipe_ingredients_recipe_id on public.recipe_ingredients (recipe_id);
create index if not exists idx_recipe_ingredients_item_id on public.recipe_ingredients (shopping_item_id);
create index if not exists idx_weekly_plan_user_id on public.weekly_plan (user_id);

alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.weekly_plan enable row level security;

drop policy if exists recipes_select_own on public.recipes;
drop policy if exists recipes_insert_own on public.recipes;
drop policy if exists recipes_update_own on public.recipes;
drop policy if exists recipes_delete_own on public.recipes;

create policy recipes_select_own on public.recipes
for select using (user_id = auth.uid()::text);

create policy recipes_insert_own on public.recipes
for insert with check (user_id = auth.uid()::text);

create policy recipes_update_own on public.recipes
for update using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

create policy recipes_delete_own on public.recipes
for delete using (user_id = auth.uid()::text);

drop policy if exists weekly_plan_select_own on public.weekly_plan;
drop policy if exists weekly_plan_insert_own on public.weekly_plan;
drop policy if exists weekly_plan_update_own on public.weekly_plan;
drop policy if exists weekly_plan_delete_own on public.weekly_plan;

create policy weekly_plan_select_own on public.weekly_plan
for select using (user_id = auth.uid()::text);

create policy weekly_plan_insert_own on public.weekly_plan
for insert with check (user_id = auth.uid()::text);

create policy weekly_plan_update_own on public.weekly_plan
for update using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

create policy weekly_plan_delete_own on public.weekly_plan
for delete using (user_id = auth.uid()::text);

drop policy if exists recipe_ingredients_select_own on public.recipe_ingredients;
drop policy if exists recipe_ingredients_insert_own on public.recipe_ingredients;
drop policy if exists recipe_ingredients_update_own on public.recipe_ingredients;
drop policy if exists recipe_ingredients_delete_own on public.recipe_ingredients;

create policy recipe_ingredients_select_own on public.recipe_ingredients
for select
using (
  exists (
    select 1
    from public.recipes r
    where r.id = recipe_ingredients.recipe_id
      and r.user_id = auth.uid()::text
  )
);

create policy recipe_ingredients_insert_own on public.recipe_ingredients
for insert
with check (
  exists (
    select 1
    from public.recipes r
    where r.id = recipe_ingredients.recipe_id
      and r.user_id = auth.uid()::text
  )
);

create policy recipe_ingredients_update_own on public.recipe_ingredients
for update
using (
  exists (
    select 1
    from public.recipes r
    where r.id = recipe_ingredients.recipe_id
      and r.user_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1
    from public.recipes r
    where r.id = recipe_ingredients.recipe_id
      and r.user_id = auth.uid()::text
  )
);

create policy recipe_ingredients_delete_own on public.recipe_ingredients
for delete
using (
  exists (
    select 1
    from public.recipes r
    where r.id = recipe_ingredients.recipe_id
      and r.user_id = auth.uid()::text
  )
);
