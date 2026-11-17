import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminSupabase } from "@/lib/supabase/admin";

export type PlatformSettings = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcement: string;
  announcementActive: boolean;
  signupsEnabled: boolean;
  updatedBy: string;
  updatedAt: string | null;
};

export const DEFAULT_SETTINGS: PlatformSettings = {
  maintenanceMode: false,
  maintenanceMessage:
    "Tempora is down for planned maintenance. Please try again shortly.",
  announcement: "",
  announcementActive: false,
  signupsEnabled: true,
  updatedBy: "",
  updatedAt: null,
};

// Read once per request. Every public page consults this, so it must fail open:
// a database problem should never take the whole site down.
export const readPlatformSettings = cache(
  async (): Promise<PlatformSettings> => {
    if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
    const supabase = createAdminSupabase();
    if (!supabase) return DEFAULT_SETTINGS;

    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error || !data) return DEFAULT_SETTINGS;

    return {
      maintenanceMode: Boolean(data.maintenance_mode),
      maintenanceMessage:
        (data.maintenance_message as string | null) ||
        DEFAULT_SETTINGS.maintenanceMessage,
      announcement: (data.announcement as string | null) ?? "",
      announcementActive: Boolean(data.announcement_active),
      signupsEnabled: data.signups_enabled !== false,
      updatedBy: (data.updated_by as string | null) ?? "",
      updatedAt: data.updated_at ? String(data.updated_at) : null,
    };
  },
);
