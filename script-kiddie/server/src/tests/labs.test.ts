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

describe("Labs", () => {
  const credentials = { name: "Lab User", email: "labs@example.com", password: "StrongPass123" };

  it("rejects unauthenticated access to labs", async () => {
    const res = await request(app).get("/api/labs");
    expect(res.status).toBe(401);
  });

  it("lists six labs grouped by the three difficulty tiers and exposes the correct labels", async () => {
    const { verifyRes } = await registerAndVerify(credentials);
    const cookie = verifyRes.headers["set-cookie"][0].split(";")[0];

    const listRes = await request(app).get("/api/labs").set("Cookie", cookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(7);
    const difficulties = listRes.body.data.map((lab: { difficulty: string }) => lab.difficulty);
    expect(difficulties).toEqual(expect.arrayContaining(["easy", "medium", "hard"]));
    expect(listRes.body.data.some((lab: { difficultyLabel: string }) => lab.difficultyLabel === "Script Kiddie")).toBe(true);
    expect(listRes.body.data.some((lab: { difficultyLabel: string }) => lab.difficultyLabel === "Experienced Coder")).toBe(true);
    expect(listRes.body.data.some((lab: { difficultyLabel: string }) => lab.difficultyLabel === "Senior Developer")).toBe(true);
  });

  it("allows an authenticated user to start a simulated lab and submit the correct flag", async () => {
    const { verifyRes } = await registerAndVerify(credentials);
    const cookie = verifyRes.headers["set-cookie"][0].split(";")[0];

    const listRes = await request(app).get("/api/labs").set("Cookie", cookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);

    const firstEasyLab = listRes.body.data.find((lab: { difficulty: string }) => lab.difficulty === "easy");
    expect(firstEasyLab).toBeDefined();

    const acceptRes = await request(app).post("/api/labs/accept-aup").set("Cookie", cookie).send();
    expect(acceptRes.status).toBe(200);

    const startRes = await request(app)
      .post(`/api/labs/${firstEasyLab.slug}/start`)
      .set("Cookie", cookie)
      .send();

    expect(startRes.status).toBe(200);
    expect(startRes.body.data.attempt).toBeDefined();

    const submitRes = await request(app)
      .post(`/api/labs/${firstEasyLab.slug}/submit-flag`)
      .set("Cookie", cookie)
      .send({ flag: "SCRIPTKIDDIE{hidden_file_found}" });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.completed).toBe(true);
  });
});
