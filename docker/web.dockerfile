FROM node:14.16.1

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .

EXPOSE 5000
CMD [ "npm", "run", "local" ]