// Shim mono-restaurant pour Crazy Toasty
export interface Site {
  id: string;
  site_id: string;
  name: string;
  type: 'restaurant' | 'foodtruck' | 'kiosk';
  address: string | null;
  phone: string | null;
  is_active: boolean;
  opening_time: string | null;
  closing_time: string | null;
  weekly_hours: any;
}

const CRAZY_TOASTY_SITE: Site = {
  id: '1',
  site_id: 'crazy-toasty',
  name: 'Crazy Toasty',
  type: 'restaurant',
  address: '2 Rue Paul Mériel, 31000 Toulouse',
  phone: null,
  is_active: true,
  opening_time: '11:00',
  closing_time: '23:00',
  weekly_hours: null,
};

export const useSites = () => ({
  sites: [CRAZY_TOASTY_SITE],
  isLoading: false,
  error: null,
});

export const useRestaurants = () => useSites();
