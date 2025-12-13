import { http, HttpResponse } from "msw";

/**
 * MSW handlers for mocking API requests in tests.
 * Add handlers as needed for your tests.
 */
export const handlers = [
  // Example: Mock OpenAI API
  // http.post("https://api.openai.com/v1/chat/completions", () => {
  //   return HttpResponse.json({
  //     choices: [{ message: { content: "Mocked AI response" } }],
  //   });
  // }),
];

