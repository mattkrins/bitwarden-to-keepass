FROM node:18-alpine
COPY ./index.js ./index.js
RUN yarn global add @bitwarden/cli

RUN apk update
RUN apk add --no-cache keepassxc

ENV KP_PATH=/export/vault.kdbx
ENV BW_SERVER=https://vault.bitwarden.eu
ENV BW_CLIENTID=""
ENV BW_CLIENTSECRET=""
ENV BW_PASSWORD=""

CMD ["node", "index.js"]