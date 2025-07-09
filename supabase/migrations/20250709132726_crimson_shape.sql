@@ .. @@
 -- Create Omniva shipping settings table
-CREATE TABLE IF NOT EXISTS omniva_shipping_settings (
+CREATE TABLE omniva_shipping_settings (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   price numeric(10,2) NOT NULL DEFAULT 3.99,
   currency text NOT NULL DEFAULT 'EUR',
@@ .. @@
 
 -- Create policies
 CREATE POLICY "Authenticated users can manage shipping settings"
-  ON omniva_shipping_settings
+  ON omniva_shipping_settings 
   FOR ALL
   TO authenticated
   USING (true)