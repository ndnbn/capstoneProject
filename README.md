# GovAI

Multilingual government-scheme assistant built with React, Vite, and a Java API.

## Local development

1. Start `CapstoneServer.java` from the Eclipse project. It runs on `http://localhost:8080`.
2. Run `npm run dev` in this project.
3. Open the Vite URL shown in the terminal.

## Website deployment

Deploy the React project to Vercel or Netlify. Deploy the Java project to a Java host such as Render or Railway, then set this frontend environment variable in the hosting dashboard:

```text
VITE_API_URL=https://your-backend-domain.example.com/api
```

The Java backend must allow the deployed website origin in its CORS configuration. The current demo stores accounts in memory; use a database before sharing the site publicly.
