export DOCKER_DEFAULT_PLATFORM=linux/amd64


SRC_FOLDER		= ./src
BUILD_FOLDER	= ./build
PROJECT_FOLDER  = .

SRC_FOLDER		:= $(abspath $(SRC_FOLDER))
BUILD_FOLDER	:= $(abspath $(BUILD_FOLDER))
PROJECT_FOLDER	:= $(abspath $(PROJECT_FOLDER))

export SRC_FOLDER
export BUILD_FOLDER
export PROJECT_FOLDER

MAKEFILE_PATH=scripts/Makefile
COMPOSE_PATH=containers/docker-compose.yaml


dev-stop:
	docker compose -f ${COMPOSE_PATH} down --remove-orphans

dev-rebuild:
	COMMAND="dev" docker compose -f ${COMPOSE_PATH} up -d --build

dev:
	COMMAND="dev" docker compose -f ${COMPOSE_PATH} up -d

build:
	COMMAND="build" docker compose -f ${COMPOSE_PATH} up -d

build-prod:
	COMMAND="build-prod" docker compose -f ${COMPOSE_PATH} up -d

publish:
	echo "You can only publish locally, so you should use local-publish"

local-dev:
	make -f ${MAKEFILE_PATH} dev

local-build:
	make -f ${MAKEFILE_PATH} build

local-build-prod:
	make -f ${MAKEFILE_PATH} build-prod

local-publish:
	make -f ${MAKEFILE_PATH} publish
