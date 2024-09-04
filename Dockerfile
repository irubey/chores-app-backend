# Stage 1: Build
FROM node:20 AS build

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY src ./src

RUN npm install

RUN npm install -g prisma

COPY . .

RUN npx prisma generate

RUN npm run build && ls -la dist

# Stage 2: Serve
FROM node:20 AS runtime

WORKDIR /app

COPY --from=build /app/dist /app/dist

COPY --from=build /app/node_modules /app/node_modules

COPY --from=build /app/node_modules/@prisma /app/node_modules/@prisma

COPY --from=build /app/prisma /app/prisma



EXPOSE 3000

CMD ["npm", "start"]
