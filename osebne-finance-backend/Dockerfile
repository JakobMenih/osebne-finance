FROM node:18-bullseye-slim

WORKDIR /app
COPY package*.json prisma/schema.prisma ./
RUN npm ci --production \
    && npx prisma generate
COPY . .
RUN npm run build
CMD ["node", "dist/main.js"]