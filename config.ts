// config.ts
export const config = {
  database: {
    url: "postgres://postgres:Vyshnudevi7507!@localhost:5432/bouquetbar"
  },
  twilio: {
    accountSid: "ACa7d60a101d2a07a7d96b1b000d462b3d",
    authToken: "9b8d6ecef4bb64ed53f6d2d2d6514f7d",
    verifyServiceSid: "VA793237945fdb5873770ef0866054a4a9",
    sms: {
      fromNumber: "+12567333181",
      phoneNumber: "+12567333181"
    },
    whatsapp: {
      fromNumber: "+14155238886"
    },
    verify: {
      serviceSid: "VA793237945fdb5873770ef0866054a4a9"
    }
  },
  server: {
    port: 5000,
    cors: {
      origins: ["http://localhost:5173", "http://localhost:8080", "http://localhost:4173"]
    }
  },
  admin: {
    phone: "+919042358932",
    emails: ["admin@bouquetbar.com", "support@bouquetbar.com","vasuchouthri811@gmail.com"]
  }
};