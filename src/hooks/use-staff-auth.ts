import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type StaffRole = { role: "manager" | "restaurant_staff"; restaurant_id: string | null };

export function useStaffAuth(requiredRole?: "manager" | "restaurant_staff") {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/staff/login" }); return; }
      setUserId(session.user.id);
      const { data } = await supabase.from("user_roles").select("role, restaurant_id").eq("user_id", session.user.id);
      const r = (data ?? []) as StaffRole[];
      setRoles(r);
      if (requiredRole && !r.some((x) => x.role === requiredRole)) {
        if (r.some((x) => x.role === "manager")) navigate({ to: "/staff/manager" });
        else if (r.some((x) => x.role === "restaurant_staff")) navigate({ to: "/staff/restaurant" });
        else navigate({ to: "/staff/login" });
        return;
      }
      setLoading(false);
    };
    check();
  }, [requiredRole, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/staff/login" });
  };

  return { loading, roles, userId, signOut };
}
