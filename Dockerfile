# syntax=docker/dockerfile:1
FROM node:current-alpine

ENV INSTALL_PATH /app

# Build-base: Package/compilation Essentials
# Git: for potential git-based NPM dependencies
RUN apk add --update --no-cache \
  build-base \
  git

RUN apk add xvfb

# Install node_modules with yarn
COPY package.json yarn.lock /tmp/
RUN cd /tmp && yarn set version berry && yarn config set nodeLinker node-modules && yarn install \
  && mkdir -p $INSTALL_PATH \
  && cd $INSTALL_PATH \
  && cp -R /tmp/node_modules $INSTALL_PATH \
  && rm -r /tmp/* && yarn cache clean

WORKDIR $INSTALL_PATH

# Installs packages for any subdirectories
COPY package.json yarn.lock ./
COPY ./primo-explore ./primo-explore

COPY . .

EXPOSE 8003 3001

CMD VIEW=${VIEW} PROXY_SERVER=${PROXY_SERVER} VE=${VE} BROWSERIFY=${BROWSERIFY} USESCSS=${USESCSS} yarn start
