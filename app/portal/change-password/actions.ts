"use server";

import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function changeInitialPassword(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 12 || password !== confirm) {
    redirect("/portal/change-password?error=invalid");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/portal/change-password?error=failed");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    redirect("/portal/change-password?error=configuration");
  }

  const admin = createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: current, error: readError } =
    await admin.auth.admin.getUserById(user.id);

  if (readError || !current.user) {
    redirect("/portal/change-password?error=failed");
  }

  const { error: updateError } =
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...current.user.app_metadata,
        must_change_password: false,
      },
    });

  if (updateError) {
    redirect("/portal/change-password?error=failed");
  }

  await supabase.auth.signOut();
  redirect("/portal/login?passwordChanged=1");
}