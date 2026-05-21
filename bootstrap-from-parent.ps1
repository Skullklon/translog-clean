# =========================================================================
# bootstrap-from-parent.ps1
#
# Run this ONCE, immediately after this translog-clean/ folder is first
# created, to copy all the bulk source content from the parent workspace.
# Some files were intentionally left out of the initial scaffold because
# they were too large to ship via the tool channel that generated this
# folder.
#
# How to run:
#   1. Open Windows PowerShell.
#   2. cd "C:\Users\yomay\Desktop\Claude Project in me\translog-clean"
#   3. .\bootstrap-from-parent.ps1
#
# What it copies (parent -> here):
#   * App/                  TransLog prototype HTML/JSX files
#   * landing-page/         Nexura RD marketing site
#   * transport-app/        Node.js backend, migrations, scripts, admin UI
#   * deployment/           server setup docs, nginx configs, shell scripts
#
# What it leaves alone:
#   * translog-clean/README.md, CHANGELOG.md, .gitignore   (hand-adapted)
#   * translog-clean/.github/workflows/                    (deploy workflow)
#
# What it cleans up:
#   * deployment/nginx/nexurard.org.conf       (deprecated, old domain)
#   * deployment/nginx/app.nexurard.org.conf   (deprecated, old domain)
#
# Safe to re-run.
# =========================================================================

$ErrorActionPreference = 'Stop'

$here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$parent = Split-Path -Parent $here

if (-not (Test-Path $parent)) {
    Write-Error "Cannot find parent workspace at: $parent"
    exit 1
}

$folders = @('App', 'landing-page', 'transport-app', 'deployment')

Write-Host ""
Write-Host "Bootstrapping translog-clean/ from parent: $parent"
Write-Host ""

foreach ($f in $folders) {
    $src = Join-Path $parent $f
    $dst = Join-Path $here   $f

    if (-not (Test-Path $src)) {
        Write-Warning ("Skipped - parent folder missing: " + $src)
        continue
    }

    Write-Host ("[+] Copying " + $f + "/  ->  translog-clean/" + $f + "/")

    if (-not (Test-Path $dst)) {
        New-Item -ItemType Directory -Force -Path $dst | Out-Null
    }

    Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force
}

$deprecated = @(
    (Join-Path $here 'deployment\nginx\nexurard.org.conf'),
    (Join-Path $here 'deployment\nginx\app.nexurard.org.conf')
)
foreach ($file in $deprecated) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host ("[-] Removed deprecated stub: " + (Split-Path -Leaf $file))
    }
}

Write-Host ""
Write-Host "Done. translog-clean/ now mirrors the parent workspace."
Write-Host ""
Write-Host "Next steps:"
Write-Host "  git init -b main"
Write-Host "  git add ."
Write-Host "  git commit -m 'Initial commit'"
Write-Host "  git remote add origin https://github.com/Skullklon/translog-clean.git"
Write-Host "  git push -u origin main --force"
Write-Host ""
Write-Host "Then on GitHub:"
Write-Host "  Settings -> Pages -> Source -> GitHub Actions"
