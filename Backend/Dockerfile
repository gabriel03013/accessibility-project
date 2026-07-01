FROM maven:3.9.11-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src src
RUN mvn -B -ntp clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache wget \
    && addgroup -S app -g 10001 \
    && adduser -S app -u 10001 -G app
WORKDIR /app
COPY --from=build --chown=app:app /workspace/target/api-*.jar app.jar
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/urandom", "-jar", "/app/app.jar"]

