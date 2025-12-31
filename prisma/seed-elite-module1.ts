/**
 * ELITE Module 1 Seed Data
 *
 * Seeds the complete Module 1 curriculum with all activity types:
 * Read It, Learn It, Discuss It, Practice It, Demonstrate It, Survey
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================
// Module 1 Content Configuration
// ============================================

const MODULE_1_CONTENT = {
  name: "Module 1: Foundations of Effective Leadership",
  description:
    "Establish the core principles of leadership effectiveness. Learn to Focus on what matters most, Design systems that drive results, and Assess progress accurately.",

  items: [
    // 1. Read It - Introduction
    {
      name: "Introduction to ELITE Principles",
      itemType: "READ",
      completionRule: "VIEW",
      sortOrder: 1,
      description: "Understand the three core ELITE principles: Focus, Design, Assessment",
      content: JSON.stringify({
        sections: [
          {
            id: "intro",
            title: "Welcome to ELITE Leadership",
            content: `
              <p>Welcome to the ELITE Leadership Development Program. Over the next several modules, you'll develop the skills and mindset needed to lead effectively in today's dynamic environment.</p>
              <p>ELITE is built on three foundational principles:</p>
              <ul>
                <li><strong>Focus</strong> - Identifying and prioritizing what truly matters</li>
                <li><strong>Design</strong> - Creating systems and processes that drive consistent results</li>
                <li><strong>Assessment</strong> - Measuring progress and adjusting approach based on evidence</li>
              </ul>
            `,
          },
          {
            id: "focus",
            title: "The Power of Focus",
            content: `
              <p>In a world of infinite demands, focus is your most valuable resource. Effective leaders don't try to do everything—they identify the vital few priorities that will drive the greatest impact.</p>
              <blockquote>"The key is not to prioritize what's on your schedule, but to schedule your priorities." – Stephen Covey</blockquote>
              <p>Focus means:</p>
              <ul>
                <li>Saying no to good opportunities to say yes to great ones</li>
                <li>Eliminating distractions that fragment your attention</li>
                <li>Aligning your team around shared goals</li>
              </ul>
            `,
          },
          {
            id: "design",
            title: "Designing for Success",
            content: `
              <p>Great leaders don't rely on willpower alone—they design systems that make success inevitable. This means creating structures, processes, and habits that support desired outcomes.</p>
              <p>Design principles include:</p>
              <ul>
                <li>Creating clear processes that eliminate ambiguity</li>
                <li>Building in checkpoints and feedback loops</li>
                <li>Making the right behavior the easy behavior</li>
              </ul>
            `,
          },
          {
            id: "assessment",
            title: "Assessment as a Tool",
            content: `
              <p>What gets measured gets managed. Effective leaders establish clear metrics and regularly assess progress—not to judge, but to learn and adapt.</p>
              <p>Assessment practices:</p>
              <ul>
                <li>Define leading and lagging indicators</li>
                <li>Create regular review rhythms</li>
                <li>Use data to inform decisions, not justify them</li>
              </ul>
            `,
          },
        ],
        estimatedMinutes: 15,
      }),
      competencyTags: JSON.stringify(["FOCUS", "DESIGN", "ASSESSMENT"]),
    },

    // 2. Learn It - Quiz on ELITE Principles
    {
      name: "ELITE Principles Assessment",
      itemType: "LEARN",
      completionRule: "SCORE_AT_LEAST",
      completionThreshold: 80,
      sortOrder: 2,
      description: "Test your understanding of the core ELITE principles",
      content: JSON.stringify({
        questions: [
          {
            id: "q1",
            text: "What are the three core ELITE principles?",
            type: "multiple_choice",
            options: [
              { id: "a", text: "Focus, Design, Assessment" },
              { id: "b", text: "Plan, Execute, Review" },
              { id: "c", text: "Lead, Manage, Delegate" },
              { id: "d", text: "Vision, Strategy, Execution" },
            ],
            correctAnswers: ["a"],
            explanation: "The three ELITE principles are Focus, Design, and Assessment.",
          },
          {
            id: "q2",
            text: "According to ELITE, what does 'Focus' primarily mean?",
            type: "multiple_choice",
            options: [
              { id: "a", text: "Working longer hours than others" },
              { id: "b", text: "Identifying and prioritizing what truly matters" },
              { id: "c", text: "Concentrating on one task at a time" },
              { id: "d", text: "Eliminating all meetings" },
            ],
            correctAnswers: ["b"],
            explanation: "Focus is about identifying the vital few priorities that drive the greatest impact.",
          },
          {
            id: "q3",
            text: "Which of the following is an example of 'Design' in action?",
            type: "multiple_choice",
            options: [
              { id: "a", text: "Working harder when things get difficult" },
              { id: "b", text: "Creating processes that make the right behavior the easy behavior" },
              { id: "c", text: "Hoping that things will improve over time" },
              { id: "d", text: "Waiting for problems to arise before addressing them" },
            ],
            correctAnswers: ["b"],
            explanation: "Design is about creating systems and structures that support desired outcomes.",
          },
          {
            id: "q4",
            text: "What is the primary purpose of Assessment in ELITE?",
            type: "multiple_choice",
            options: [
              { id: "a", text: "To judge performance and assign blame" },
              { id: "b", text: "To learn and adapt based on evidence" },
              { id: "c", text: "To create reports for leadership" },
              { id: "d", text: "To rank employees against each other" },
            ],
            correctAnswers: ["b"],
            explanation: "Assessment is a tool for learning and adaptation, not judgment.",
          },
          {
            id: "q5",
            text: "Which of these are examples of effective Focus? (Select all that apply)",
            type: "multiple_select",
            options: [
              { id: "a", text: "Saying no to good opportunities to say yes to great ones" },
              { id: "b", text: "Trying to accomplish everything on your task list" },
              { id: "c", text: "Aligning your team around shared goals" },
              { id: "d", text: "Responding immediately to every email" },
            ],
            correctAnswers: ["a", "c"],
            explanation: "Effective focus involves prioritization and alignment, not just being busy.",
          },
        ],
        allowRetakes: true,
        showCorrectAnswers: true,
      }),
      competencyTags: JSON.stringify(["FOCUS", "DESIGN", "ASSESSMENT"]),
    },

    // 3. Discuss It - Reflection on Focus
    {
      name: "Reflecting on Your Focus",
      itemType: "DISCUSS",
      completionRule: "MARK_DONE",
      sortOrder: 3,
      description: "Share your experiences with prioritization and focus",
      content: JSON.stringify({
        prompt: `
          <p>Think about a recent time when you had to choose between multiple competing priorities.</p>
          <ul>
            <li>What criteria did you use to make your decision?</li>
            <li>How did it feel to say 'no' to some things?</li>
            <li>What would you do differently next time?</li>
          </ul>
          <p>Share your reflection with your cohort and respond to at least one peer's post.</p>
        `,
      }),
      competencyTags: JSON.stringify(["FOCUS"]),
    },

    // 4. Practice It - Priority Matrix Exercise
    {
      name: "Priority Matrix Exercise",
      itemType: "PRACTICE",
      completionRule: "MARK_DONE",
      sortOrder: 4,
      description: "Apply the priority matrix to your current responsibilities",
      content: JSON.stringify({
        instructions: `
          <h3>Exercise: Build Your Priority Matrix</h3>
          <p>Using the Eisenhower Matrix framework, categorize your current responsibilities:</p>
          <ol>
            <li><strong>List</strong> all your current responsibilities and tasks</li>
            <li><strong>Categorize</strong> each into one of four quadrants:
              <ul>
                <li>Urgent & Important → DO immediately</li>
                <li>Important but Not Urgent → SCHEDULE</li>
                <li>Urgent but Not Important → DELEGATE</li>
                <li>Neither Urgent nor Important → ELIMINATE</li>
              </ul>
            </li>
            <li><strong>Identify</strong> 3 items you should stop doing or delegate</li>
            <li><strong>Commit</strong> to one action you will take this week</li>
          </ol>
          <p>Mark this activity as complete once you've finished the exercise.</p>
        `,
        template: "Download the Priority Matrix template from the Resources section.",
      }),
      competencyTags: JSON.stringify(["FOCUS", "DESIGN"]),
    },

    // 5. Demonstrate It - Personal Activity Calendar
    {
      name: "Personal Activity Calendar",
      itemType: "DEMONSTRATE",
      completionRule: "SUBMIT",
      sortOrder: 5,
      description: "Submit your completed Personal Activity Calendar for coach review",
      content: JSON.stringify({
        overview: `
          <h3>Capstone Assignment: Personal Activity Calendar</h3>
          <p>Create a Personal Activity Calendar that demonstrates how you will apply the ELITE principles in your daily work.</p>
        `,
        requirements: [
          "Include at least 2 weeks of planned activities",
          "Clearly identify your top 3 priorities for each week",
          "Show how you've designed time blocks for deep work",
          "Include review/assessment checkpoints",
          "Use the provided template or create your own",
        ],
        rubric: [
          { criterion: "Priority Clarity", description: "Top priorities are clearly identified and justified", maxPoints: 25 },
          { criterion: "Design Quality", description: "Calendar structure supports focused work", maxPoints: 25 },
          { criterion: "Assessment Integration", description: "Includes regular review checkpoints", maxPoints: 25 },
          { criterion: "Actionability", description: "Plan is realistic and specific", maxPoints: 25 },
        ],
        fileTypes: ["pdf", "doc", "docx", "xlsx"],
      }),
      competencyTags: JSON.stringify(["FOCUS", "DESIGN", "ASSESSMENT"]),
    },

    // 6. Survey - Module 1 Feedback
    {
      name: "Module 1 Feedback",
      itemType: "SURVEY",
      completionRule: "SUBMIT",
      sortOrder: 6,
      description: "Share your feedback on Module 1",
      content: JSON.stringify({
        questions: [
          {
            id: "s1",
            text: "How would you rate the overall quality of this module?",
            type: "rating",
            scale: 5,
          },
          {
            id: "s2",
            text: "How confident do you feel applying the ELITE principles?",
            type: "rating",
            scale: 5,
          },
          {
            id: "s3",
            text: "What was the most valuable part of this module?",
            type: "open_text",
          },
          {
            id: "s4",
            text: "What could be improved?",
            type: "open_text",
          },
          {
            id: "s5",
            text: "Would you recommend this module to a colleague?",
            type: "multiple_choice",
            options: [
              { id: "yes", text: "Yes" },
              { id: "maybe", text: "Maybe" },
              { id: "no", text: "No" },
            ],
          },
        ],
        anonymous: false,
      }),
      competencyTags: JSON.stringify([]),
    },
  ],
};

// ============================================
// Seed Function
// ============================================

export async function seedModule1(clientId: string, templateId: string) {
  console.log("🌱 Seeding ELITE Module 1 content...");

  // Create the course
  const course = await prisma.course.upsert({
    where: {
      clientId_name: {
        clientId,
        name: "ELITE Leadership Fundamentals",
      },
    },
    update: {},
    create: {
      clientId,
      templateId,
      name: "ELITE Leadership Fundamentals",
      description: "The foundational ELITE Leadership program covering Focus, Design, and Assessment principles.",
      status: "PUBLISHED",
    },
  });

  console.log(`  ✓ Course created/found: ${course.name}`);

  // Create Module 1
  const module1 = await prisma.courseModule.upsert({
    where: {
      clientId_courseId_name: {
        clientId,
        courseId: course.id,
        name: MODULE_1_CONTENT.name,
      },
    },
    update: {
      description: MODULE_1_CONTENT.description,
    },
    create: {
      clientId,
      courseId: course.id,
      name: MODULE_1_CONTENT.name,
      description: MODULE_1_CONTENT.description,
      sortOrder: 1,
    },
  });

  console.log(`  ✓ Module created/found: ${module1.name}`);

  // Create Items
  for (const itemData of MODULE_1_CONTENT.items) {
    const item = await prisma.courseItem.upsert({
      where: {
        clientId_moduleId_name: {
          clientId,
          moduleId: module1.id,
          name: itemData.name,
        },
      },
      update: {
        description: itemData.description,
        content: itemData.content,
        completionRule: itemData.completionRule,
        completionThreshold: itemData.completionThreshold || null,
        competencyTags: itemData.competencyTags,
      },
      create: {
        clientId,
        moduleId: module1.id,
        name: itemData.name,
        description: itemData.description,
        itemType: itemData.itemType,
        completionRule: itemData.completionRule,
        completionThreshold: itemData.completionThreshold || null,
        content: itemData.content,
        sortOrder: itemData.sortOrder,
        competencyTags: itemData.competencyTags,
      },
    });

    console.log(`    ✓ Item: ${item.name} (${item.itemType})`);

    // Create discussion requirement for DISCUSS items
    if (itemData.itemType === "DISCUSS") {
      await prisma.discussionRequirement.upsert({
        where: { itemId: item.id },
        update: {},
        create: {
          clientId,
          itemId: item.id,
          requirePost: true,
          minReplies: 1,
        },
      });
      console.log(`      ✓ Discussion requirement created`);
    }
  }

  console.log("✅ Module 1 seed complete!");

  return { course, module: module1 };
}

// Run if called directly
async function main() {
  // Find the first client with ELITE setup
  const client = await prisma.client.findFirst({
    where: {
      programTemplates: {
        some: {},
      },
    },
    include: {
      programTemplates: true,
    },
  });

  if (!client) {
    console.error("❌ No client with ELITE setup found. Run the main seed first.");
    process.exit(1);
  }

  const template = client.programTemplates[0];

  await seedModule1(client.id, template.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

