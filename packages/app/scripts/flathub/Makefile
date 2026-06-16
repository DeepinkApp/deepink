SUBDIR := /tmp/deepink-flatpak
BUILD_DIR := $(SUBDIR)/build-dir
BUILD_STATE_DIR := $(SUBDIR)/.flatpak-builder
REPO_DIR := $(SUBDIR)/flatpak-repo
APP_ID := app.deepink.Deepink
REPO_BRANCH = stable

-include .env
export

.PHONY: clean dev-install repo-export repo-update repo-push repo-pull repo-build

clean:
	rm -rf $(BUILD_DIR) $(REPO_DIR)

# Dev commands for QA and local testing
dev-install:
	flatpak-builder --state-dir=$(BUILD_STATE_DIR) --user --install --force-clean ${BUILD_DIR} ${APP_ID}.yaml

repo-export:
	flatpak-builder --state-dir=$(BUILD_STATE_DIR) --force-clean $(BUILD_DIR) $(APP_ID).yaml
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
	# S3 does not preserve empty dirs, so we init repo locally first,
	# to create all directories structure in fs
	mkdir -p $(REPO_DIR)
	ostree init --repo=$(REPO_DIR) --mode=archive-z2
	# Copy missed remote files
	rclone copy $(REPO_REMOTE) $(REPO_DIR) --transfers=32 --checksum --progress

# Use that command to build, update and push remote repository
repo-build: repo-pull repo-update repo-push