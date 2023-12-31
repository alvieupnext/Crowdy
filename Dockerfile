FROM node
WORKDIR $HOME/application-code
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]