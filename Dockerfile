FROM nginx:1.17-alpine AS build

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apk add --update --no-cache nodejs npm

COPY package.json /usr/src/app

RUN npm install -q && npm cache clean --force
COPY . /usr/src/app

FROM build AS development
ENV HOST 0.0.0.0
CMD [ "npm", "run", "start-docker"]


FROM build AS production
RUN npm run build

COPY config/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]