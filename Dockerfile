# Use Node.js version 23 with Alpine Linux as the base image
# Alpine is a lightweight Linux distribution, making the final image smaller
FROM node:20-alpine

# Avoid deprecated dependencies
RUN apk add --no-cache python3 make g++

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json files to the working directory
COPY package.json package-lock.json ./

# Install all dependencies defined in package.json
RUN npm install

# Copy all remaining files from the current directory to the working directory
COPY . .

# Build the application
RUN npm run build  

# Specify the command to run when the container starts
CMD ["node", "dist/index.js"]