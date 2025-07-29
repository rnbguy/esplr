FROM node:22.17.0-alpine3.21

WORKDIR /app

RUN apk add --no-cache python3

COPY package*.json .

RUN npm ci

COPY . .

RUN npm run build

CMD ["sh", "-c", "cd dist && python3 -m http.server 80"]