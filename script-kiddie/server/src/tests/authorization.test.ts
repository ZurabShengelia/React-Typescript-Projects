import request from "supertest";
import { createApp } from "../app";
import * as mailerService from "../services/mailerService";

const app = createApp();

async function registerAndLogin(email: string) {
  const agent = request.agent(app);
  const spy = jest.spyOn(mailerService, "sendVerificationCodeEmail").mockResolvedValue(undefined);

  await agent.post("/api/auth/register").send({ name: "User", email, password: "StrongPass123" });
  const code = spy.mock.calls[spy.mock.calls.length - 1][1];
  spy.mockRestore();

  await agent.post("/api/auth/verify-email").send({ email, code });
  return agent;
}

describe("Authorization boundaries", () => {
  it("does not let a user fetch another user's attempt by guessing an id", async () => {
    const userA = await registerAndLogin("usera@example.com");
    const userB = await registerAndLogin("userb@example.com");

    const fakeId = "64b1f0c2f1a2b3c4d5e6f7a8";
    const res = await userB.get(`/api/attempts/${fakeId}`);
    expect(res.status).toBe(404);

    const resA = await userA.get(`/api/attempts/${fakeId}`);
    expect(resA.status).toBe(404);
  });

  it("does not allow updating protected profile fields via the profile update endpoint", async () => {
    const agent = await registerAndLogin("protected@example.com");
    const res = await agent.patch("/api/profile").send({ name: "New Name", role: "admin" });
    expect(res.status).toBe(400);
  });
});
