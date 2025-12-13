/**
 * @jest-environment node
 */

import { interpolateTemplate } from "@/lib/utils";

describe("template-engine", () => {
  describe("interpolateTemplate", () => {
    it("should replace basic merge tags", () => {
      const template = "Hi {{name}}, welcome to {{city}}!";
      const data = { name: "John", city: "Oakland" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Hi John, welcome to Oakland!");
    });

    it("should handle multiple merge tags", () => {
      const template = "Hi {{name}}, you applied for {{role}} in {{city}}.";
      const data = { name: "Jane", role: "Software Engineer", city: "San Francisco" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Hi Jane, you applied for Software Engineer in San Francisco.");
    });

    it("should handle missing merge tags gracefully", () => {
      const template = "Hi {{name}}, your role is {{role}}.";
      const data = { name: "Bob" }; // role is missing
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Hi Bob, your role is {{role}}.");
    });

    it("should handle Calendly link replacement", () => {
      const template = "Schedule your interview: {{calendly_link}}";
      const data = { calendly_link: "https://calendly.com/interview" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Schedule your interview: https://calendly.com/interview");
    });

    it("should handle Zoom link replacement", () => {
      const template = "Join the meeting: {{zoom_link}}";
      const data = { zoom_link: "https://zoom.us/j/123456" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Join the meeting: https://zoom.us/j/123456");
    });

    it("should handle special characters in template", () => {
      const template = "Hi {{name}}! Your message: \"{{message}}\"";
      const data = { name: "Alice", message: "Hello, world!" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Hi Alice! Your message: \"Hello, world!\"");
    });

    it("should handle empty template", () => {
      const template = "";
      const data = { name: "John" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("");
    });

    it("should handle template with no merge tags", () => {
      const template = "This is a plain message with no merge tags.";
      const data = { name: "John" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("This is a plain message with no merge tags.");
    });

    it("should handle multiple occurrences of same tag", () => {
      const template = "{{name}} says hello, {{name}}!";
      const data = { name: "John" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("John says hello, John!");
    });

    it("should handle nested-like tags (not actually nested, just adjacent)", () => {
      const template = "{{name}}{{city}}";
      const data = { name: "John", city: "Oakland" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("JohnOakland");
    });

    it("should handle tags with whitespace in data", () => {
      const template = "Hi {{name}}!";
      const data = { name: "John Doe" };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Hi John Doe!");
    });

    it("should handle empty data values", () => {
      const template = "Hi {{name}}!";
      const data = { name: "" };
      const result = interpolateTemplate(template, data);
      // Empty string should replace the tag (implementation behavior)
      expect(result).toBe("Hi !");
    });
  });
});

