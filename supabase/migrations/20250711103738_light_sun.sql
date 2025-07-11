/*
  # Eemalda tellimuste ja saatmisega seotud tabelid

  1. Eemaldatavad tabelid
    - `orders` - tellimuste tabel
    - `order_items` - tellimuste ridade tabel
    - `order_payments` - tellimuse maksete tabel
    - `omniva_shipping_settings` - Omniva saatmise seaded
    - `omniva_parcel_machines` - Omniva pakiautomaadid
    - `maksekeskus_config` - Maksekeskuse konfiguratsioon
  
  2. Eemaldatavad vaated
    - `admin_orders_view` - administraatori tellimuste vaade
    - `admin_order_stats` - tellimuste statistika vaade
    - `admin_payment_config_view` - maksekonfiguratsiooni vaade
  
  3. Eemaldatavad funktsioonid
    - Kõik tellimuste ja saatmisega seotud funktsioonid
*/

-- Eemalda vaated
DROP VIEW IF EXISTS admin_orders_view;
DROP VIEW IF EXISTS admin_order_stats;
DROP VIEW IF EXISTS admin_payment_config_view;

-- Eemalda tabelid
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS order_payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS omniva_shipping_settings;
DROP TABLE IF EXISTS omniva_parcel_machines;
DROP TABLE IF EXISTS maksekeskus_config;

-- Eemalda funktsioonid
DROP FUNCTION IF EXISTS update_order_on_new_payment();
DROP FUNCTION IF EXISTS update_order_on_payment_status();
DROP FUNCTION IF EXISTS update_order_payment_status();
DROP FUNCTION IF EXISTS update_order_updated_at();
DROP FUNCTION IF EXISTS update_order_payments_updated_at();
DROP FUNCTION IF EXISTS update_omniva_shipping_settings_updated_at();
DROP FUNCTION IF EXISTS update_omniva_parcel_machines_updated_at();
DROP FUNCTION IF EXISTS update_maksekeskus_config_updated_at();
DROP FUNCTION IF EXISTS generate_order_number();