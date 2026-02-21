# KIUMA Cloudflare R2 - Deploy All Workers
# Run from the cloudflare/ directory:
#   .\deploy-all.ps1
#
# Prerequisites:
#   npm install -g wrangler
#   For EACH worker, you need a separate Cloudflare account OR
#   use the same account with different R2 buckets.
#
# Each worker needs:
#   1. An R2 bucket created in the Cloudflare dashboard
#   2. wrangler secret put ADMIN_TOKEN (set in each worker's directory)

$ErrorActionPreference = "Stop"
$workers = @("video1", "video2", "video3", "video4", "video5", "audio", "library")

Write-Host "`n=== KIUMA Cloudflare R2 Multi-Account Deployment ===" -ForegroundColor Cyan
Write-Host "Deploying $($workers.Count) workers...`n"

foreach ($w in $workers) {
    $dir = Join-Path $PSScriptRoot $w
    if (Test-Path (Join-Path $dir "wrangler.toml")) {
        Write-Host "--- Deploying kiuma-$w ---" -ForegroundColor Yellow
        Push-Location $dir
        try {
            npx wrangler deploy
            Write-Host "  OK: kiuma-$w deployed" -ForegroundColor Green
        } catch {
            Write-Host "  FAIL: kiuma-$w - $_" -ForegroundColor Red
        }
        Pop-Location
    } else {
        Write-Host "  SKIP: $w (no wrangler.toml)" -ForegroundColor DarkGray
    }
}

Write-Host "`n=== Deployment complete ===" -ForegroundColor Cyan
Write-Host "Next steps:"
Write-Host "  1. For each worker, run: cd <worker> && npx wrangler secret put ADMIN_TOKEN"
Write-Host "  2. Copy the worker URLs from the output above into the KIUMA admin panel Settings"
Write-Host "  3. Worker URLs will be like: https://kiuma-video1.<account>.workers.dev"
