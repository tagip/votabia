FROM node:8-alpine

WORKDIR /opt/votabia

COPY package.json /opt/votabia/package.json

RUN npm install

EXPOSE 8012

CMD node index.js
