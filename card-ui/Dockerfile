# 构建阶段：使用 Node.js 安装依赖并打包
# 使用官方 Node 镜像作为构建环境
FROM node:22 as builder

# 设置工作目录
WORKDIR /app

# 拷贝 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm ci --silent

# 拷贝项目源代码
COPY . .

# 执行构建命令（根据你的项目修改）
RUN npm run build

# 第二阶段：使用 Nginx 提供静态资源服务（或使用轻量级基础镜像）
FROM nginx:alpine

# 删除默认的 nginx 配置文件
#RUN rm -rf /etc/nginx/conf.d/default.conf

# 拷贝自定义的 nginx 配置文件（可选）
#COPY nginx.conf /etc/nginx/conf.d/default.conf

# 将第一阶段生成的构建文件复制到 nginx 的静态资源目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]