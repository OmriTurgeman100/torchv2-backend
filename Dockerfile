FROM node:18

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

ENV DB_HOST=host.docker.internal
ENV DB_NAME=postgres
ENV DB_USER=postgres
ENV DB_PASS=postgres


CMD ["npm", "run", "start"]
