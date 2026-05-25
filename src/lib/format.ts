export function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")}€`;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  picked_up: "Retirée",
  cancelled: "Annulée",
};
