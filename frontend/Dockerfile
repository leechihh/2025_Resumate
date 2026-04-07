FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173

# --host 讓 Vite 接受容器外的連線
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
