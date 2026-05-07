# OLLAMA Automate - Lancement du projet

## Prerequis

- Node.js 20+
- `pnpm` (le repo utilise `pnpm@10`)

## Installation

Depuis la racine du projet:

```bash
pnpm install
```

## Lancer tout le monorepo (Turbo)

Depuis la racine:

```bash
pnpm dev
```

Cette commande lance les scripts `dev` des applications du workspace.

## Lancer seulement l'API

Depuis la racine:

```bash
pnpm --filter @apps/api dev
```

API accessible par defaut sur `http://localhost:3000` (`/health` disponible).

Variables utiles:

- `PORT` (defaut: `3000`)
- `HOST` (defaut: `0.0.0.0`)
- `LOG_HTTP_VERBOSE=true` pour logs HTTP detaillees

## Lancer seulement l'application mobile (Expo)

Depuis la racine:

```bash
pnpm --filter @apps/mobile dev
```

Ou depuis `apps/mobile`:

```bash
pnpm dev
```

Configurer les variables d'environnement mobile:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Valeurs presentes dans `.env.example`:

- `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`
- `EXPO_PUBLIC_CHAT_MODEL=llama3.1:8b`
- `EXPO_PUBLIC_DEVICE_NAME=mobile-device`

Commandes Expo utiles:

```bash
pnpm --filter @apps/mobile android
pnpm --filter @apps/mobile ios
pnpm --filter @apps/mobile web
```

## Lancer l'installateur desktop (Electron)

Depuis la racine:

```bash
pnpm --filter @apps/installer-desktop dev
```

## Build

Depuis la racine:

```bash
pnpm build
```

Build Electron uniquement:

```bash
pnpm --filter @apps/installer-desktop build
```

## Scripts de test disponibles

Depuis la racine:

```bash
pnpm test:setup
pnpm test:pairing
```
