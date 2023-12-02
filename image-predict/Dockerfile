FROM node
WORKDIR $HOME/application-code
COPY package*.json ./
RUN npm install
COPY ./server.js .
EXPOSE 8002
CMD [ "npm", "start" ]