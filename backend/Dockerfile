FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S salesflow && adduser -S salesflow -G salesflow
COPY --from=build /build/target/salesflow-api-*.jar app.jar
RUN mkdir -p /app/uploads && chown -R salesflow:salesflow /app
USER salesflow
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
