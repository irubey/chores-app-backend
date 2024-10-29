# backend/Dockerfile

# Use the official Node.js 20 image as the base
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Install netcat-openbsd for the entrypoint script
RUN apt-get update && \
    apt-get install -y netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# Copy and rename the npm config file
COPY .docker.npmrc ./.npmrc

# ARG must be declared before it's used
ARG NPM_TOKEN
RUN sed -i "s|NPM_TOKEN_VALUE|${NPM_TOKEN}|g" .npmrc && \
    npm install && \
    rm -f .npmrc

# Install ts-node-dev globally for hot-reloading
RUN npm install -g ts-node-dev

# Copy the rest of the application code
COPY . .

# Add these environment variables for better Node.js performance in Docker
ENV NODE_ENV=development
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Expose the port the app runs on
EXPOSE 3000

# Ensure entrypoint.sh is executable
RUN chmod +x /app/entrypoint.sh

# Start the application with ts-node-dev for development
CMD ["npm", "run", "dev"]
