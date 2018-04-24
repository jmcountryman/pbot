FROM node:9-alpine

ARG config_file=config.js

# Install packages needed for node modules
RUN apk add --no-cache python build-base && \
    rm -rf /var/cache/apk/*

# Install ffmpeg
ADD https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz /
RUN mkdir /ffmpeg && \
    tar -xJf /ffmpeg-release-64bit-static.tar.xz -C /ffmpeg --strip-components=1 && \
    cp /ffmpeg/ffmpeg /usr/local/bin/ && \
    rm -rf /ffmpeg*

WORKDIR pbot

ADD . .
RUN yarn && \
    mv $config_file config.js

CMD node pbot.js
