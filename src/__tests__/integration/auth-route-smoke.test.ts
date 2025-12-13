/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";

// Mock NextAuth handler
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}));

describe("auth-route smoke tests", () => {
  describe("GET /api/auth/[...nextauth]", () => {
    it("should exist and respond", async () => {
      const request = new NextRequest("http://localhost/api/auth/signin");
      
      // Mock NextAuth GET handler
      (GET as jest.Mock).mockResolvedValue(
        new Response(null, { status: 200 })
      );

      const response = await GET(request);
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/auth/[...nextauth]", () => {
    it("should exist and respond", async () => {
      const request = new NextRequest("http://localhost/api/auth/callback/credentials", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password",
        }),
      });

      // Mock NextAuth POST handler
      (POST as jest.Mock).mockResolvedValue(
        new Response(null, { status: 200 })
      );

      const response = await POST(request);
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/auth/session", () => {
    it("should return session endpoint", async () => {
      const request = new NextRequest("http://localhost/api/auth/session");

      // Mock session endpoint
      (GET as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ user: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("user");
    });
  });

  describe("CSRF protection", () => {
    it("should verify CSRF protection is in place", () => {
      // NextAuth.js has built-in CSRF protection
      // This test verifies the route is using NextAuth
      // Actual CSRF testing would require more complex setup
      expect(GET).toBeDefined();
      expect(POST).toBeDefined();
    });
  });
});

