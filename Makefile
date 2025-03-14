export DOCKER_DEFAULT_PLATFORM=linux/amd64

clear:
	rm -rf build/*

dev:
	npm run dev

start-server:
	npx http-server -p 8888 build

build: clear plantuml-server-up
	node scripts/build.js

build-prod: clear plantuml-server-up
	PROD="prod" node scripts/build.js

publish: build-prod
	node scripts/publish.js

plantuml-server-up:
	docker compose -f containers/docker-compose-plantuml.yaml up -d

plantuml-server-down:
	docker compose -f containers/docker-compose-plantuml.yaml down --remove-orphans
