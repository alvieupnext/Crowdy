FROM node
WORKDIR $HOME/application-code
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "main.js" ]