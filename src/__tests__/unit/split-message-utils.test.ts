/**
 * @jest-environment node
 */

import { describe, it, expect } from "@jest/globals";
import { interpolateTemplate } from "@/lib/utils";

describe("Split Message Template Interpolation", () => {
  describe("Message 1 Template (Text Only)", () => {
    it("should interpolate message 1 without links", () => {
      const template = "Hi {{name}}, thanks for your interest in the {{role}} position.";
      const data = {
        name: "John",
        role: "Software Engineer",
        calendly_link: "https://calendly.com/test",
        zoom_link: "https://zoom.us/test",
      };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Hi John, thanks for your interest in the Software Engineer position.");
      expect(result).not.toContain("calendly");
      expect(result).not.toContain("zoom");
    });

    it("should handle city variable in message 1", () => {
      const template = "Hi {{name}}, we're excited about your application in {{city}}.";
      const data = {
        name: "Jane",
        city: "San Francisco",
        role: "Designer",
      };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Hi Jane, we're excited about your application in San Francisco.");
    });
  });

  describe("Message 2 Template (Link Only)", () => {
    it("should interpolate message 2 with Calendly link", () => {
      const template = "Book a call: {{calendly_link}}";
      const data = {
        name: "John",
        calendly_link: "https://calendly.com/john/interview",
        zoom_link: "https://zoom.us/test",
      };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Book a call: https://calendly.com/john/interview");
      expect(result).toContain("calendly");
    });

    it("should interpolate message 2 with Zoom link", () => {
      const template = "Join meeting: {{zoom_link}}";
      const data = {
        name: "Jane",
        calendly_link: "https://calendly.com/test",
        zoom_link: "https://zoom.us/j/123456789",
      };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Join meeting: https://zoom.us/j/123456789");
      expect(result).toContain("zoom");
    });

    it("should handle long URLs in message 2", () => {
      const template = "Schedule: {{calendly_link}}";
      const longUrl = "https://calendly.com/very-long-username/very-long-event-name-with-many-parameters?param1=value1&param2=value2&param3=value3&param4=value4&param5=value5&param6=value6";
      const data = {
        name: "John",
        calendly_link: longUrl,
      };
      const result = interpolateTemplate(template, data);
      expect(result).toBe(`Schedule: ${longUrl}`);
      // Should warn if exceeds SMS segment limits (160 chars)
      expect(result.length).toBeGreaterThan(160);
    });
  });

  describe("Message 3 Template (Fallback)", () => {
    it("should interpolate message 3 fallback text", () => {
      const template = "Let me know if you didn't see the link!";
      const data = {
        name: "John",
        calendly_link: "https://calendly.com/test",
      };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Let me know if you didn't see the link!");
    });

    it("should handle optional message 3 with variables", () => {
      const template = "Hi {{name}}, please confirm you received the link.";
      const data = {
        name: "Jane",
        calendly_link: "https://calendly.com/test",
      };
      const result = interpolateTemplate(template, data);
      expect(result).toBe("Hi Jane, please confirm you received the link.");
    });
  });

  describe("SMS Segment Calculation", () => {
    it("should calculate segments correctly for message 1", () => {
      const message1 = "Hi {{name}}, thanks for your interest in the {{role}} position.";
      const interpolated = interpolateTemplate(message1, {
        name: "John",
        role: "Engineer",
      });
      const segments = Math.ceil(interpolated.length / 160);
      expect(segments).toBe(1); // Should be 1 segment for short message
    });

    it("should calculate segments correctly for message 2 with long URL", () => {
      const message2 = "Book a call: {{calendly_link}}";
      const longUrl = "https://calendly.com/very-long-username/very-long-event-name-with-many-parameters?param1=value1&param2=value2&param3=value3&param4=value4&param5=value5&param6=value6&param7=value7&param8=value8";
      const interpolated = interpolateTemplate(message2, {
        calendly_link: longUrl,
      });
      const segments = Math.ceil(interpolated.length / 160);
      expect(segments).toBeGreaterThan(1); // Should be multiple segments for long URL
    });

    it("should calculate segments correctly for message 3", () => {
      const message3 = "Let me know if you didn't see the link!";
      const segments = Math.ceil(message3.length / 160);
      expect(segments).toBe(1); // Should be 1 segment
    });
  });

  describe("Complete Split Message Sequence", () => {
    it("should interpolate all three messages correctly", () => {
      const message1Template = "Hi {{name}}, thanks for your interest.";
      const message2Template = "Book a call: {{calendly_link}}";
      const message3Template = "Let me know if you didn't see the link!";

      const data = {
        name: "John",
        role: "Engineer",
        city: "Oakland",
        calendly_link: "https://calendly.com/john/interview",
        zoom_link: "N/A",
      };

      const part1 = interpolateTemplate(message1Template, data);
      const part2 = interpolateTemplate(message2Template, data);
      const part3 = interpolateTemplate(message3Template, data);

      expect(part1).toBe("Hi John, thanks for your interest.");
      expect(part2).toBe("Book a call: https://calendly.com/john/interview");
      expect(part3).toBe("Let me know if you didn't see the link!");

      // Verify no links in part 1
      expect(part1).not.toContain("calendly");
      expect(part1).not.toContain("zoom");

      // Verify link in part 2
      expect(part2).toContain("calendly");

      // Verify part 3 is simple text
      expect(part3).not.toContain("calendly");
    });

    it("should handle missing Message 3 gracefully", () => {
      const message1Template = "Hi {{name}}";
      const message2Template = "Link: {{calendly_link}}";
      const message3Template = ""; // Empty

      const data = {
        name: "John",
        calendly_link: "https://calendly.com/test",
      };

      const part1 = interpolateTemplate(message1Template, data);
      const part2 = interpolateTemplate(message2Template, data);
      const part3 = message3Template ? interpolateTemplate(message3Template, data) : "";

      expect(part1).toBe("Hi John");
      expect(part2).toBe("Link: https://calendly.com/test");
      expect(part3).toBe("");

      // Should complete after part 2 when part 3 is empty
      const hasMessage3 = part3.trim().length > 0;
      expect(hasMessage3).toBe(false);
    });
  });
});

