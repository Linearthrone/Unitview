# Unitview — Quick start

## Run from source

```bash
npm install
npm run dev
```

Login: `admin` / `password`. If a password change is required, use `ChargeBoard26`.

## Windows installer

See **[WINDOWS_PACK.md](WINDOWS_PACK.md)**. Short form on a Windows box:

```bat
npm install
npm run dist:win
```

Installer: `release\Unitview-Setup-<version>.exe` (version from root `package.json`)

After the first 5.4-line install, use **Help → Check for Updates** instead of uninstalling.

That is the production pack. `release/` is gitignored — it will never appear as a committed file.

**Version:** root `package.json`. Every commit increments the patch.
