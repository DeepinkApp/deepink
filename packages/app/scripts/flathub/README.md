The scripts to maintain the Flatpak repo https://flatpak.deepink.app/

Prepare environment
- Install flatpak & dev tools. Example for latest Fedora is `sudo dnf install flatpak flatpak-builder unzip`
- Copy skeleton of .env file via `cp .env.example .env` and fill it

Workflow
- Pull the actual state via `make repo-pull`
- Release updates via `make repo-update repo-push`