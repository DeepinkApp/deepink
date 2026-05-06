BUILD_DIR := build-dir
REPO_DIR := flatpak-repo
APP_ID := app.deepink.Deepink

-include .env
export

# 
# The scripts
# 
.PHONY: clean lint install repo-build

lint:
	flatpak run --command=flatpak-builder-lint org.flatpak.Builder manifest app.deepink.Deepink.yaml
clean:
	rm -rf ./${BUILD_DIR} ./${REPO_DIR}

# Install dev build locally
install:
	flatpak-builder --user --install --force-clean ${BUILD_DIR} ${APP_ID}.yaml

repo-build: lint
	flatpak-builder --force-clean ${BUILD_DIR} ${APP_ID}.yaml
	flatpak build-export ${REPO_DIR} ${BUILD_DIR} stable
	flatpak build-update-repo \
		--gpg-sign=${GPG_SIGN_ID} \
		--generate-static-deltas \
		${REPO_DIR}

repo-push:
	rclone sync ${REPO_DIR}/ ${REPO_REMOTE} --transfers=32 --checksum --progress