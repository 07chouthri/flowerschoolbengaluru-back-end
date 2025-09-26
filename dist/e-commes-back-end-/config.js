// config.ts
export const config = {
    nodeEnv: process.env.NODE_ENV || "development",
    database: {
        url: process.env.DATABASE_URL || "postgres://postgres:Vyshnudevi7507!@localhost:5432/bouquetbar"
    },
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || "ACa7d60a101d2a07a7d96b1b000d462b3d",
        authToken: process.env.TWILIO_AUTH_TOKEN || "9b8d6ecef4bb64ed53f6d2d2d6514f7d",
        verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || "VA793237945fdb5873770ef0866054a4a9",
        sms: {
            fromNumber: process.env.TWILIO_PHONE_NUMBER || "+12567333181",
            phoneNumber: process.env.TWILIO_PHONE_NUMBER || "+12567333181"
        },
        whatsapp: {
            fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886"
        },
        verify: {
            serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID || "VA793237945fdb5873770ef0866054a4a9"
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
                "https://www.flowerschoolbengaluru.com",
                "https://app.flowerschoolbengaluru.com"
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
