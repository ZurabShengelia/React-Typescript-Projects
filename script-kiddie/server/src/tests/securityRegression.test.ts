import request from "supertest";
import { createApp } from "../app";
import { User } from "../models/User";
import * as mailerService from "../services/mailerService";

const app = createApp();

async function registerAndVerify(email: string, password = "StrongPass123") {
  const spy = jest.spyOn(mailerService, "sendVerificationCodeEmail").mockResolvedValue(undefined);
  await request(app).post("/api/auth/register").send({ name: "User", email, password });
  const code = spy.mock.calls[spy.mock.calls.length - 1][1];
  spy.mockRestore();
  await request(app).post("/api/auth/verify-email").send({ email, code });
}

describe("Password reset token: single-use and expiry", () => {
  it("cannot be used twice — the second attempt with the same token is rejected", async () => {
    const email = "resetreuse@example.com";
    await registerAndVerify(email);

    const spy = jest.spyOn(mailerService, "sendPasswordResetEmail").mockResolvedValue(undefined);
    await request(app).post("/api/auth/forgot-password").send({ email });
    const resetUrl = spy.mock.calls[spy.mock.calls.length - 1][1] as string;
    spy.mockRestore();
    const token = new URL(resetUrl, "http://localhost").searchParams.get("token")!;

    const first = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "BrandNewPass789" });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "AnotherPass999" });
    expect(second.status).toBe(400);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "BrandNewPass789" });
    expect(login.status).toBe(200);
  });

  it("rejects an expired reset token", async () => {
    const email = "resetexpired@example.com";
    await registerAndVerify(email);

    const spy = jest.spyOn(mailerService, "sendPasswordResetEmail").mockResolvedValue(undefined);
    await request(app).post("/api/auth/forgot-password").send({ email });
    const resetUrl = spy.mock.calls[spy.mock.calls.length - 1][1] as string;
    spy.mockRestore();
    const token = new URL(resetUrl, "http://localhost").searchParams.get("token")!;

    await User.updateOne({ email }, { $set: { passwordResetExpires: new Date(Date.now() - 1000) } });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "WontApplyPass1" });
    expect(res.status).toBe(400);
  });

  it("rejects a garbage/unknown reset token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "not-a-real-token-0000000000000000000000000000000000000000000", password: "SomePass123" });
    expect(res.status).toBe(400);
  });
});

describe("Email verification code: single-use and expiry", () => {
  it("cannot be reused once the account is already verified", async () => {
    const email = "verifyreuse@example.com";
    const spy = jest.spyOn(mailerService, "sendVerificationCodeEmail").mockResolvedValue(undefined);
    await request(app).post("/api/auth/register").send({ name: "User", email, password: "StrongPass123" });
    const code = spy.mock.calls[spy.mock.calls.length - 1][1];
    spy.mockRestore();

    const first = await request(app).post("/api/auth/verify-email").send({ email, code });
    expect(first.status).toBe(200);

    const second = await request(app).post("/api/auth/verify-email").send({ email, code });
    expect(second.status).toBe(400);
  });

  it("locks out further attempts after too many incorrect codes", async () => {
    const email = "verifylockout@example.com";
    jest.spyOn(mailerService, "sendVerificationCodeEmail").mockResolvedValue(undefined);
    await request(app).post("/api/auth/register").send({ name: "User", email, password: "StrongPass123" });

    let lastStatus = 0;
    for (let i = 0; i < 6; i += 1) {
      const res = await request(app).post("/api/auth/verify-email").send({ email, code: "000000" });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});

describe("Rate limiting actually engages", () => {
  it("returns 429 after exceeding the login rate limit", async () => {
    const email = "ratelimit@example.com";
    let sawRateLimited = false;

    for (let i = 0; i < 25; i += 1) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "WrongPassword1" });
      if (res.status === 429) {
        sawRateLimited = true;
        break;
      }
    }

    expect(sawRateLimited).toBe(true);
  });
});
