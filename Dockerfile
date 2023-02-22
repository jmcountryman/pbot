FROM node:18-alpine

ARG config_file=config.js

WORKDIR /pbot

ADD https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz /

# Install ffmpeg
RUN mkdir /ffmpeg && \
    tar -xJf /ffmpeg-release-amd64-static.tar.xz -C /ffmpeg --strip-components=1 && \
    cp /ffmpeg/ffmpeg /usr/local/bin/ && \
    rm -rf /ffmpeg* && \
    apk add --no-cache python3 build-base libtool autoconf automake libsodium && \
    rm -rf /var/cache/apk/*

# Install node modules
ADD package.json .
ADD yarn.lock .
RUN yarn

ADD . .
ADD $config_file config.js

CMD sleep 20 && node pbot.js
