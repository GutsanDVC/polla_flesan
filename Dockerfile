FROM node:20-alpine

WORKDIR /app

COPY .output ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
