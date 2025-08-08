@@ .. @@
 -- Enable Row Level Security (RLS) for stripe_sync_queue
 ALTER TABLE public.stripe_sync_queue ENABLE ROW LEVEL SECURITY;
 
--- Policy for service_role to manage the queue
-CREATE POLICY "Service role can manage sync queue" ON public.stripe_sync_queue
-FOR ALL USING (true) WITH CHECK (true);
+-- Policy for service_role to manage the queue (idempotent)
+DO $$
+BEGIN
+  IF NOT EXISTS (
+    SELECT 1 FROM pg_policies 
+    WHERE tablename = 'stripe_sync_queue' 
+    AND policyname = 'Service role can manage sync queue'
+  ) THEN
+    CREATE POLICY "Service role can manage sync queue" ON public.stripe_sync_queue
+    FOR ALL TO service_role USING (true) WITH CHECK (true);
+  END IF;
+END $$;
 
 -- Policy for authenticated users to view sync queue
-CREATE POLICY "Authenticated users can view sync queue" ON public.stripe_sync_queue
-FOR SELECT TO authenticated USING (true);