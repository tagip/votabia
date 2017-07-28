FROM node:8-alpine

WORKDIR /opt/votabia

COPY . /opt/votabia/

RUN npm install

EXPOSE 8012

CMD node index.js
