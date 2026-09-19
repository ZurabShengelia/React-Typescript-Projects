import request from "supertest";
import { createApp } from "../app";
import { User } from "../models/User";
import { Attempt } from "../models/Attempt";
import * as mailerService from "../services/mailerService";

const app = createApp();

async function registerAndLogin(email: string, password = "StrongPass123") {
  const agent = request.agent(app);
  const spy = jest.spyOn(mailerService, "sendVerificationCodeEmail").mockResolvedValue(undefined);
  await agent.post("/api/auth/register").send({ name: "User", email, password });
  const code = spy.mock.calls[spy.mock.calls.length - 1][1];
  spy.mockRestore();
  await agent.post("/api/auth/verify-email").send({ email, code });
  return agent;
}

describe("Two-step password change", () => {
  it("does not change the password until the emailed code is confirmed", async () => {
    const email = "changepw@example.com";
    const agent = await registerAndLogin(email);

    const spy = jest.spyOn(mailerService, "sendPasswordChangeCodeEmail").mockResolvedValue(undefined);
    const step1 = await agent
      .post("/api/auth/change-password")
      .send({ currentPassword: "StrongPass123", newPassword: "NewStrongPass456" });
    expect(step1.status).toBe(200);
    const code = spy.mock.calls[spy.mock.calls.length - 1][1];
    spy.mockRestore();

    const stillOldPassword = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "StrongPass123" });
    expect(stillOldPassword.status).toBe(200);

    const step2 = await agent.post("/api/auth/change-password/confirm").send({ code });
    expect(step2.status).toBe(200);

    const withNewPassword = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "NewStrongPass456" });
    expect(withNewPassword.status).toBe(200);

    const withOldPassword = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "StrongPass123" });
    expect(withOldPassword.status).toBe(401);
  });

  it("rejects an incorrect confirmation code", async () => {
    const agent = await registerAndLogin("badcode@example.com");
    jest.spyOn(mailerService, "sendPasswordChangeCodeEmail").mockResolvedValue(undefined);
    await agent
      .post("/api/auth/change-password")
      .send({ currentPassword: "StrongPass123", newPassword: "NewStrongPass456" });

    const res = await agent.post("/api/auth/change-password/confirm").send({ code: "000000" });
    expect(res.status).toBe(400);
  });

  it("rejects the request step with the wrong current password", async () => {
    const agent = await registerAndLogin("wrongcurrent@example.com");
    const res = await agent
      .post("/api/auth/change-password")
      .send({ currentPassword: "NotTheRealPassword1", newPassword: "NewStrongPass456" });
    expect(res.status).toBe(401);
  });
});

describe("Two-step account deletion", () => {
  it("does not delete the account until the emailed code is confirmed, then cascades", async () => {
    const email = "deleteme@example.com";
    const agent = await registerAndLogin(email);
    const me = await agent.get("/api/auth/me");
    const userId = me.body.data.user.id;

    const spy = jest.spyOn(mailerService, "sendAccountDeletionCodeEmail").mockResolvedValue(undefined);
    const step1 = await agent.post("/api/profile/delete-request");
    expect(step1.status).toBe(200);
    const code = spy.mock.calls[spy.mock.calls.length - 1][1];
    spy.mockRestore();

    const stillThere = await User.findById(userId);
    expect(stillThere).not.toBeNull();

    const step2 = await agent.post("/api/profile/delete-request/confirm").send({ code });
    expect(step2.status).toBe(200);

    const gone = await User.findById(userId);
    expect(gone).toBeNull();

    const attempts = await Attempt.find({ user: userId });
    expect(attempts).toHaveLength(0);

    const meAfter = await agent.get("/api/auth/me");
    expect(meAfter.status).toBe(401);
  });

  it("rejects an incorrect deletion confirmation code", async () => {
    const agent = await registerAndLogin("baddeletecode@example.com");
    jest.spyOn(mailerService, "sendAccountDeletionCodeEmail").mockResolvedValue(undefined);
    await agent.post("/api/profile/delete-request");

    const res = await agent.post("/api/profile/delete-request/confirm").send({ code: "000000" });
    expect(res.status).toBe(400);
  });
});
