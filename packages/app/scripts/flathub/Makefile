BUILD_DIR := build-dir
REPO_DIR := flatpak-repo
APP_ID := app.deepink.Deepink
REPO_BRANCH = stable

-include .env
export

.PHONY: clean dev-install repo-export repo-update repo-push repo-pull

clean:
	rm -rf $(BUILD_DIR) $(REPO_DIR)

# Dev commands for QA and local testing
dev-install:
	flatpak-builder --user --install --force-clean ${BUILD_DIR} ${APP_ID}.yaml

repo-export:
	flatpak-builder --force-clean $(BUILD_DIR) $(APP_ID).yaml
	flatpak build-export \
		--gpg-sign=$(GPG_SIGN_ID) \
		$(REPO_DIR) $(BUILD_DIR) ${REPO_BRANCH}

repo-update: repo-export
	flatpak build-update-repo \
		--gpg-sign=$(GPG_SIGN_ID) \
		--generate-static-deltas \
		--prune \
		$(REPO_DIR)

repo-push:
	rclone sync $(REPO_DIR)/ $(REPO_REMOTE) --transfers=32 --checksum --progress

repo-pull:
	rclone sync $(REPO_REMOTE) $(REPO_DIR) --transfers=32 --checksum --progress