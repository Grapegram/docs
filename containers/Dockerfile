FROM node:23

WORKDIR /app
COPY ./package.json /app/
RUN npm install
COPY ./scripts /app/scripts

ENTRYPOINT [ "sh", "-c" ]
CMD [ "make -f /app/scripts/Makefile -B ${COMMAND}" ]
