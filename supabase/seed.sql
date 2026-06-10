-- ============================================================
-- Crazy Toasty — Seed : products
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- APRÈS avoir exécuté setup.sql (section 10 — table products)
-- ============================================================

insert into public.products
  (name, description, price, image_url, category,
   is_new, is_best_seller, is_available, is_signature, is_featured,
   display_order, calories, options)
values

-- ── Riz Crousty ─────────────────────────────────────────────────
('Crousty Original — Douceur Thaï',
 'Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, tender de poulet ultra croustillant, touche de sauce Thaï douce et sucrée — sans piquant, la valeur sûre.',
 9.90, null, 'Riz Crousty', false, false, true, false, true, 1, null, '[]'::jsonb),

('Korean Fusion',
 'Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, tender croustillant, twist Mayo Chili Korean-Samouraï — la star !',
 9.90, null, 'Riz Crousty', false, true, true, false, true, 2, null, '[]'::jsonb),

('Cheesy King',
 'Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, tender croustillant, cheddar fondu coulant — pour les vrais amateurs de fromage.',
 9.90, null, 'Riz Crousty', false, false, true, false, false, 3, null, '[]'::jsonb),

('Verde Bomb — Sauce du Chef',
 'Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, tender croustillant, nappé de notre fameuse African Verde — création signature du chef.',
 10.90, null, 'Riz Crousty', false, false, true, true, false, 4, null, '[]'::jsonb),

('Royal Cordon Bleu',
 'Riz Thaï parfumé, sauce Croustille maison ultra crémeuse, oignons frits, cordon bleu maison ultra fondant (poulet + jambon + fromage qui coule). Sauce au choix : Thaï, Ranch, Cheddar ou Verde.',
 11.90, null, 'Riz Crousty', false, false, true, false, false, 5, null, '[]'::jsonb),

-- ── Accompagnements ─────────────────────────────────────────────
('Frites',
 null,
 4.00, null, 'Accompagnements', false, false, true, false, false, 10, null, '[]'::jsonb),

('Frites Cheddar Crazy',
 'Frites nappées de cheddar fondu coulant et oignons frits croustillants.',
 4.50, null, 'Accompagnements', false, false, true, false, false, 11, null, '[]'::jsonb),

('Frites Crazy Style',
 'La signature : poulet croustillant effiloché, sauce Korean crémeuse, oignons frits.',
 7.90, null, 'Accompagnements', false, true, true, true, false, 12, null, '[]'::jsonb),

('Onion Rings ×4',
 '4 anneaux d''oignons panés.',
 4.50, null, 'Accompagnements', false, false, true, false, false, 13, null, '[]'::jsonb),

('Tenders Croustillants ×3',
 '3 filets de poulet panés dorés, ultra croustillants dehors, juteux dedans.',
 5.50, null, 'Accompagnements', false, false, true, false, false, 14, null, '[]'::jsonb),

('Nuggets Crousti ×4',
 '4 nuggets de poulet dorés et croustillants.',
 4.50, null, 'Accompagnements', false, false, true, false, false, 15, null, '[]'::jsonb),

('Crazy Pop ×6',
 'Bouchées de poulet pop-corn ultra croustillantes. 1 sauce au choix offerte.',
 5.90, null, 'Accompagnements', false, false, true, false, false, 16, null, '[]'::jsonb),

-- ── Crousty Bowl Salade ─────────────────────────────────────────
('Crazy Caesar Crousty',
 'Salade fraîche, tomate, tomates cerises, concombre, oignons rouges, croûtons dorés, poulet ultra croustillant, parmesan râpé et sauce Caesar maison.',
 10.90, null, 'Crousty Bowl Salade', true, false, true, false, false, 20, null, '[]'::jsonb),

-- ── Burgers ─────────────────────────────────────────────────────
('Classic Master',
 'Filet de poulet ultra croustillant, cheddar fondant, salade fraîche, tomate juteuse, sauce maison signature.',
 10.40, null, 'Burgers', false, false, true, false, false, 30, null, '[]'::jsonb),

('Spicy Devil',
 'Filet croustillant, cheddar fondu, tomate, jalapeños relevés, sauce spicy maison qui réveille les papilles.',
 11.40, null, 'Burgers', false, false, true, false, false, 31, null, '[]'::jsonb),

('Bacon Attack',
 'Filet croustillant, bacon fumé bien grillé, cheddar fondant, tomate fraîche, sauce Tasty.',
 12.40, null, 'Burgers', false, false, true, false, false, 32, null, '[]'::jsonb),

-- ── Wings ───────────────────────────────────────────────────────
('Wings Nature Classic',
 'Wings croustillantes dorées, sauce au choix à part.',
 7.90, null, 'Wings', false, false, true, false, false, 40, null,
 '[{"id":"x6","name":"×6","price":7.90,"type":"size"},{"id":"x10","name":"×10","price":11.90,"type":"size"},{"id":"x16","name":"×16","price":17.90,"type":"size"}]'::jsonb),

('Wings Firestorm',
 'Wings croustillantes nappées de notre sauce piquante maison qui claque.',
 8.50, null, 'Wings', false, true, true, false, false, 41, null,
 '[{"id":"x6","name":"×6","price":8.50,"type":"size"},{"id":"x10","name":"×10","price":12.90,"type":"size"},{"id":"x16","name":"×16","price":18.90,"type":"size"}]'::jsonb),

('Wings Smoky BBQ',
 'Wings croustillantes glacées à notre sauce BBQ fumée maison.',
 8.50, null, 'Wings', false, false, true, false, false, 42, null,
 '[{"id":"x6","name":"×6","price":8.50,"type":"size"},{"id":"x10","name":"×10","price":12.90,"type":"size"},{"id":"x16","name":"×16","price":18.90,"type":"size"}]'::jsonb),

-- ── Sauces ──────────────────────────────────────────────────────
('Sauce Crazy Croustille',
 'Notre sauce signature maison ultra crémeuse, douce et parfumée — la star qui nappe nos bowls.',
 1.00, null, 'Sauces', false, false, true, true, false, 50, null, '[]'::jsonb),

('Sauce Crazy Burger',
 'Sauce maison rosée légèrement relevée, parfaite pour vos burgers et frites.',
 1.00, null, 'Sauces', false, false, true, false, false, 51, null, '[]'::jsonb),

('Sauce Cheddar',
 'Cheddar fondu coulant, riche et onctueux.',
 1.00, null, 'Sauces', false, false, true, false, false, 52, null, '[]'::jsonb),

('Sauce BBQ Smoky',
 'Sauce BBQ fumée maison, sucrée-salée.',
 1.00, null, 'Sauces', false, false, true, false, false, 53, null, '[]'::jsonb),

('Sauce Ranch',
 'Sauce ranch crémeuse aux herbes fraîches, douce et rafraîchissante.',
 1.00, null, 'Sauces', false, false, true, false, false, 54, null, '[]'::jsonb),

('Sauce Korean Spicy',
 'Sauce coréenne rouge intense, sucrée-légèrement piquante.',
 1.00, null, 'Sauces', false, false, true, false, false, 55, null, '[]'::jsonb),

('Sauce African Verde',
 'Notre sauce signature du chef, herbes fraîches, piment doux et coriandre.',
 1.00, null, 'Sauces', false, false, true, true, false, 56, null, '[]'::jsonb),

('Sauce Algérienne',
 'Sauce épicée légèrement piquante, parfumée aux légumes et épices.',
 1.00, null, 'Sauces', false, false, true, false, false, 57, null, '[]'::jsonb),

('Ketchup',
 'Ketchup classique pour les puristes.',
 1.00, null, 'Sauces', false, false, true, false, false, 58, null, '[]'::jsonb),

('Mayonnaise',
 'Mayo onctueuse.',
 1.00, null, 'Sauces', false, false, true, false, false, 59, null, '[]'::jsonb),

-- ── Box ─────────────────────────────────────────────────────────
('Box A · Combo Solo',
 '1 Croustille au choix + 1 Boisson 33cl + 1 Sauce offerte.',
 11.90, null, 'Box', false, false, true, false, false, 60, null, '[]'::jsonb),

('Box B · Combo Express',
 '3 Tenders OU 6 Nuggets Crousti + 2 Wings + 1 Boisson 33cl.',
 9.90, null, 'Box', false, false, true, false, false, 61, null, '[]'::jsonb),

('Box C · Crazy Box',
 '1 Croustille au choix + 3 Wings (sauce au choix) + 3 Tenders + 1 Boisson 33cl + 1 Sauce offerte.',
 16.90, null, 'Box', false, true, true, false, false, 62, null, '[]'::jsonb),

('Box D · Discovery Box',
 '2 Crousty Rice au choix + 6 Wings + 1 Onion Rings ×6 + 2 Boissons 33cl + 2 Sauces offertes.',
 34.90, null, 'Box', false, false, true, false, false, 63, null, '[]'::jsonb),

-- ── Boissons ────────────────────────────────────────────────────
('Eau (50cl)',
 'Plate ou pétillante.',
 1.50, null, 'Boissons', false, false, true, false, false, 70, null, '[]'::jsonb),

('Soda (33cl)',
 'Coca, Coca Zero, Sprite, Fanta, Oasis.',
 2.00, null, 'Boissons', false, false, true, false, false, 71, null, '[]'::jsonb),

('Citronnade Maison',
 'Pressée, faite maison chaque jour, fraîche et désaltérante.',
 3.50, null, 'Boissons', false, false, true, false, false, 72, null, '[]'::jsonb),

('Thé glacé pêche',
 'Bouteille 33cl.',
 2.50, null, 'Boissons', false, false, true, false, false, 73, null, '[]'::jsonb),

('Milkshake Classic',
 'Milkshake onctueux au choix : vanille, chocolat, fraise ou Oreo.',
 5.80, null, 'Boissons', false, false, true, false, false, 74, null, '[]'::jsonb),

('Milkshake Speculoos Dream',
 'Milkshake ultra crémeux au biscuit speculoos qui fond en bouche.',
 5.80, null, 'Boissons', false, false, true, false, false, 75, null, '[]'::jsonb),

('Milkshake Caramel Beurre Salé',
 'Milkshake onctueux au caramel beurre salé maison, gourmandise absolue.',
 5.80, null, 'Boissons', false, false, true, false, false, 76, null, '[]'::jsonb),

-- ── Desserts ────────────────────────────────────────────────────
('Cookie Noisette Chocolat Maison',
 'Cookie XXL maison aux pépites de chocolat fondant et éclats de noisettes torréfiées.',
 3.90, null, 'Desserts', false, false, true, false, false, 80, null, '[]'::jsonb),

('Brownie Maison',
 'Brownie maison ultra fondant au chocolat noir intense.',
 3.50, null, 'Desserts', false, false, true, false, false, 81, null, '[]'::jsonb),

('Speculoos Cheesecake',
 'Cheesecake maison crémeux sur lit de biscuit speculoos croustillant.',
 4.50, null, 'Desserts', false, false, true, false, false, 82, null, '[]'::jsonb),

('Glace 2 Boules',
 'Vanille · Chocolat · Fraise.',
 3.50, null, 'Desserts', false, false, true, false, false, 83, null, '[]'::jsonb),

-- ── Kids ────────────────────────────────────────────────────────
('Le Kids Combo',
 'Mini croustille ou 4 nuggets + Capri-Sun, frites maison.',
 6.90, null, 'Kids', false, false, true, false, false, 90, null, '[]'::jsonb);
