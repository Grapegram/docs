export DOCKER_DEFAULT_PLATFORM=linux/amd64

build: plantuml-server-up
	node scripts/build.js

publish: build
	node scripts/publish.js

plantuml-server-up:
	docker compose -f containers/docker-compose-plantuml.yaml up -d

plantuml-server-down:
	docker compose -f containers/docker-compose-plantuml.yaml down --remove-orphans
