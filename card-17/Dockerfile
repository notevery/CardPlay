FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/maven:3.9.9-eclipse-temurin-17-noble AS build

WORKDIR /app

COPY pom.xml ./
COPY src ./src

# 编译构建可执行 jar
RUN mvn clean package -DskipTests

# -------- 🚀 运行阶段：只含 JDK（无 Maven） --------
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/eclipse-temurin:17-noble

WORKDIR /app

# 拷贝 jar 文件
COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
