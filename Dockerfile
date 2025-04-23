FROM node:18

WORKDIR /LAAREPERITAWS

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]