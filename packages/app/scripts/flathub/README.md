The scripts to maintain the Flatpak repo https://flatpak.deepink.app/

Prepare environment
- Install flatpak, rclone, GPG tooling, and dev tools. Example for latest Fedora is `sudo dnf install flatpak flatpak-builder unzip rclone gnupg2`
- Copy skeleton of `.env` via `cp .env.example .env` and set at least `REPO_REMOTE` and `GPG_SIGN_ID`

Workflow
- Pull the actual state via `make repo-pull`
- Release updates via `make repo-update repo-push`