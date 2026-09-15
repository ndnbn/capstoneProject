package govai;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;

public class Database {
    private static String dbHost = System.getenv().getOrDefault("DB_HOST", "localhost");
    private static String dbPort = System.getenv().getOrDefault("DB_PORT", "3306");
    private static String dbName = System.getenv().getOrDefault("DB_NAME", "govai_db");
    private static String dbUser = System.getenv().getOrDefault("DB_USER", "root");
    private static String dbPass = System.getenv().getOrDefault("DB_PASSWORD", "MySQL");

    public record UserRecord(int id, String name, String email, String passwordHash) {}

    public static void init() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("MySQL JDBC Driver not found in classpath: " + e.getMessage());
        }

        // Test connection and try known defaults if initial fails
        String[] passwordsToTry = (System.getenv("DB_PASSWORD") != null) 
            ? new String[]{System.getenv("DB_PASSWORD")}
            : new String[]{"MySQL", "", "root", "admin", "123456", "password", "root123", "mysql"};

        boolean initialized = false;
        for (String pwd : passwordsToTry) {
            dbPass = pwd;
            if (testAndInitialize()) {
                initialized = true;
                break;
            }
        }
        if (!initialized) {
            System.err.println("Could not establish connection to MySQL database.");
        }
    }

    private static boolean testAndInitialize() {
        String serverUrl = "jdbc:mysql://" + dbHost + ":" + dbPort + "/?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";
        try (Connection conn = DriverManager.getConnection(serverUrl, dbUser, dbPass);
             Statement stmt = conn.createStatement()) {

            stmt.executeUpdate("CREATE DATABASE IF NOT EXISTS " + dbName + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            try (Connection dbConn = getConnection();
                 Statement dbStmt = dbConn.createStatement()) {

                // Create users table
                dbStmt.executeUpdate(
                    "CREATE TABLE IF NOT EXISTS users (" +
                    "  id INT AUTO_INCREMENT PRIMARY KEY," +
                    "  name VARCHAR(255) NOT NULL," +
                    "  email VARCHAR(191) NOT NULL UNIQUE," +
                    "  password_hash VARCHAR(255) NOT NULL," +
                    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                    "  last_login TIMESTAMP NULL DEFAULT NULL" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                );

                // Create login_logs table to track who logs in and when
                dbStmt.executeUpdate(
                    "CREATE TABLE IF NOT EXISTS login_logs (" +
                    "  id INT AUTO_INCREMENT PRIMARY KEY," +
                    "  user_id INT NULL," +
                    "  email VARCHAR(191) NOT NULL," +
                    "  status VARCHAR(50) NOT NULL," +
                    "  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                    "  ip_address VARCHAR(100) NULL," +
                    "  INDEX idx_email (email)," +
                    "  INDEX idx_login_time (login_time)" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                );

                System.out.println("MySQL database '" + dbName + "' and tables initialized successfully.");
                return true;
            }
        } catch (SQLException e) {
            System.err.println("MySQL connection attempt failed (" + dbUser + "@" + dbHost + ":" + dbPort + "): " + e.getMessage());
            return false;
        }
    }

    public static Connection getConnection() throws SQLException {
        String url = "jdbc:mysql://" + dbHost + ":" + dbPort + "/" + dbName + "?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC";
        return DriverManager.getConnection(url, dbUser, dbPass);
    }

    public static UserRecord findUserByEmail(String email) {
        String sql = "SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = LOWER(?)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, email.trim());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return new UserRecord(
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("password_hash")
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching user by email: " + e.getMessage());
        }
        return null;
    }

    public static boolean registerUser(String name, String email, String passwordHash) {
        String sql = "INSERT INTO users (name, email, password_hash) VALUES (?, LOWER(?), ?)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, name.trim());
            stmt.setString(2, email.trim());
            stmt.setString(3, passwordHash);
            int affected = stmt.executeUpdate();
            return affected > 0;
        } catch (SQLException e) {
            System.err.println("Error registering user: " + e.getMessage());
            return false;
        }
    }

    public static void recordLoginLog(Integer userId, String email, String status, String clientIp) {
        String sql = "INSERT INTO login_logs (user_id, email, status, ip_address) VALUES (?, LOWER(?), ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (userId != null) {
                stmt.setInt(1, userId);
            } else {
                stmt.setNull(1, java.sql.Types.INTEGER);
            }
            stmt.setString(2, email.trim());
            stmt.setString(3, status);
            stmt.setString(4, clientIp);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error recording login log: " + e.getMessage());
        }
    }

    public static void updateLastLogin(int userId) {
        String sql = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error updating last login timestamp: " + e.getMessage());
        }
    }

    public static void migrateFromLegacyFile(Path legacyDbPath) {
        if (!Files.exists(legacyDbPath)) {
            return;
        }
        try {
            List<String> lines = Files.readAllLines(legacyDbPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line.isBlank()) continue;
                String[] parts = line.split("\t", 3);
                if (parts.length != 3) continue;
                String email = unescape(parts[0]).trim().toLowerCase();
                String name = unescape(parts[1]).trim();
                String passwordHash = unescape(parts[2]).trim();

                if (!email.isBlank() && !name.isBlank() && !passwordHash.isBlank()) {
                    if (findUserByEmail(email) == null) {
                        registerUser(name, email, passwordHash);
                        System.out.println("Migrated legacy user into MySQL: " + email);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Could not read legacy users database for migration: " + e.getMessage());
        }
    }

    private static String unescape(String value) {
        StringBuilder result = new StringBuilder();
        for (int index = 0; index < value.length(); index++) {
            char ch = value.charAt(index);
            if (ch == '\\' && index + 1 < value.length()) {
                char next = value.charAt(index + 1);
                if (next == 't') {
                    result.append('\t');
                    index++;
                } else if (next == 'n') {
                    result.append('\n');
                    index++;
                } else if (next == 'r') {
                    result.append('\r');
                    index++;
                } else if (next == '\\') {
                    result.append('\\');
                    index++;
                } else {
                    result.append(next);
                    index++;
                }
            } else {
                result.append(ch);
            }
        }
        return result.toString();
    }
}
