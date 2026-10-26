package govai;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class CapstoneServer {
    private static final Path USERS_DB = Paths.get(System.getProperty("user.home"), ".govai-users.db");

    public static void main(String[] args) throws IOException {
        Database.init();
        Database.migrateFromLegacyFile(USERS_DB);

        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/ask", CapstoneServer::handleAsk);
        server.createContext("/api/health", CapstoneServer::handleHealth);
        server.createContext("/api/register", CapstoneServer::handleRegister);
        server.createContext("/api/login", CapstoneServer::handleLogin);
        server.setExecutor(null);
        server.start();
        System.out.println("GovAI backend running at http://localhost:" + port);
    }

    private static void handleHealth(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 204, "");
            return;
        }
        send(exchange, 200, "{\"status\":\"ok\"}");
    }

    private static void handleAsk(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 204, "");
            return;
        }
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String question = extract(body, "question");
        String language = extract(body, "language");
        String state = extract(body, "state");
        String education = extract(body, "education");
        String answer = generateMultilingualAnswer(question, language, state, education);
        String source1 = language.equalsIgnoreCase("Telugu") ? "నేషనల్ స్కాలర్‌షిప్ పోర్టల్" : language.equalsIgnoreCase("Hindi") ? "राष्ट्रीय छात्रवृत्ति पोर्टल" : language.equalsIgnoreCase("Tamil") ? "தேசிய உதவித்தொகை போர்டல்" : "National Scholarship Portal";
        String source2 = state.isBlank()
            ? language.equalsIgnoreCase("Telugu") ? "రాష్ట్ర ప్రభుత్వ పోర్టల్" : language.equalsIgnoreCase("Hindi") ? "राज्य सरकारी पोर्टल" : language.equalsIgnoreCase("Tamil") ? "மாநில அரசு இணையதளம்" : "State Government Portal"
            : state + " Government Education Portal";
        String response = "{\"answer\":\"" + json(answer) + "\",\"question\":\"" + json(question) + "\",\"sources\":[\"" + json(source1) + "\",\"" + json(source2) + "\"]}";
        send(exchange, 200, response);
    }

    private static String generateMultilingualAnswer(String question, String language, String state, String education) {
        String q = (question == null) ? "" : question.toLowerCase();
        String selectedState = (state == null || state.isBlank()) ? "your state" : state;
        String selectedEducation = (education == null || education.isBlank()) ? "student" : education;
        String stateScheme = stateSchemeName(selectedState);
        boolean isScholarship = q.contains("scholarship") || q.contains("స్కాలర్‌షిప్") || q.contains("छात्रवृत्ति") || q.contains("உதவித்தொகை") || q.contains("student") || q.contains("విద్యార్థి") || q.contains("fees") || q.contains("ఫీజు");

        if (language.equalsIgnoreCase("Telugu")) {
            if (isScholarship) {
                return selectedState + " రాష్ట్రంలో " + selectedEducation + " విద్యార్థులకు " + stateScheme + " మరియు ఇతర రాష్ట్ర ఫీజు రీయింబర్స్‌మెంట్ పథకాలు అందుబాటులో ఉన్నాయి. నేషనల్ స్కాలర్‌షిప్ పోర్టల్ (NSP) ద్వారా అర్హతను పరిశీలించి దరఖాస్తు చేసుకోండి.";
            }
            return "మీ ప్రొఫైల్ మరియు విద్యార్హత ఆధారంగా స్కాలర్‌షిప్‌లు, ఫీజు సహాయం మరియు ఇతర విద్యా పథకాలు అందుబాటులో ఉన్నాయి. అధికారిక విద్యా పోర్టల్‌లో అర్హతను పరిశీలించి దరఖాస్తు చేసుకోండి.";
        } else if (language.equalsIgnoreCase("Hindi")) {
            if (isScholarship) {
                return selectedState + " में " + selectedEducation + " छात्रों के लिए " + stateScheme + " और राज्य शुल्क प्रतिपूर्ति योजनाएं उपलब्ध हैं। राष्ट्रीय छात्रवृत्ति पोर्टल (NSP) पर पात्रता जांचकर आवेदन करें।";
            }
            return "आपकी प्रोफ़ाइल और शिक्षा स्तर के आधार पर छात्रवृत्ति, शुल्क सहायता और अन्य शिक्षा योजनाएं उपलब्ध हैं। आधिकारिक शिक्षा पोर्टल पर पात्रता जांचकर आवेदन करें।";
        } else if (language.equalsIgnoreCase("Tamil")) {
            if (isScholarship) {
                return selectedState + " மாநிலத்தில் " + selectedEducation + " மாணவர்களுக்கு " + stateScheme + " மற்றும் மாநில கல்விக் கட்டண ஆதரவு திட்டங்கள் கிடைக்கின்றன. தேசிய உதவித்தொகை இணையதளத்தில் (NSP) தகுதியைச் சரிபார்த்து விண்ணப்பிக்கவும்.";
            }
            return "உங்கள் சுயவிவரம் மற்றும் கல்வித் தகுதியின் அடிப்படையில் உதவித்தொகைகள், கட்டண உதவி மற்றும் பிற கல்வித் திட்டங்கள் கிடைக்கலாம். அதிகாரப்பூர்வ கல்வி இணையதளத்தில் தகுதியைச் சரிபார்த்து விண்ணப்பிக்கவும்.";
        } else {
            if (isScholarship) {
                return "For " + selectedEducation + " students in " + selectedState + ", schemes such as " + stateScheme + ", Post-Matric Scholarship, and state fee reimbursements may be available. Check the eligibility requirements and apply through the official government portal.";
            }
            return "Based on your profile and education level, scholarships, fee support, and other education benefits may be available. Verify the requirements and apply through the official education portal.";
        }
    }

    private static void handleRegister(HttpExchange exchange) throws IOException {
        handleAuth(exchange, false);
    }

    private static void handleLogin(HttpExchange exchange) throws IOException {
        handleAuth(exchange, true);
    }

    private static void handleAuth(HttpExchange exchange, boolean login) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 204, "");
            return;
        }
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            send(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }
        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String email = extract(body, "email").trim().toLowerCase();
        String password = extract(body, "password").trim();
        String name = extract(body, "name").trim();
        String clientIp = exchange.getRemoteAddress() != null ? exchange.getRemoteAddress().getAddress().getHostAddress() : "unknown";

        if (email.isBlank() || password.length() < 6 || (!login && name.isBlank())) {
            send(exchange, 400, "{\"error\":\"Please provide valid account details.\"}");
            return;
        }

        if (!login) {
            Database.UserRecord existing = Database.findUserByEmail(email);
            if (existing != null) {
                send(exchange, 409, "{\"error\":\"An account with this email already exists.\"}");
                return;
            }
            boolean success = Database.registerUser(name, email, hash(password));
            if (!success) {
                send(exchange, 500, "{\"error\":\"Database error registering account.\"}");
                return;
            }
            Database.UserRecord user = Database.findUserByEmail(email);
            if (user != null) {
                Database.recordLoginLog(user.id(), email, "SUCCESS", clientIp);
                Database.updateLastLogin(user.id());
            }
            send(exchange, 200, "{\"name\":\"" + json(name) + "\",\"message\":\"Registered successfully\"}");
            return;
        }

        Database.UserRecord user = Database.findUserByEmail(email);
        if (user == null) {
            Database.recordLoginLog(null, email, "FAILED", clientIp);
            send(exchange, 404, "{\"error\":\"Account not found. Please sign up first.\"}");
            return;
        }
        if (!user.passwordHash().equals(hash(password))) {
            Database.recordLoginLog(user.id(), email, "FAILED", clientIp);
            send(exchange, 401, "{\"error\":\"Incorrect password.\"}");
            return;
        }

        Database.recordLoginLog(user.id(), email, "SUCCESS", clientIp);
        Database.updateLastLogin(user.id());
        send(exchange, 200, "{\"name\":\"" + json(user.name()) + "\",\"message\":\"Signed in successfully\"}");
    }

    private static String stateSchemeName(String state) {
        return switch (state) {
            case "Andhra Pradesh" -> "Jagananna Vidya Deevena and Vasathi Deevena";
            case "Telangana" -> "Telangana ePASS Post-Matric Scholarship";
            case "Tamil Nadu" -> "Pudhumai Penn and Thamizh Pudhalvan";
            case "Karnataka" -> "Karnataka SSP Post-Matric Scholarship";
            case "Maharashtra" -> "MahaDBT Post-Matric Scholarship";
            case "Uttar Pradesh" -> "UP Post-Matric Scholarship and Fee Reimbursement";
            case "Delhi" -> "Delhi Higher Education Merit-cum-Means Assistance";
            case "West Bengal" -> "West Bengal Student Credit and Scholarship Support";
            default -> state + " Student Scholarship and Education Support";
        };
    }

    private static String extract(String body, String key) {
        if (body == null || body.isBlank()) {
            return "";
        }

        String needle = "\"" + key + "\"";
        int keyIndex = body.indexOf(needle);
        if (keyIndex < 0) {
            return "";
        }

        int colonIndex = body.indexOf(':', keyIndex + needle.length());
        if (colonIndex < 0) {
            return "";
        }

        int valueStart = colonIndex + 1;
        while (valueStart < body.length() && Character.isWhitespace(body.charAt(valueStart))) {
            valueStart++;
        }

        if (valueStart >= body.length()) {
            return "";
        }

        if (body.charAt(valueStart) == '"') {
            StringBuilder value = new StringBuilder();
            int index = valueStart + 1;
            while (index < body.length()) {
                char ch = body.charAt(index);
                if (ch == '\\' && index + 1 < body.length()) {
                    char next = body.charAt(index + 1);
                    value.append(next == '"' ? '"' : next == '\\' ? '\\' : next);
                    index += 2;
                } else if (ch == '"') {
                    return value.toString();
                } else {
                    value.append(ch);
                    index++;
                }
            }
            return value.toString();
        }

        int valueEnd = valueStart;
        while (valueEnd < body.length() && body.charAt(valueEnd) != ',' && body.charAt(valueEnd) != '}') {
            valueEnd++;
        }

        return body.substring(valueStart, valueEnd).trim();
    }

    private static String json(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\n", "\\\n")
                .replace("\r", "\\\r")
                .replace("\t", "\\\t")
                .replace("\"", "\\\"");
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static void send(HttpExchange exchange, int status, String body) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }
}
