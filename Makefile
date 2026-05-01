APP_DIR := packages/app
TWOFISH_DIR := packages/twofish

clean:
	cd ${APP_DIR} && rm -Rf dist out
	cd ${TWOFISH_DIR} && rm -Rf dist

prepare:
	npm install

deps: prepare
	cd ${TWOFISH_DIR} && npm run build

build: prepare deps
	cd ${APP_DIR} && npm run build

package: clean build
	cd ${APP_DIR} && npx electron-forge package

artifacts:
	cd ${APP_DIR} && npm run make

publish:
	cd ${APP_DIR} && npx tsx ./scripts/publish --dir ./out/make