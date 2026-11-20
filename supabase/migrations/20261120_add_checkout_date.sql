-- ==============================================================================
-- WDPCS Accommodation System — Mountain Stay Retreat
-- Migration: Add check_out_date column to public.bookings table
-- ==============================================================================

-- 1. Add check_out_date column to bookings table (if not exists)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_out_date date;

-- 2. Update get_all_bookings() RPC function to include check_out_date
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
      room_type AS "roomType",
      amount,
      payment_method AS "paymentMethod",
      status,
      notes,
      payment_id AS "paymentId",
      order_id AS "orderId",
      created_at AS "createdAt"
    FROM public.bookings
  ) b;
  RETURN res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_bookings() TO anon, authenticated;
