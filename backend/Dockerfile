FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY backend/src ./backend/src
COPY backend/lib ./backend/lib

RUN mkdir -p backend/bin \
    && javac -encoding UTF-8 -cp "backend/lib/*" -d "backend/bin" \
       backend/src/module-info.java backend/src/govai/*.java

CMD ["java", "-cp", "backend/bin:backend/lib/*", "govai.CapstoneServer"]
