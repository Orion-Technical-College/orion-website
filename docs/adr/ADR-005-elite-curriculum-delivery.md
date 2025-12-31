# ADR-005: ELITE Curriculum Delivery Architecture

## Status

Accepted

## Context

ELITE is a packaged leadership training program that requires LMS-like capabilities within the EMC Workspace platform. The program follows a structured curriculum with multiple activity types (Read It, Learn It, Discuss It, Practice It, Demonstrate It, Survey) and requires:

- Course/Module/Item hierarchy
- Multiple completion rule types
- Quiz mastery with retakes
- Discussion participation enforcement
- Coach-approved assignments
- Progress tracking at item, module, and course levels

The initial Phase 2 plan treated engagement features (coaching notes, artifacts, tasks) as standalone utilities. This needed to be reframed as curriculum-anchored features to support proper LMS delivery.

## Decision

### 1. Curriculum Spine Model

Adopt a `Course → Module → Item` hierarchy where:
- **Course** is the top-level container, linked to ProgramTemplate
- **Module** represents a learning unit (e.g., "Module 1: Foundations")
- **Item** is an individual activity with a specific type and completion rule

### 2. Completion Rule Engine

Each item has a `completionRule` that determines how completion is evaluated:

| Rule | Evaluation |
|------|------------|
| `VIEW` | Item viewed (timestamp recorded) |
| `MARK_DONE` | Learner marks complete |
| `SCORE_AT_LEAST` | Quiz score ≥ threshold |
| `SUBMIT` | Assignment submitted (optionally with coach approval) |

### 3. Vertical Slice Approach

Build Module 1 end-to-end first, then generalize. This validates:
- All activity types work together
- Completion rules enforce correctly
- Coach approval gates function
- Progress tracking aggregates properly

### 4. Service-First Architecture

All curriculum operations go through services:
- `CurriculumService` - CRUD with tenant isolation
- `CompletionService` - Progress evaluation
- `EnrollmentService` - Enrollment management
- `QuizService` - Quiz mechanics
- `DiscussionService` - Participation tracking
- `SubmissionService` - Approval workflow

Services enforce:
- Tenant isolation via `policy.tenantWhere()`
- Permission checks via `policy.requirePermission()`
- Event emission for analytics
- Audit logging

### 5. Engagement Anchoring

Coaching notes, tasks, and artifacts are linked to curriculum context:
- `itemId` - Links to specific curriculum item
- `submissionId` - Links to specific submission (for feedback)

This enables:
- Contextual coaching notes
- Auto-generated tasks from incomplete items
- Artifact tracking per assignment

### 6. Event-Driven Analytics

All curriculum events are emitted to `EliteEvent` table:
- Dual timestamps (`eventTs` for source, `ingestedAt` for storage)
- Schema versioning for evolution
- Entity linking for correlation

## Consequences

### Positive

- **LMS Alignment**: Activities feel like a proper learning experience, not utilities
- **Completion Clarity**: Rules are explicit and enforced by system
- **Coach Visibility**: Clear review queue and at-risk identification
- **Analytics Ready**: Events support downstream reporting
- **Generalizable**: Module 1 patterns extend to Modules 2-5

### Negative

- **Initial Complexity**: More models and services to maintain
- **Quiz Modeling**: Questions stored as JSON, limited queryability
- **Discussion Coupling**: Participation tied to items, not freeform

### Neutral

- **Content Authoring**: Not built yet; content seeded via scripts
- **Rubric Scoring**: Schema supports rubrics but UI not implemented

## Alternatives Considered

### A. Full Foundation First
Build all LMS infrastructure before any content. Rejected because:
- Delays validation of ELITE-specific requirements
- Risk of "technically beautiful, instructionally wrong"

### B. MVP Single Activity Type
Build only Demonstrate It first. Rejected because:
- ELITE isn't one interaction pattern; it's a deliberate practice loop
- Would force rework when adding other types

### C. External LMS Integration
Use existing LMS (Canvas, Moodle) instead. Rejected because:
- Integration complexity with platform identity
- Loss of unified coaching experience
- Data isolation concerns

## References

- PRD-ELITE document
- Module 1 content specification
- ELITE pedagogy framework (Focus, Design, Assessment)

