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

# Build the application (adjust this command if your build process is different)
RUN npm run build

# Stage 2: Serve
FROM node:20 AS runtime

# Set the working directory inside the container
WORKDIR /app

# Copy built files from the build stage
COPY --from=build /app /app

# Install production dependencies only
RUN npm install --only=production

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "start"]
