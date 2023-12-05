FROM node
WORKDIR $HOME/application-code
COPY package*.json ./
RUN npm install
COPY . .
RUN npm rebuild @tensorflow/tfjs-node --build-from-source
EXPOSE 8004
CMD ["node", "server.js"]