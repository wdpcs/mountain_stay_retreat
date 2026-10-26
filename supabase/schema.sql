-- ==============================================================================
-- WDPCS Accommodation System — Mountain Stay Retreat
-- Production Supabase (PostgreSQL) Schema & Security Policies
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. USER PROFILES & ROLES
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'manager', 'receptionist')),
  phone text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated staff" 
  on public.profiles for select 
  to authenticated 
  using (true);

create policy "Profiles manageable only by admin role" 
  on public.profiles for all 
  to authenticated 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- ==============================================================================
-- 2. ROOM INVENTORY & CONFIGURATION
-- ==============================================================================
create table if not exists public.rooms (
  id text primary key,
  name text not null,
  category text not null check (category in ('suite', 'dormitory')),
  total_units integer not null check (total_units > 0),
  default_price integer not null check (default_price >= 0),
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.rooms enable row level security;

create policy "Public can view rooms inventory" 
  on public.rooms for select 
  to anon, authenticated 
  using (true);

create policy "Staff can update rooms" 
  on public.rooms for update 
  to authenticated 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role in ('admin', 'manager')
    )
  );

-- Seed initial rooms
insert into public.rooms (id, name, category, total_units, default_price, description, image_url)
values
  ('suite-executive', 'Executive Suite Room', 'suite', 5, 2500, 'Luxury suite room with king-size bed, balcony, Wi-Fi, AC, and scenic views.', 'Images/Rooms/225449353.jpg'),
  ('dorm-bed', 'Dormitory Bed', 'dormitory', 15, 450, 'Comfortable individual bunk bed in clean, spacious dormitory with attached lockers.', 'Images/Dormitory/Dormitory1.JPG')
on conflict (id) do nothing;

-- ==============================================================================
-- 3. PRICING & PROPERTY SETTINGS
-- ==============================================================================
create table if not exists public.property_settings (
  id integer primary key default 1,
  suite_price integer not null default 2500,
  dorm_price integer not null default 450,
  maintenance_suites integer not null default 0,
  maintenance_dorm_beds integer not null default 0,
  suite_maintenance_reason text default '',
  dorm_maintenance_reason text default '',
  check_in_time text default '13:00',
  check_out_time text default '12:00',
  reception_phone text default '+91 70250 17611',
  manager_phone text default '+91 98450 12345',
  cancellation_policy text default 'Full refund if cancelled at least 24 hours prior to check-in date. Cancellations within 24 hours incur 1-night retention charges.',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.property_settings enable row level security;

create policy "Public can view property settings and prices" 
  on public.property_settings for select 
  to anon, authenticated 
  using (true);

create policy "Staff can update property settings" 
  on public.property_settings for update 
  to authenticated 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() and profiles.role in ('admin', 'manager')
    )
  );

insert into public.property_settings (id, suite_price, dorm_price)
values (1, 2500, 450)
on conflict (id) do nothing;

-- ==============================================================================
-- 4. BOOKINGS & RESERVATIONS
-- ==============================================================================
create table if not exists public.bookings (
  id text primary key,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  check_in_date date not null,
  room_type text not null,
  amount integer not null check (amount >= 0),
  payment_method text not null check (payment_method in (
    'Online Pre-payment (Razorpay)',
    'Pay at Counter / Property',
    'Direct Walk-in / Reception Cash',
    'Cash at Counter',
    'UPI / QR Code at Desk',
    'Card POS Machine',
    'UPI / Razorpay'
  )),
  status text not null check (status in (
    'Pending at Check-in',
    'Paid Online',
    'Paid at Counter',
    'Checked In',
    'Checked Out',
    'Cancelled',
    'Refunded'
  )),
  notes text,
  payment_id text,
  order_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bookings enable row level security;

drop policy if exists "Public can insert bookings" on public.bookings;
drop policy if exists "Staff can view all bookings" on public.bookings;
drop policy if exists "Staff and public can view bookings" on public.bookings;
drop policy if exists "Allow select on bookings" on public.bookings;
drop policy if exists "Staff can update bookings" on public.bookings;
drop policy if exists "Allow update on bookings" on public.bookings;
drop policy if exists "Staff can delete or cancel bookings" on public.bookings;
drop policy if exists "Allow delete on bookings" on public.bookings;

create policy "Public can insert bookings" 
  on public.bookings for insert 
  to anon, authenticated 
  with check (true);

create policy "Allow select on bookings" 
  on public.bookings for select 
  to anon, authenticated 
  using (true);

create policy "Allow update on bookings" 
  on public.bookings for update 
  to anon, authenticated 
  using (true);

create policy "Allow delete on bookings" 
  on public.bookings for delete 
  to anon, authenticated 
  using (true);

-- RPC Function to retrieve all bookings with camelCase fields for the admin dashboard
create or replace function public.get_all_bookings()
returns json
language plpgsql
security definer
as $$
declare
  res json;
begin
  select coalesce(json_agg(b order by b."createdAt" desc), '[]'::json) into res
  from (
    select 
      id,
      guest_name as "name",
      guest_email as "email",
      guest_phone as "phone",
      check_in_date as "date",
      room_type as "roomType",
      amount,
      payment_method as "paymentMethod",
      status,
      notes,
      payment_id as "paymentId",
      order_id as "orderId",
      created_at as "createdAt"
    from public.bookings
  ) b;
  return res;
end;
$$;

grant execute on function public.get_all_bookings() to anon, authenticated;

-- Function to check available rooms on a specific date
create or replace function public.get_room_availability(target_date date)
returns json
language plpgsql
security definer
as $$
declare
  v_settings public.property_settings%rowtype;
  booked_suites integer;
  booked_dorms integer;
  res json;
begin
  select * into v_settings from public.property_settings where id = 1;
  
  select coalesce(count(*), 0) into booked_suites
  from public.bookings
  where check_in_date = target_date
    and room_type like '%Suite%'
    and status not in ('Cancelled', 'Refunded');

  select coalesce(count(*), 0) into booked_dorms
  from public.bookings
  where check_in_date = target_date
    and room_type like '%Dormitory%'
    and status not in ('Cancelled', 'Refunded');

  res := json_build_object(
    'totalSuites', 5,
    'maintenanceSuites', coalesce(v_settings.maintenance_suites, 0),
    'bookedSuites', booked_suites,
    'availableSuites', greatest(0, 5 - coalesce(v_settings.maintenance_suites, 0) - booked_suites),
    'totalDormBeds', 15,
    'maintenanceDormBeds', coalesce(v_settings.maintenance_dorm_beds, 0),
    'bookedDormBeds', booked_dorms,
    'availableDormBeds', greatest(0, 15 - coalesce(v_settings.maintenance_dorm_beds, 0) - booked_dorms),
    'roomPrices', json_build_object(
      'suitePrice', coalesce(v_settings.suite_price, 2500),
      'dormPrice', coalesce(v_settings.dorm_price, 450)
    )
  );
  
  return res;
end;
$$;

-- Grant execution to anon and authenticated
grant execute on function public.get_room_availability(date) to anon, authenticated;

-- ==============================================================================
-- 5. AUDIT LOGS
-- ==============================================================================
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  details text not null,
  actor_name text not null,
  actor_role text not null,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;

create policy "Staff can view audit logs" 
  on public.audit_logs for select 
  to authenticated 
  using (true);

create policy "Staff can insert audit logs" 
  on public.audit_logs for insert 
  to authenticated 
  with check (true);
