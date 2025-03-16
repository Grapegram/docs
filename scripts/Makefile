clear:
	rm -rf build/*

dev:
	echo "Start Dev..." && npm run dev

build: clear
	npm run build

build-prod: clear
	PROD="prod" npm run build

publish: build-prod
	node scripts/publish.js
