/*
  # Add Omniva integration fields

  1. New Fields
    - Add Omniva-specific fields to orders table for tracking parcel machine deliveries
    - Fields include parcel machine ID, name, barcode, and shipment status

  2. Security
    - Ensure RLS policies are updated to include new fields
*/

-- Add Omniva-specific fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_id TEXT,
ADD COLUMN IF NOT EXISTS omniva_parcel_machine_name TEXT,
ADD COLUMN IF NOT EXISTS omniva_barcode TEXT,
ADD COLUMN IF NOT EXISTS omniva_shipment_status TEXT;

-- Add comments to the new columns
COMMENT ON COLUMN public.orders.omniva_parcel_machine_id IS 'ID of the selected Omniva parcel machine';
COMMENT ON COLUMN public.orders.omniva_parcel_machine_name IS 'Name of the selected Omniva parcel machine';
COMMENT ON COLUMN public.orders.omniva_barcode IS 'Barcode/tracking number for Omniva shipment';
COMMENT ON COLUMN public.orders.omniva_shipment_status IS 'Status of Omniva shipment (e.g., REGISTERED, FAILED)';

-- Update admin_orders_view to include the new fields
CREATE OR REPLACE VIEW public.admin_orders_view AS
SELECT 
  o.id,
  o.order_number,
  o.customer_name,
  o.customer_email,
  o.customer_phone,
  o.shipping_address,
  o.shipping_city,
  o.shipping_postal_code,
  o.shipping_country,
  o.total_amount,
  o.currency,
  o.status,
  o.notes,
  o.created_at,
  o.updated_at,
  o.user_id,
  o.omniva_parcel_machine_id,
  o.omniva_parcel_machine_name,
  o.omniva_barcode,
  o.omniva_shipment_status,
  COUNT(oi.id) AS item_count,
  (
    SELECT op.status
    FROM order_payments op
    WHERE op.order_id = o.id
    ORDER BY op.created_at DESC
    LIMIT 1
  ) AS payment_status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;