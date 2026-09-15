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
        String answer = generateMultilingualAnswer(question, language);
        String source1 = language.equalsIgnoreCase("Telugu") ? "నేషనల్ స్కాలర్‌షిప్ పోర్టల్" : language.equalsIgnoreCase("Hindi") ? "राष्ट्रीय छात्रवृत्ति पोर्टल" : language.equalsIgnoreCase("Tamil") ? "தேசிய உதவித்தொகை போர்டல்" : "National Scholarship Portal";
        String source2 = language.equalsIgnoreCase("Telugu") ? "రాష్ట్ర ప్రభుత్వ పోర్టల్" : language.equalsIgnoreCase("Hindi") ? "राज्य सरकारी पोर्टल" : language.equalsIgnoreCase("Tamil") ? "மாநில அரசு இணையதளம்" : "State Government Portal";
        String response = "{\"answer\":\"" + json(answer) + "\",\"question\":\"" + json(question) + "\",\"sources\":[\"" + json(source1) + "\",\"" + json(source2) + "\"]}";
        send(exchange, 200, response);
    }

    private static String generateMultilingualAnswer(String question, String language) {
        String q = (question == null) ? "" : question.toLowerCase();
        boolean isScholarship = q.contains("scholarship") || q.contains("స్కాలర్‌షిప్") || q.contains("छात्रवृत्ति") || q.contains("உதவித்தொகை") || q.contains("student") || q.contains("విద్యార్థి") || q.contains("fees") || q.contains("ఫీజు");
        boolean isHousing = q.contains("house") || q.contains("housing") || q.contains("ఇల్లు") || q.contains("గృహ") || q.contains("आवास") || q.contains("வீடு");
        boolean isFarmer = q.contains("farmer") || q.contains("agriculture") || q.contains("రైతు") || q.contains("వ్యవసాయం") || q.contains("किसान") || q.contains("कृषि") || q.contains("விவசாயி");

        if (language.equalsIgnoreCase("Telugu")) {
            if (isHousing) {
                return "ప్రధాన మంత్రి ఆవాస్ యోజన (PMAY) మరియు రాష్ట్ర గృహ నిర్మాణ పథకం ద్వారా సొంత ఇల్లు లేని అర్హులైన కుటుంబాలకు ఆర్థిక సహాయం లభిస్తుంది. ఆధార్ కార్డు, ఆదాయ మరియు నివాస ధృవీకరణ పత్రాలు అవసరం.";
            } else if (isFarmer) {
                return "రైతు భరోసా మరియు పిఎం కిసాన్ పథకాల ద్వారా వ్యవసాయ పెట్టుబడి సహాయం లభిస్తుంది. అర్హులైన రైతులు తమ భూమి పట్టాదారు పాస్‌బుక్ మరియు ఆధార్‌తో నమోదు చేసుకోవచ్చు.";
            } else if (isScholarship) {
                return "మీ ప్రొఫైల్ ఆధారంగా మీరు పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్, పిఎం యశస్వి పథకం మరియు రాష్ట్ర ఫీజు రీయింబర్స్‌మెంట్ పథకాలకు దరఖాస్తు చేసుకోవచ్చు. నేషనల్ స్కాలర్‌షిప్ పోర్టల్ (NSP) ద్వారా దరఖాస్తు చేసుకోండి.";
            }
            return "మీ ప్రొఫైల్ మరియు విద్యార్హత ఆధారంగా వివిధ ప్రభుత్వ సంక్షేమ మరియు విద్యా పథకాలు అందుబాటులో ఉన్నాయి. దయచేసి అధికారిక పోర్టల్ ద్వారా అర్హత ప్రమాణాలను పరిశీలించి దరఖాస్తు చేసుకోండి.";
        } else if (language.equalsIgnoreCase("Hindi")) {
            if (isHousing) {
                return "प्रधानमंत्री आवास योजना (PMAY) एवं राज्य आवास योजनाओं के तहत पात्र लाभार्थियों को पक्के मकान निर्माण हेतु वित्तीय सहायता प्रदान की जाती है। आय व निवास प्रमाण पत्र आवश्यक हैं।";
            } else if (isFarmer) {
                return "पीएम किसान सम्मान निधि और राज्य कृषि सहायता योजनाओं के तहत किसानों को वार्षिक वित्तीय सहायता मिलती है। भूमि दस्तावेज एवं आधार कार्ड से आवेदन करें।";
            } else if (isScholarship) {
                return "आपकी प्रोफ़ाइल के अनुसार आप पोस्ट-मैट्रिक छात्रवृत्ति, पीएम यशस्वी योजना और राज्य स्तरीय शुल्क प्रतिपूर्ति के लिए पात्र हो सकते हैं। राष्ट्रीय छात्रवृत्ति पोर्टल (NSP) पर आवेदन करें।";
            }
            return "आपकी प्रोफ़ाइल और राज्य के आधार पर संबंधित सरकारी योजनाएं और लाभ उपलब्ध हैं। कृपया आधिकारिक सरकारी पोर्टल पर पात्रता की जांच कर आवेदन करें।";
        } else if (language.equalsIgnoreCase("Tamil")) {
            if (isHousing) {
                return "பிரதான் மந்திரி ஆவாஸ் யோஜனா (PMAY) மற்றும் மாநில வீட்டு வசதி திட்டங்களின் கீழ் தகுதியுடைய குடும்பங்களுக்கு வீடு கட்ட நிதி உதவி வழங்கப்படுகிறது. வருமானம் மற்றும் இருப்பிட சான்றிதழ் தேவை.";
            } else if (isFarmer) {
                return "பிஎம் கிசான் மற்றும் மாநில உழவர் பாதுகாப்பு திட்டங்களின் கீழ் விவசாயிகளுக்கு நிதி உதவி வழங்கப்படுகிறது. நில ஆவணங்கள் மற்றும் ஆதார் மூலம் பதிவு செய்யலாம்.";
            } else if (isScholarship) {
                return "உங்கள் சுயவிவரத்தின்படி போஸ்ட்-மெட்ரிக் கல்வி உதவித்தொகை, பிஎம் யசஸ்வி மற்றும் மாநில அரசின் கல்வி கட்டண ஆதரவு திட்டங்களுக்கு நீங்கள் தகுதியுடையவராக இருக்கலாம். தேசிய உதவித்தொகை இணையதளத்தில் (NSP) விண்ணப்பிக்கவும்.";
            }
            return "உங்கள் சுயவிவரம் மற்றும் கல்வித் தகுதியின் அடிப்படையில் அரசு உதவித்தொகைகள் மற்றும் நலத்திட்டங்கள் கிடைக்க வாய்ப்புள்ளது. அதிகாரப்பூர்வ இணையதளத்தில் விவரங்களைச் சரிபார்த்து விண்ணப்பிக்கவும்.";
        } else {
            if (isHousing) {
                return "Under Pradhan Mantri Awas Yojana (PMAY) and state housing schemes, financial assistance for permanent housing is available for eligible applicants with income and residence certificates.";
            } else if (isFarmer) {
                return "PM-KISAN and state farmer support schemes provide direct financial assistance for agricultural inputs to eligible landowners and farmers.";
            } else if (isScholarship) {
                return "Based on your profile, student scholarship schemes such as Post-Matric Scholarship, PM YASASVI, and state fee reimbursements are available on the National Scholarship Portal (NSP).";
            }
            return "Based on your profile, multiple government schemes and educational benefits are available. Please verify the official requirements and apply through the government portal.";
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
