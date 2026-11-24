-- ==============================================================================
-- WDPCS Accommodation System — Mountain Stay Retreat
-- Migration: Add check_out_date and room_count columns to public.bookings table
-- ==============================================================================

-- 1. Add check_out_date and room_count columns to bookings table (if not exists)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_out_date date;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_count integer DEFAULT 1;

-- 2. Update get_all_bookings() RPC function to include check_out_date & room_count
CREATE OR REPLACE FUNCTION public.get_all_bookings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res json;
BEGIN
  SELECT coalesce(json_agg(b ORDER BY b."createdAt" DESC), '[]'::json) INTO res
  FROM (
    SELECT 
      id,
      guest_name AS "name",
      guest_email AS "email",
      guest_phone AS "phone",
      check_in_date AS "date",
      check_in_date AS "checkInDate",
      check_out_date AS "checkOutDate",
      COALESCE(room_count, 1) AS "roomCount",
      room_type AS "roomType",
      amount,
      payment_method AS "paymentMethod",
      status,
      notes,
      payment_id AS "paymentId",
      order_id AS "orderId",
      created_at AS "createdAt"
    FROM public.bookings
    WHERE id NOT LIKE 'SYS-%'
  ) b;
  RETURN res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_bookings() TO anon, authenticated;

-- 3. Ensure property_settings & rooms allow admin updates if using anon key
ALTER TABLE public.property_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read property_settings" ON public.property_settings;
CREATE POLICY "Allow anon read property_settings" ON public.property_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon update property_settings" ON public.property_settings;
CREATE POLICY "Allow anon update property_settings" ON public.property_settings FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon update rooms" ON public.rooms;
CREATE POLICY "Allow anon update rooms" ON public.rooms FOR UPDATE TO anon, authenticated USING (true);
