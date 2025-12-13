/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock OpenAI before importing
jest.mock("openai", () => {
  return jest.fn().mockImplementation((config: any) => {
    return {
      baseURL: config.baseURL,
      defaultHeaders: config.defaultHeaders,
      defaultQuery: config.defaultQuery,
      apiKey: config.apiKey,
    };
  });
});

describe("Azure OpenAI Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Set required env vars to avoid errors
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    process.env.AZURE_OPENAI_ENDPOINT = "https://test-resource.openai.azure.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should construct baseURL correctly when env vars are set", () => {
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4o";

    // Re-import to get fresh client with new env vars
    delete require.cache[require.resolve("@/lib/azure-openai-client")];
    const { azureOpenAI } = require("@/lib/azure-openai-client");

    expect(azureOpenAI.baseURL).toBe(
      "https://test-resource.openai.azure.com/openai/deployments/gpt-4o"
    );
  });

  it("should use default deployment name when not specified", () => {
    delete process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    delete require.cache[require.resolve("@/lib/azure-openai-client")];
    const { azureOpenAI } = require("@/lib/azure-openai-client");

    expect(azureOpenAI.baseURL).toBe(
      "https://test-resource.openai.azure.com/openai/deployments/gpt-4o"
    );
  });

  it("should set api-key header", () => {
    delete require.cache[require.resolve("@/lib/azure-openai-client")];
    const { azureOpenAI } = require("@/lib/azure-openai-client");

    expect(azureOpenAI.defaultHeaders).toHaveProperty("api-key", "test-key");
  });

  it("should set api-version query parameter", () => {
    delete require.cache[require.resolve("@/lib/azure-openai-client")];
    const { azureOpenAI } = require("@/lib/azure-openai-client");

    expect(azureOpenAI.defaultQuery).toHaveProperty("api-version", "2024-08-01-preview");
  });
});
