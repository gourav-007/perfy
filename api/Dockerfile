FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package.json first
COPY package*.json ./

# Clear npm cache and install with specific flags to handle integrity issues
RUN npm cache clean --force && \
    npm config set registry https://registry.npmjs.org/ && \
    npm install --production --no-audit --no-fund --legacy-peer-deps

# Copy the rest of the application
COPY . .

EXPOSE 8080

# Don't run as root in production, but for development it\'s easier
# USER node

CMD ["npm", "start"]