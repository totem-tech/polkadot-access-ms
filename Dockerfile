FROM phusion/baseimage:0.11 
LABEL maintainer="htr.letun@gmail.com"
LABEL description="Simple docker container for polkadot-access-ms"

ENV DEBIAN_FRONTEND=noninteractive

ARG PROFILE=release
WORKDIR /app
COPY . /app
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update
RUN apt-get install yarn -y
CMD ["/app/start.sh"]
