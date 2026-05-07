# TODO

- Dockeriser l'API dans un conteneur independant (build, run, healthcheck, restart policy).
- Dockeriser l'app installer desktop de maniere independante (environnement de build/run dedie).
- Dockeriser le DNS/tunnel cloudflared dans un conteneur independant de l'API.
- Orchestrer les services avec `docker-compose` (reseau, dependances, variables d'environnement).
- Ajouter la persistance des donnees runtime (volumes) pour eviter les pertes apres restart.
- Ajouter une strategie de logs centralisee (API, installer, cloudflared).
- Documenter les commandes Docker de dev/prod dans `README.md`.
- Automatiser le process de demarrage/setup actuellement manuel via boutons:
  - Run checks
  - Bootstrap local setup
  - Start services + ensure model
  - Refresh setup status
  - Start Cloudflared DNS
  - Generate pairing QR
  - Open local dashboard
