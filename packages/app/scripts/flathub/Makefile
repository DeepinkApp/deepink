BUILD_DIR := build-dir
REPO_DIR := flatpak-repo
APP_ID := app.deepink.Deepink

-include .env
export

# 
# The scripts
# 
.PHONY: clean lint install repo-update

lint:
	flatpak run --command=flatpak-builder-lint org.flatpak.Builder manifest app.deepink.Deepink.yaml
clean:
	rm -rf ./${BUILD_DIR} ./${REPO_DIR}

# Install dev build locally
install:
	flatpak-builder --user --install --force-clean ${BUILD_DIR} ${APP_ID}.yaml

repo-update: lint
	flatpak-builder ${BUILD_DIR} ${APP_ID}.yaml --repo=${REPO_DIR} --gpg-sign=${GPG_SIGN_ID} --force-clean
	flatpak build-update-repo --gpg-sign=${GPG_SIGN_ID} --generate-static-deltas ${REPO_DIR}

# 
# The declarative description
# 
${BUILD_DIR}:
	flatpak-builder ${BUILD_DIR} ${APP_ID}.yaml --force-clean

${REPO_DIR}: ${BUILD_DIR}
	flatpak build-export ${REPO_DIR} ${BUILD_DIR} stable

deepink.flatpak: ${REPO_DIR}
	flatpak build-bundle ${REPO_DIR} deepink.flatpak ${APP_ID} stable