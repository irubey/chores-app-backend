# Stage 1: Build
FROM node:20 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Serve
FROM node:20 AS runtime

# Set the working directory inside the container
WORKDIR /app

# Copy built files from the build stage
COPY --from=build /app/dist /app/dist

# Copy production dependencies
COPY --from=build /app/node_modules /app/node_modules

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]
