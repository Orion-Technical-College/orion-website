# ELITE Curriculum Delivery System

## Overview

The ELITE (Elite Leadership Training) curriculum delivery system is a full LMS engine embedded within the EMC Workspace platform. It delivers structured learning experiences with multiple activity types, progress tracking, quiz mastery, discussion participation, and coach-approved assignments.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ELITE Curriculum Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  Course → Module → Item (Read/Learn/Discuss/Practice/Demo/Survey)│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Completion   │  │    Quiz      │  │  Discussion  │          │
│  │   Engine     │  │   Mastery    │  │ Participation │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Submission  │  │ Enrollment   │  │  Coaching    │          │
│  │   Workflow   │  │   Service    │  │  Integration │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                    ELITE Kernel Services                         │
│          (Context • Policy • Audit • Events)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### Curriculum Structure

| Model | Purpose |
|-------|---------|
| `Course` | Top-level container, linked to ProgramTemplate |
| `CourseModule` | Learning unit with prerequisite support |
| `CourseItem` | Individual learning activity |
| `Enrollment` | Learner enrollment in a course |

### Activity Types

| Type | Description | Completion Rule |
|------|-------------|-----------------|
| `READ` | Content consumption | View |
| `LEARN` | Quiz-based assessment | Score at least X% |
| `DISCUSS` | Peer discussion | Post + Reply requirement |
| `PRACTICE` | Hands-on exercise | Mark done |
| `DEMONSTRATE` | Capstone assignment | Coach approval |
| `SURVEY` | Feedback collection | Submit |

### Progress Tracking

| Model | Purpose |
|-------|---------|
| `ItemProgress` | Per-item completion status |
| `ModuleProgress` | Module-level progress aggregation |
| `LearnerProgress` | Overall course progress |
| `QuizAttempt` | Quiz attempt history and scores |
| `DiscussionProgress` | Discussion participation tracking |

## Services

### CurriculumService

Manages Course, Module, and Item CRUD operations with tenant isolation.

```typescript
import { curriculumService } from "@/lib/elite/services/curriculum";

// List courses
const courses = await curriculumService.listCourses(ctx, { status: "PUBLISHED" });

// Get course with modules and items
const course = await curriculumService.getCourseById(ctx, courseId);

// Create item
const item = await curriculumService.createItem(ctx, {
  moduleId,
  name: "ELITE Principles Quiz",
  itemType: "LEARN",
  completionRule: "SCORE_AT_LEAST",
  completionThreshold: 80,
  sortOrder: 2,
});
```

### CompletionService

Evaluates completion rules and tracks progress.

```typescript
import { completionService } from "@/lib/elite/services/completion";

// Record item viewed
await completionService.recordItemViewed(ctx, itemId, enrollmentId);

// Record quiz completion
await completionService.recordQuizCompletion(ctx, itemId, enrollmentId, score);

// Check if item is complete
const isComplete = await completionService.isItemComplete(ctx, itemId, enrollmentId);

// Get course completion status
const status = await completionService.getCourseCompletionStatus(ctx, enrollmentId);
```

### EnrollmentService

Manages learner enrollments.

```typescript
import { enrollmentService } from "@/lib/elite/services/enrollment";

// Enroll learner
const enrollment = await enrollmentService.enroll(ctx, { userId, courseId, cohortId });

// Bulk enroll
const results = await enrollmentService.bulkEnroll(ctx, { courseId, userIds, cohortId });

// Get learner's enrollments
const enrollments = await enrollmentService.getByUserId(ctx, userId);
```

### QuizService

Handles quiz attempts and mastery tracking.

```typescript
import { quizService } from "@/lib/elite/services/quiz";

// Start quiz attempt
const attempt = await quizService.startAttempt(ctx, { itemId, enrollmentId });

// Submit answers
const result = await quizService.submitAttempt(ctx, attemptId, answers);

// Get mastery status
const mastery = await quizService.getMasteryStatus(ctx, itemId, enrollmentId);
```

### DiscussionService

Manages discussions and participation requirements.

```typescript
import { discussionService } from "@/lib/elite/services/discussion";

// Create post
const post = await discussionService.createPost(ctx, {
  itemId,
  content: "My reflection on the ELITE principles...",
});

// Create reply
const reply = await discussionService.createReply(ctx, {
  postId,
  content: "Great insight! I also noticed...",
});

// Check participation requirement
const met = await discussionService.checkRequirementMet(ctx, itemId, enrollmentId);
```

### SubmissionService

Handles assignment submissions with coach approval workflow.

```typescript
import { submissionService } from "@/lib/elite/services/submission";

// Create submission
const submission = await submissionService.createSubmission(ctx, {
  assignmentId,
  artifactId,
  content: "My notes on this assignment...",
});

// Coach review
await submissionService.reviewSubmission(ctx, submissionId, {
  status: "APPROVED",
  feedback: "Excellent work! Your calendar shows clear priorities.",
});
```

## UI Components

### CourseMap

Visual course navigation with progress indicators.

```tsx
import { CourseMap } from "@/components/elite/course";

<CourseMap
  courseId={courseId}
  enrollmentId={enrollmentId}
  onItemSelect={(itemId) => navigate(`/elite/learn/${itemId}`)}
/>
```

### Content Viewers

```tsx
import { 
  ReadItViewer, 
  QuizPlayer, 
  DiscussionForum, 
  SubmissionWorkflow 
} from "@/components/elite/delivery";

// Read It content
<ReadItViewer 
  itemId={itemId} 
  enrollmentId={enrollmentId}
  onComplete={() => refetchProgress()}
/>

// Quiz player
<QuizPlayer
  itemId={itemId}
  enrollmentId={enrollmentId}
  onComplete={(score) => handleQuizComplete(score)}
/>

// Discussion forum
<DiscussionForum
  itemId={itemId}
  enrollmentId={enrollmentId}
/>

// Demonstrate It submission
<SubmissionWorkflow
  itemId={itemId}
  enrollmentId={enrollmentId}
  onComplete={() => advanceToNext()}
/>
```

### Coach Dashboard

```tsx
import { ReviewQueue } from "@/components/elite/coach";

<ReviewQueue cohortId={cohortId} />
```

## Completion Rules

### VIEW
Item is complete when the learner views it:
- `viewedAt` timestamp is recorded
- Status transitions to `COMPLETED`

### MARK_DONE
Learner explicitly marks the item as done:
- `markedDoneAt` timestamp is recorded
- Status transitions to `COMPLETED`

### SCORE_AT_LEAST
Quiz must achieve minimum score:
- `completionThreshold` defines passing score (e.g., 80%)
- Retakes allowed until mastery
- `bestScore` tracks highest achievement

### SUBMIT
Assignment submission required:
- For `DEMONSTRATE` items: requires coach approval
- Status: `SUBMITTED` → `APPROVED` | `NEEDS_REVISION`
- Resubmissions supported

## Discussion Participation

Discussion items can enforce participation requirements:

```typescript
// DiscussionRequirement model
{
  itemId: string;
  requirePost: boolean;      // Must create original post
  minReplies: number;        // Minimum replies to peers
  minWords: number | null;   // Optional word count
}
```

Participation is tracked in `DiscussionProgress`:
- Posts count
- Replies count  
- Whether requirement is met

## Module 1 Content Structure

ELITE Module 1 demonstrates all activity types:

```
Module 1: Foundations of Effective Leadership
├── 1. Read It: Introduction to ELITE Principles (VIEW)
├── 2. Learn It: ELITE Principles Assessment (SCORE_AT_LEAST 80%)
├── 3. Discuss It: Reflecting on Your Focus (POST + 1 REPLY)
├── 4. Practice It: Priority Matrix Exercise (MARK_DONE)
├── 5. Demonstrate It: Personal Activity Calendar (SUBMIT + APPROVAL)
└── 6. Survey: Module 1 Feedback (SUBMIT)
```

## Events Emitted

All curriculum actions emit events for analytics:

| Event | Trigger |
|-------|---------|
| `LEARNER_ENROLLED` | Enrollment created |
| `ITEM_VIEWED` | Read It viewed |
| `QUIZ_ATTEMPT_STARTED` | Quiz started |
| `QUIZ_ATTEMPT_COMPLETED` | Quiz submitted |
| `QUIZ_MASTERY_ACHIEVED` | Passing score achieved |
| `DISCUSSION_POST_CREATED` | Post created |
| `DISCUSSION_REPLY_CREATED` | Reply created |
| `SUBMISSION_CREATED` | Assignment submitted |
| `SUBMISSION_APPROVED` | Coach approved |
| `ITEM_COMPLETED` | Any item completed |
| `MODULE_COMPLETED` | All items in module complete |
| `COURSE_COMPLETED` | All modules complete |

## Seeding Module 1

Run the seed script to populate Module 1 content:

```bash
npx ts-node prisma/seed-elite-module1.ts
```

This creates:
- Course: "ELITE Leadership Fundamentals"
- Module 1 with all 6 activity types
- Discussion requirements
- Quiz questions and options

## API Endpoints

### Curriculum

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/elite/courses` | List courses |
| GET | `/api/elite/courses/[id]` | Get course with modules |
| POST | `/api/elite/courses` | Create course |
| GET | `/api/elite/modules/[id]` | Get module with items |
| GET | `/api/elite/items/[id]` | Get item details |

### Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/elite/enrollments` | Get user enrollments |
| POST | `/api/elite/enrollments` | Enroll in course |
| GET | `/api/elite/progress/[enrollmentId]` | Get progress |
| POST | `/api/elite/items/[id]/view` | Mark item viewed |
| POST | `/api/elite/items/[id]/complete` | Mark item done |

### Quizzes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/elite/items/[id]/quiz` | Get quiz questions |
| POST | `/api/elite/quiz/attempts` | Start attempt |
| POST | `/api/elite/quiz/attempts/[id]/submit` | Submit answers |

### Discussions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/elite/items/[id]/posts` | Get discussion posts |
| POST | `/api/elite/posts` | Create post |
| POST | `/api/elite/posts/[id]/replies` | Create reply |

### Submissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/elite/submissions` | Create submission |
| GET | `/api/elite/submissions/review-queue` | Coach review queue |
| POST | `/api/elite/submissions/[id]/review` | Review submission |

## Permissions

| Permission | Roles |
|------------|-------|
| `VIEW_CURRICULUM` | All ELITE roles |
| `MANAGE_CURRICULUM` | PROGRAM_ADMIN |
| `TAKE_QUIZZES` | LEARNER, INSTRUCTOR |
| `VIEW_QUIZ_ATTEMPTS` | COACH, INSTRUCTOR, PROGRAM_ADMIN |
| `PARTICIPATE_DISCUSSIONS` | LEARNER, COACH, INSTRUCTOR |
| `MANAGE_DISCUSSIONS` | INSTRUCTOR, PROGRAM_ADMIN |
| `VIEW_LEARNER_PROGRESS` | COACH, INSTRUCTOR, PROGRAM_ADMIN |

## Engagement Anchoring

Coaching notes, tasks, and artifacts can be linked to curriculum context:

```typescript
// CoachingNote with curriculum anchor
await prisma.coachingNote.create({
  data: {
    clientId,
    cohortId,
    learnerId,
    coachId,
    content: "Great progress on the quiz!",
    itemId: quizItemId,        // Linked to specific item
    submissionId: null,        // Or link to submission
    noteType: "OBSERVATION",
  },
});

// Task linked to curriculum
await prisma.task.create({
  data: {
    clientId,
    assigneeId: learnerId,
    createdById: coachId,
    title: "Complete priority matrix",
    itemId: practiceItemId,
    taskSource: "COACH",
    requiredForCompletion: true,
  },
});
```

## Best Practices

1. **Always use services** - Never query Prisma directly; use services for tenant isolation
2. **Check permissions** - Services use `policy.requirePermission()` for authorization
3. **Emit events** - All state changes emit events for analytics pipeline
4. **Validate completion** - Use `completionService.isItemComplete()` before advancing
5. **Track attempts** - Store all quiz attempts for analytics and review
6. **Support retakes** - Design quizzes to allow mastery through retakes

