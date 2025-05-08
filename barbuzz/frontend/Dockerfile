FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY ./src ./src
COPY ./public ./public

# Build React app
RUN npm run build

# Install static server
RUN npm install -g serve

# Expose production port
EXPOSE 3000

# Serve the build folder
CMD ["serve", "-s", "build", "-l", "3000"]

