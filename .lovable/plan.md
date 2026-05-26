# Plateforme Crazy Toasty — MVP 3 portails

Transformation du site vitrine actuel en plateforme de commande complète avec 3 espaces distincts : **Client**, **Restaurant**, **Manager**.

## 1. Ce qu'on garde

- Le site vitrine actuel (page d'accueil, menu, hero, identité visuelle) reste accessible sur `/`.
- Ajout d'un bouton **"Commander en ligne"** qui mène au portail client.
- Les portails staff sont sur `/staff/login` (pas visible publiquement).

## 2. Base de données (Lovable Cloud)

Nouvelles tables :

- **restaurants** — nom, adresse, ville, lat/lng, téléphone, horaires, zone de livraison (rayon km), actif oui/non
- **menu_items** — nom, description, prix, catégorie, photo, badge, restaurant_id (ou null = dispo partout), disponible oui/non
- **orders** — restaurant_id, client (nom/email/tél), type (livraison / click&collect), adresse de livraison, total, statut (en attente → confirmée → en préparation → prête → livrée/retirée → annulée), mode paiement (CB / sur place), payée oui/non, created_at
- **order_items** — order_id, menu_item_id, nom (snapshot), prix (snapshot), quantité, options
- **user_roles** — table séparée (sécurité) avec rôles `manager`, `restaurant_staff`, lien restaurant_id pour le staff

RLS strict : clients ne voient que leurs commandes (via email/session), staff resto ne voit que les commandes de son resto, manager voit tout.

## 3. Authentification

- **Clients** : commande en invité (email + téléphone suffit), pas de compte obligatoire
- **Staff resto & manager** : email/password obligatoire, redirection `/staff/login`
- Premier compte manager créé manuellement via la base (je te dirai comment)

## 4. Portail Client (`/commander`)

Parcours :

1. Choix du restaurant (si plusieurs) + type : **Livraison** ou **Click & Collect**
2. Si livraison → saisie adresse + vérification zone
3. Menu du resto avec **panier flottant** (ajout/retrait/quantité)
4. Récap commande → infos contact (nom, email, tél)
5. Choix paiement : **CB en ligne (Stripe)** ou **paiement sur place / à la livraison**
6. Page de confirmation avec numéro de commande + statut en temps réel
7. Page `/ma-commande/:id` accessible via lien email pour suivre

## 5. Portail Restaurant (`/staff/restaurant`)

- Liste des commandes du jour en **temps réel** (realtime Supabase), triées par statut
- Notification visuelle/sonore sur nouvelle commande
- Boutons par commande : **Confirmer → En préparation → Prête → Livrée/Retirée** (ou Annuler)
- Onglet **Historique** : commandes passées, filtres date, total CA du jour
- Onglet **Disponibilité** : marquer des items "en rupture" rapidement

## 6. Portail Manager (`/staff/manager`)

- **Restaurants** : créer / éditer / désactiver un restaurant
- **Menu** : ajouter / modifier / supprimer des items, assigner à un ou plusieurs restos, upload photo
- **Staff** : créer des comptes restaurant (envoi invitation email)
- **Stats globales** : CA, nb commandes, par resto et par jour
- Voir toutes les commandes en cours sur tous les restos

## 7. Paiement

- **Stripe Embedded Checkout** (déjà en sandbox sur ton projet)
- Mode "sur place" = commande créée comme `non payée`, statut spécial
- Pas de gestion fiscale automatique (tu factures comme aujourd'hui)

## 8. Livraison

- Pas de tracking livreur dans la v1 (trop complexe pour un MVP)
- Le resto change manuellement le statut "Prête → En livraison → Livrée"
- Vérification simple de zone via rayon km autour du resto

---

## Étapes d'implémentation

```text
Étape 1 — Base de données + auth + rôles + 1er manager
Étape 2 — Portail Client (menu, panier, checkout sans paiement)
Étape 3 — Stripe Embedded Checkout
Étape 4 — Portail Restaurant (temps réel + statuts)
Étape 5 — Portail Manager (CRUD menu + restos + staff)
Étape 6 — Branchement bouton "Commander" sur le site vitrine + emails de confirmation
```

C'est gros (compte ~6 messages de build sérieux). Je te livre étape par étape, on valide au fur et à mesure.

## Détails techniques

- TanStack Start + server functions pour toute la logique back
- Realtime Supabase pour les commandes côté restaurant
- Stripe via le gateway Lovable (utilitaire `createStripeClient`)
- RLS sur toutes les tables + table `user_roles` séparée avec fonction `has_role` security definer

---

**Si tu valides ce plan, je démarre par l'étape 1 (base de données + auth + rôles).** Dis-moi aussi si tu veux qu'on commence par 1 seul restaurant (le tien actuel à Jean Jaurès) ou si tu veux pouvoir en ajouter plusieurs dès le départ via le portail manager.
