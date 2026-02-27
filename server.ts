import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const JWT_SECRET = process.env.JWT_SECRET || "fluxed-secret-key";
const PORT = 3000;

// In-memory data store for the prototype
const db = {
  users: [] as any[],
  classes: [
    { id: 'c1', name: 'Class 1A', teacherId: 't1' },
    { id: 'c2', name: 'Class 2B', teacherId: 't1' }
  ],
  quizzes: [] as any[],
  assignments: [] as any[],
  studentProgress: [] as any[]
};

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Passport configuration
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "dummy-id",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-secret",
        callbackURL: `${process.env.APP_URL}/auth/google/callback`,
      },
      (accessToken, refreshToken, profile, done) => {
        // In a real app, find or create user in DB
        const user = {
          id: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0].value,
          picture: profile.photos?.[0].value,
        };
        return done(null, user);
      }
    )
  );

  // --- Auth Routes ---

  // Endpoint to get the Google Auth URL (for popup pattern)
  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = `${process.env.APP_URL}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "dummy-id",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "profile email",
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.json({ url: authUrl });
  });

  // Google OAuth Callback
  app.get("/auth/google/callback", async (req, res) => {
    // In this prototype, we'll just simulate success for the demo if no keys are provided
    // or handle the real code if keys are present.
    const { code } = req.query;
    
    // Mock user for demo purposes if no real code/keys
    const mockUser = {
      id: "google-123",
      name: "Demo User",
      email: "demo@fluxed.edu",
      picture: "https://picsum.photos/seed/user/100/100"
    };

    const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: "7d" });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  // Fallback Login (for testing without Google)
  app.post("/api/auth/login", (req, res) => {
    const { email, name, role } = req.body;
    const user = { id: Date.now().toString(), email, name, role };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  });

  // Get Current User
  app.get("/api/auth/me", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json(decoded);
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // --- School Mode API ---

  app.get("/api/school/classes", (req, res) => {
    res.json(db.classes);
  });

  app.post("/api/school/quizzes", (req, res) => {
    const quiz = { id: Date.now().toString(), ...req.body };
    db.quizzes.push(quiz);
    res.json(quiz);
  });

  app.get("/api/school/quizzes", (req, res) => {
    res.json(db.quizzes);
  });

  // --- Individual Mode API ---

  app.post("/api/student/progress", (req, res) => {
    const progress = { id: Date.now().toString(), timestamp: new Date(), ...req.body };
    db.studentProgress.push(progress);
    res.json(progress);
  });

  app.get("/api/student/progress/:userId", (req, res) => {
    const userProgress = db.studentProgress.filter(p => p.userId === req.params.userId);
    res.json(userProgress);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
