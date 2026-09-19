import request from "supertest";
import { createApp } from "../app";
import * as mailerService from "../services/mailerService";

const app = createApp();

async function registerAndVerify(credentials: { name: string; email: string; password: string }) {
  const spy = jest.spyOn(mailerService, "sendVerificationCodeEmail").mockResolvedValue(undefined);

  const registerRes = await request(app).post("/api/auth/register").send(credentials);
  const code = spy.mock.calls[spy.mock.calls.length - 1][1];
  spy.mockRestore();

  const verifyRes = await request(app).post("/api/auth/verify-email").send({ email: credentials.email, code });
  return { registerRes, verifyRes };
}

describe("Auth flows", () => {
  const credentials = { name: "Ada Lovelace", email: "ada@example.com", password: "StrongPass123" };

  it("registers a new user as unverified — no cookies, no user object yet", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(credentials.email);
    expect(res.body.data).not.toHaveProperty("user");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("rejects duplicate registration", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });

  it("rejects login for an unverified account with a distinguishable error", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("EMAIL_NOT_VERIFIED");
  });

  it("completes registration via the emailed code, then can log in", async () => {
    const { registerRes, verifyRes } = await registerAndVerify(credentials);
    expect(registerRes.status).toBe(201);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.user.email).toBe(credentials.email);
    expect(verifyRes.body.data.user).not.toHaveProperty("passwordHash");
    expect(verifyRes.headers["set-cookie"]).toBeDefined();

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.email).toBe(credentials.email);
  });

  it("rejects an incorrect verification code", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email: credentials.email, code: "000000" });
    expect(res.status).toBe(400);
  });

  it("rejects login with wrong password (after verifying)", async () => {
    await registerAndVerify(credentials);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "WrongPassword1" });
    expect(res.status).toBe(401);
  });

  it("sends a password reset email when a user requests a reset link", async () => {
    await registerAndVerify(credentials);
    const spy = jest.spyOn(mailerService, "sendPasswordResetEmail").mockResolvedValue(undefined);

    const res = await request(app).post("/api/auth/forgot-password").send({ email: credentials.email });

    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe(credentials.email);
    expect(spy.mock.calls[0][1]).toContain("/reset-password?token=");
  });

  it("rejects weak passwords on registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "weak@example.com", password: "short" });
    expect(res.status).toBe(400);
  });

  it("blocks access to /me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
