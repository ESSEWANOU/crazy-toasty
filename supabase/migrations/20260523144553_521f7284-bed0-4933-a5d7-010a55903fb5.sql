
-- 1) Drop permissive WITH CHECK (true) INSERT policies. Orders are created exclusively
--    via the server-side createOrder serverFn using the service role client.
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;

-- 2) Restrict Realtime channel subscriptions to staff only.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can receive realtime messages" ON realtime.messages;
CREATE POLICY "Staff can receive realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'restaurant_staff'::public.app_role
  )
);

-- 3) Lock down SECURITY DEFINER token lookup functions — only the server-side
--    service role calls them; revoke from anon/authenticated.
REVOKE EXECUTE ON FUNCTION public.get_order_by_token(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_order_items_by_token(uuid) FROM anon, authenticated, PUBLIC;
