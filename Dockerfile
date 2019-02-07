FROM node

EXPOSE 3000

ADD server.js ./

CMD ["node", "server.js"]