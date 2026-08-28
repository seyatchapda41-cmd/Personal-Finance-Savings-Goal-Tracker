// Creates the first staff account, since signup by phone needs an SMS provider
// and the panel needs somebody to let in before anyone can use it.
//
//   node --env-file=.env.local scripts/create-founder.mjs +237600000000 "Passw0rd" "Your Name"
//
// The phone still has to appear in ADMIN_PHONES for the panel to open.

import { createClient } from "@supabase/supabase-js";

const LOGIN_EMAIL_DOMAIN = "phone.tempora.app";

function normalizePhone(input) {
  const stripped = String(input).replace(/[\s().-]/g, "");
  if (!stripped) return "";
  const digits = stripped.replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return "";
  return `+${digits}`;
}

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const [rawPhone, password, fullName = "Founder"] = process.argv.slice(2);

const phone = normalizePhone(rawPhone ?? "");
if (!/^\+\d{8,15}$/.test(phone)) {
  fail("Give a phone number with its country code, for example +237600000000");
}
if (
  !password ||
  password.length < 8 ||
  !/[A-Z]/.test(password) ||
  !/\d/.test(password)
) {
  fail("Password needs 8 characters or more, one capital letter and one number.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  fail("Run this with: node --env-file=.env.local scripts/create-founder.mjs ...");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const loginEmail = `p${phone.replace(/\D/g, "")}@${LOGIN_EMAIL_DOMAIN}`;

const { data, error } = await supabase.auth.admin.createUser({
  email: loginEmail,
  password,
  email_confirm: true,
  user_metadata: {
    phone,
    full_name: fullName,
    plan: "premium",
    email: "",
  },
});

if (error) {
  fail(`Supabase refused the account: ${error.message}`);
}

// The signup trigger fills profiles, but this script is the bootstrap path so it
// verifies rather than assumes.
const { error: profileError } = await supabase.from("profiles").upsert(
  {
    id: data.user.id,
    phone,
    full_name: fullName,
    plan: "premium",
    email: null,
  },
  { onConflict: "id" },
);

if (profileError) {
  fail(`Account exists but its profile row failed: ${profileError.message}`);
}

console.log(`\n  Staff account ready for ${phone} (${fullName}).`);
console.log(`  Add it to ADMIN_PHONES in .env.local, restart, then sign in at /admin/login.\n`);
