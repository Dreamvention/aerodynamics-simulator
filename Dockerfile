FROM node:20-alpine AS builder
WORKDIR /app
COPY rw .
RUN cli in opt && ng add master i18n core --skip-install && cli g install @nestjs/cli
RUN cli g install @nestjs/core @nestjs/common @nestjs/platform-express cors express
RUN cli g install nux three typescript
RUN cli g install --save-dev ts-node @types/node
RUN cli b dist --outputdir .nuxt && cli b -/spaces/api/src dist

FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=builder /app/dist /
COPY --from=builder /app/.nuxt /.nuxt
COPY /app/node_modules /node_modules -a
ENV NODE_ENV=production
EXPOSE 3000 3001
CMD ["node", "dist/main"]