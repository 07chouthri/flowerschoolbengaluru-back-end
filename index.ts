import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes.js";
import { config } from './config.js';
// import { setupVite, serveStatic, log } from "./vite-setup.js"; // Commented out for production build
import { backgroundScheduler } from "./services/background-scheduler.js";
import cors from "cors";

const app = express();

// Configure CORS
app.use(
  cors({
    origin: config.server.cors.origins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

const startServer = async (server: any, retries = 3) => {
  const basePort = config.server.port;
  
  for (let i = 0; i < retries; i++) {
    const port = basePort + i;
    try {
      await new Promise((resolve, reject) => {
        server.listen(
          {
            port,
            host: "localhost",
          },
          () => {
            console.log(`serving on port ${port}`);
            resolve(undefined);
          }
        ).on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE' && i < retries - 1) {
            console.log(`Port ${port} is in use, trying ${port + 1}`);
            return;
          }
          reject(err);
        });
      });
      return port; // Successfully started server
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }
    }
  }
  throw new Error('Could not find an available port');
};

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Vite setup commented out for production build
    // if (app.get("env") === "development") {
    //   await setupVite(app, server);
    // } else {
    //   serveStatic(app);
    // }
    console.log("Server starting in production mode");

    const port = await startServer(server);
    
    // Start background scheduler for order status progression
    try {
      backgroundScheduler.start();
      console.log("Background scheduler started for order status progression");
    } catch (error) {
      console.error("Failed to start background scheduler:", error);
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
