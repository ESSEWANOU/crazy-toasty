
-- ============================================================
-- ROLES
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('manager', 'restaurant_staff');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  restaurant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, restaurant_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff_of_restaurant(_user_id UUID, _restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'restaurant_staff'
      AND restaurant_id = _restaurant_id
  ) OR public.has_role(_user_id, 'manager')
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- ============================================================
-- RESTAURANTS
-- ============================================================
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  lat NUMERIC,
  lng NUMERIC,
  opening_hours TEXT,
  delivery_radius_km NUMERIC NOT NULL DEFAULT 5,
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
  min_order_cents INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  accepts_delivery BOOLEAN NOT NULL DEFAULT TRUE,
  accepts_pickup BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active restaurants" ON public.restaurants
  FOR SELECT
  USING (active = TRUE OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers manage restaurants" ON public.restaurants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  category TEXT NOT NULL,
  image_url TEXT,
  badge TEXT,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available items" ON public.menu_items
  FOR SELECT
  USING (available = TRUE OR public.has_role(auth.uid(), 'manager') OR (restaurant_id IS NOT NULL AND public.is_staff_of_restaurant(auth.uid(), restaurant_id)));

CREATE POLICY "Managers manage items" ON public.menu_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff toggle availability" ON public.menu_items
  FOR UPDATE TO authenticated
  USING (restaurant_id IS NOT NULL AND public.is_staff_of_restaurant(auth.uid(), restaurant_id))
  WITH CHECK (restaurant_id IS NOT NULL AND public.is_staff_of_restaurant(auth.uid(), restaurant_id));

CREATE INDEX idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON public.menu_items(category);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TYPE public.order_status AS ENUM (
  'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'picked_up', 'cancelled'
);
CREATE TYPE public.order_type AS ENUM ('delivery', 'pickup');
CREATE TYPE public.payment_method AS ENUM ('online', 'on_site');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type public.order_type NOT NULL,
  delivery_address TEXT,
  delivery_notes TEXT,
  subtotal_cents INTEGER NOT NULL,
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_session_id TEXT,
  access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Staff view restaurant orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_staff_of_restaurant(auth.uid(), restaurant_id));

CREATE POLICY "Staff update restaurant orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_staff_of_restaurant(auth.uid(), restaurant_id))
  WITH CHECK (public.is_staff_of_restaurant(auth.uid(), restaurant_id));

CREATE INDEX idx_orders_restaurant_status ON public.orders(restaurant_id, status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_access_token ON public.orders(access_token);

-- Public lookup of single order by access_token (returned at creation, used in confirmation page)
CREATE OR REPLACE FUNCTION public.get_order_by_token(_token UUID)
RETURNS TABLE (
  id UUID, order_number INTEGER, restaurant_id UUID, restaurant_name TEXT,
  customer_name TEXT, customer_phone TEXT, order_type public.order_type,
  delivery_address TEXT, subtotal_cents INTEGER, delivery_fee_cents INTEGER,
  total_cents INTEGER, status public.order_status, payment_method public.payment_method,
  paid BOOLEAN, created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.restaurant_id, r.name, o.customer_name, o.customer_phone,
         o.order_type, o.delivery_address, o.subtotal_cents, o.delivery_fee_cents,
         o.total_cents, o.status, o.payment_method, o.paid, o.created_at
  FROM public.orders o
  JOIN public.restaurants r ON r.id = o.restaurant_id
  WHERE o.access_token = _token
$$;

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  options TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Staff view order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND public.is_staff_of_restaurant(auth.uid(), o.restaurant_id)
  ));

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- Public read for order items via order access_token
CREATE OR REPLACE FUNCTION public.get_order_items_by_token(_token UUID)
RETURNS TABLE (id UUID, name TEXT, unit_price_cents INTEGER, quantity INTEGER, options TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oi.id, oi.name, oi.unit_price_cents, oi.quantity, oi.options
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.access_token = _token
$$;

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_menu_items_updated BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- ============================================================
-- SEED — Restaurant Jean Jaurès
-- ============================================================
INSERT INTO public.restaurants (id, name, address, city, phone, lat, lng, opening_hours, delivery_radius_km, delivery_fee_cents, min_order_cents)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Crazy Toasty — Jean Jaurès',
  '2 rue Paul Mériel',
  'Toulouse',
  '+33500000000',
  43.6064,
  1.4505,
  'Lun-Dim 11h30-14h30 / 18h30-22h30',
  5,
  290,
  1200
);
