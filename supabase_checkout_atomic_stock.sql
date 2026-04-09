-- Atomic stock reservation helpers for checkout.
-- Run in Supabase SQL editor.

create or replace function public.reserve_stock_atomic(items jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  elem jsonb;
  v_product_id text;
  v_quantity integer;
  v_stock integer;
begin
  if items is null or jsonb_typeof(items) <> 'array' then
    return false;
  end if;

  -- Validate availability first.
  for elem in select * from jsonb_array_elements(items) loop
    v_product_id := elem->>'productId';
    v_quantity := coalesce((elem->>'quantity')::integer, 0);
    if v_product_id is null or v_quantity <= 0 then
      return false;
    end if;

    select "stockCount" into v_stock
    from public.products
    where id = v_product_id
    for update;

    if v_stock is null or v_stock < v_quantity then
      return false;
    end if;
  end loop;

  -- Reserve stock.
  for elem in select * from jsonb_array_elements(items) loop
    v_product_id := elem->>'productId';
    v_quantity := coalesce((elem->>'quantity')::integer, 0);
    update public.products
      set "stockCount" = greatest(0, coalesce("stockCount", 0) - v_quantity),
          "inStock" = (greatest(0, coalesce("stockCount", 0) - v_quantity) > 0)
    where id = v_product_id;
  end loop;

  return true;
end;
$$;

create or replace function public.release_stock_atomic(items jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  elem jsonb;
  v_product_id text;
  v_quantity integer;
begin
  if items is null or jsonb_typeof(items) <> 'array' then
    return false;
  end if;

  for elem in select * from jsonb_array_elements(items) loop
    v_product_id := elem->>'productId';
    v_quantity := coalesce((elem->>'quantity')::integer, 0);
    if v_product_id is null or v_quantity <= 0 then
      continue;
    end if;

    update public.products
      set "stockCount" = coalesce("stockCount", 0) + v_quantity,
          "inStock" = true
    where id = v_product_id;
  end loop;

  return true;
end;
$$;
