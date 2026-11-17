$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dst = Join-Path $root "admin-dashboard"
$src = Join-Path $root "src"

function Copy-File($from, $to) {
  $dir = Split-Path $to -Parent
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  Copy-Item -LiteralPath $from -Destination $to -Force
}

function Copy-Tree($from, $to) {
  if (-not (Test-Path $to)) {
    New-Item -ItemType Directory -Path $to -Force | Out-Null
  }
  Copy-Item -Path (Join-Path $from "*") -Destination $to -Recurse -Force
}

Copy-Tree (Join-Path $src "app\admin") (Join-Path $dst "src\app\(panel)")
Copy-File (Join-Path $src "app\(admin-auth)\admin\login\page.tsx") (Join-Path $dst "src\app\login\page.tsx")
Copy-Tree (Join-Path $src "components\admin") (Join-Path $dst "src\components\admin")
Copy-Tree (Join-Path $src "lib\admin") (Join-Path $dst "src\lib\admin")
Copy-File (Join-Path $src "app\actions\admin.ts") (Join-Path $dst "src\app\actions\admin.ts")
Copy-File (Join-Path $src "app\actions\admin-auth.ts") (Join-Path $dst "src\app\actions\admin-auth.ts")
Copy-File (Join-Path $src "app\globals.css") (Join-Path $dst "src\app\globals.css")

$shared = @(
  "lib\config.ts",
  "lib\cookie-names.ts",
  "lib\phone.ts",
  "lib\password.ts",
  "lib\format.ts",
  "lib\types.ts",
  "lib\plans.ts",
  "lib\ids.ts",
  "lib\support.ts",
  "lib\known-accounts-server.ts",
  "lib\known-accounts.ts",
  "lib\device-profiles.ts",
  "lib\themes.ts",
  "lib\fonts.ts",
  "lib\demo\accounts.ts",
  "lib\demo\session.ts",
  "lib\demo\ledger.ts",
  "lib\auth\profile.ts",
  "lib\auth\phone-identity.ts",
  "lib\auth\phone-login.ts",
  "lib\auth\password-hash.ts",
  "lib\supabase\admin.ts",
  "lib\supabase\server.ts",
  "lib\supabase\fetch.ts",
  "lib\supabase\middleware.ts",
  "lib\supabase\client.ts",
  "components\logo.tsx",
  "components\night-mode-toggle.tsx",
  "components\chat-thread.tsx",
  "components\visible-field.tsx"
)

foreach ($rel in $shared) {
  Copy-File (Join-Path $src $rel) (Join-Path $dst "src\$rel")
}

Copy-Tree (Join-Path $root "public\brand") (Join-Path $dst "public\brand")

Get-ChildItem -Path (Join-Path $dst "src") -Recurse -Include *.ts,*.tsx | ForEach-Object {
  $c = Get-Content -LiteralPath $_.FullName -Raw
  if ($null -eq $c) { return }
  $n = $c
  $n = $n -replace 'redirect\("/admin/login"\)', 'redirect("/login")'
  $n = $n -replace "redirect\('/admin/login'\)", "redirect('/login')"
  $n = $n -replace '"/admin/login"', '"/login"'
  $n = $n -replace "'/admin/login'", "'/login'"
  $n = $n -replace 'href="/admin"', 'href="/"'
  $n = $n -replace "href='/admin'", "href='/'"
  $n = $n -replace 'pathname === "/admin"', 'pathname === "/"'
  $n = $n -replace 'redirect\("/admin"\)', 'redirect("/")'
  $n = $n -replace 'revalidatePath\("/admin"', 'revalidatePath("/"'
  $n = $n -replace '"/admin/', '"/'
  $n = $n -replace "'/admin/", "'/"
  $n = $n -replace 'href: "/admin"', 'href: "/"'
  $n = $n -replace 'reportsHref = "/admin/reports"', 'reportsHref = "/reports"'
  $n = $n -replace 'reportsHref === "/admin"', 'reportsHref === "/"'
  if ($n -ne $c) {
    Set-Content -LiteralPath $_.FullName -Value $n -NoNewline
  }
}

Write-Host "Copied admin dashboard sources."
