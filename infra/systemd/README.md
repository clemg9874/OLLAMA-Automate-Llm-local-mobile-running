# systemd services

Ce dossier contient des exemples de services `systemd --user` pour decoupler l'API et le tunnel Cloudflared.

## Installation

Copier les fichiers dans `~/.config/systemd/user/` puis executer:

```bash
systemctl --user daemon-reload
systemctl --user enable --now ollama-api.service
systemctl --user enable --now cloudflared-tunnel.service
```
