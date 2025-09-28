// config.ts
export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  database: {
    url: process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/bouquetbar"
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || "",
    sms: {
      fromNumber: process.env.TWILIO_PHONE_NUMBER || "",
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || ""
    },
    whatsapp: {
      fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || ""
    },
    verify: {
      serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID || ""
    }
  },
  server: {
    port: Number(process.env.PORT) || 5000,
    host: process.env.HOST || "0.0.0.0",
    cors: {
      origins: (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:4173",
        "https://localhost:5000",
        "https://flowerschoolbengaluru.com",
        "https://app.flowerschoolbengaluru.com",
        "http://localhost:5173/",
        "http://localhost:8080/",
        "http://localhost:4173/",
        "https://localhost:5000/",
        "https://flowerschoolbengaluru.com/",
        "https://app.flowerschoolbengaluru.com/"  
      ])
    }
  },
  admin: {
    phone: process.env.ADMIN_PHONE || "+919042358932",
    emails: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",") : ["admin@bouquetbar.com", "support@bouquetbar.com", "vasuchouthri811@gmail.com"]
  },
  session: {
    secret: process.env.SESSION_SECRET || "dev_secret"
  },
  ssl: {
    useSSL: process.env.USE_SSL === "true",
    certPath: process.env.SSL_CERT_PATH || "",
    keyPath: process.env.SSL_KEY_PATH || ""
  }
};