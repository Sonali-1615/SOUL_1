FROM node:16-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Production image
FROM node:16-alpine AS prod
WORKDIR /app
COPY --from=build /app /app
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]