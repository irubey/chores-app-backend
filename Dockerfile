# Stage 1: Build
FROM node:20 AS build

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install
RUN npm install --save-dev ts-node ts-node-dev prisma

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 2: Serve
FROM node:20 AS runtime

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/prisma ./prisma

# Create a non-root user with UID 501 and use existing group with GID 20
RUN useradd -u 501 -g 20 -m appuser && \
    chown -R appuser:20 /app

# Ensure appuser has execute permissions on node_modules/.bin
RUN chmod -R 755 /app/node_modules/.bin

USER appuser

# Add node_modules/.bin to PATH
ENV PATH /app/node_modules/.bin:$PATH

EXPOSE 3000

CMD ["npm", "start"]
