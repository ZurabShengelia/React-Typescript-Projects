import dotenv from "dotenv";
dotenv.config();

const isProd = process.env.NODE_ENV === "production";

function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value) return value;

  if (!isProd && devFallback) return devFallback;

  throw new Error(`Missing required environment variable: ${name}`);
}

function requiredSecret(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Generate one with ` +
        `\`openssl rand -hex 64\` and set it in your .env — there is no safe default.`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGO_URI", "mongodb://127.0.0.1:27017/script_kiddie"),
  jwtAccessSecret: requiredSecret("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requiredSecret("JWT_REFRESH_SECRET"),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? "30d",
  clientUrl: required("CLIENT_URL", "http://localhost:5173"),
  cookieDomain: process.env.COOKIE_DOMAIN,
  isProd,
  dbConnectMaxRetries: Number(process.env.DB_CONNECT_MAX_RETRIES ?? 10),
  dbConnectRetryDelayMs: Number(process.env.DB_CONNECT_RETRY_DELAY_MS ?? 1000),

  emailUser: process.env.EMAIL_USER,
  emailAppPassword: process.env.EMAIL_APP_PASSWORD,
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
};
