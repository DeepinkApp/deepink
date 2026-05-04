BUILD_DIR := build-dir
REPO_DIR := flatpak-repo
APP_ID := app.deepink.Deepink

# 
# The scripts
# 
.PHONY: install clean

# Install dev build locally
install:
	flatpak-builder --user --install --force-clean ${BUILD_DIR} ${APP_ID}.yaml

clean:
	rm -rf ./${BUILD_DIR} ./${REPO_DIR}

# 
# The declarative description
# 
${BUILD_DIR}:
	flatpak-builder ${BUILD_DIR} ${APP_ID}.yaml --force-clean

${REPO_DIR}: ${BUILD_DIR}
	flatpak build-export ${REPO_DIR} ${BUILD_DIR} stable

deepink.flatpak: ${REPO_DIR}
	flatpak build-bundle ${REPO_DIR} deepink.flatpak ${APP_ID} stable