
insert into storage.buckets (id, name, public) values ('menu-images', 'menu-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('restaurant-assets', 'restaurant-assets', true) on conflict (id) do nothing;

do $$ begin create policy "menu_images_public_read" on storage.objects for select using (bucket_id = 'menu-images'); exception when duplicate_object then null; end $$;
do $$ begin create policy "restaurant_assets_public_read" on storage.objects for select using (bucket_id = 'restaurant-assets'); exception when duplicate_object then null; end $$;
do $$ begin create policy "menu_images_auth_write" on storage.objects for insert to authenticated with check (bucket_id = 'menu-images'); exception when duplicate_object then null; end $$;
do $$ begin create policy "menu_images_auth_update" on storage.objects for update to authenticated using (bucket_id = 'menu-images'); exception when duplicate_object then null; end $$;
do $$ begin create policy "menu_images_auth_delete" on storage.objects for delete to authenticated using (bucket_id = 'menu-images'); exception when duplicate_object then null; end $$;
do $$ begin create policy "restaurant_assets_auth_write" on storage.objects for insert to authenticated with check (bucket_id = 'restaurant-assets'); exception when duplicate_object then null; end $$;

do $$
declare s text;
begin
  for s in select unnest(array['pending','confirmed','en_preparation','prete','en_livraison','terminee','annulee'])
  loop
    begin execute format('alter type order_status add value if not exists %L', s); exception when others then null; end;
  end loop;
end $$;

do $$ begin alter publication supabase_realtime add table public.menu_items; exception when duplicate_object then null; end $$;

alter table public.orders add column if not exists customer_notified_at timestamptz;
alter table public.orders add column if not exists stripe_payment_intent_id text;
