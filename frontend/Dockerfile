FROM node:20-alpine

WORKDIR /app

# Install package dependencies
COPY package.json ./
RUN npm install

# Copy source code files
COPY . .

# Expose port 3000 for the Expo Web bundler
EXPOSE 3000

# Set environment variables for non-interactive execution inside Docker
ENV CI=1
ENV PORT=3000

# Start Expo Web dev server
CMD ["npm", "run", "web"]
