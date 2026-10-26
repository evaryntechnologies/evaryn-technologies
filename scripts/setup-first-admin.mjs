import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_ADMIN_SETUP_KEY;
const uid = process.env.SUPABASE_ADMIN_USER_ID;

if (!url || !secret || !uid) {
  throw new Error("Missing administrator setup configuration.");
}

const supabase = createClient(url, secret, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, error } = await supabase.auth.admin.getUserById(uid);

if (error || !data.user) {
  throw new Error("Administrator account not found.");
}

const { error: updateError } =
  await supabase.auth.admin.updateUserById(uid, {
    app_metadata: {
      ...data.user.app_metadata,
      role: "SUPER_ADMIN",
    },
  });

if (updateError) {
  throw new Error(updateError.message);
}

console.log("Super Admin role assigned successfully.");