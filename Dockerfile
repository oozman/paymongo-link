FROM oozman/puppeteer

RUN apt-get install -y curl && \
curl -sL https://deb.nodesource.com/setup_12.x | bash -  && \
apt-get install -y nodejs

COPY src /app

WORKDIR /app
RUN npm install

CMD node /app/index.js

EXPOSE 80