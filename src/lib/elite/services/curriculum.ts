/**
 * ELITE Curriculum Service
 *
 * Manages Course, Module, and Item CRUD operations with tenant isolation.
 * This is the "spine" of the LMS delivery engine.
 */

import { prisma } from "@/lib/prisma";
import type { EliteContext } from "../kernel/types";
import { ElitePolicy } from "../kernel/policy";
import { EliteAudit } from "../kernel/audit";
import { EliteEventBus } from "../kernel/events";
import type {
  Course,
  CourseModule,
  CourseItem,
  Prisma,
} from "@prisma/client";

// ============================================
// Types
// ============================================

export type ItemType = "READ" | "LEARN" | "DISCUSS" | "PRACTICE" | "DEMONSTRATE" | "SURVEY";
export type CompletionRule = "VIEW" | "MARK_DONE" | "SUBMIT" | "SCORE_AT_LEAST";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CreateCourseInput {
  name: string;
  description?: string;
  templateId?: string;
  status?: CourseStatus;
}

export interface UpdateCourseInput {
  name?: string;
  description?: string;
  status?: CourseStatus;
}

export interface CreateModuleInput {
  courseId: string;
  name: string;
  description?: string;
  sortOrder: number;
  prerequisiteModuleId?: string;
}

export interface UpdateModuleInput {
  name?: string;
  description?: string;
  sortOrder?: number;
  prerequisiteModuleId?: string | null;
}

export interface CreateItemInput {
  moduleId: string;
  name: string;
  description?: string;
  itemType: ItemType;
  completionRule: CompletionRule;
  completionThreshold?: number;
  content?: string; // JSON string
  sortOrder: number;
  suggestedDaysOffset?: number;
  competencyTags?: string[]; // Array of tags
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  itemType?: ItemType;
  completionRule?: CompletionRule;
  completionThreshold?: number;
  content?: string;
  sortOrder?: number;
  suggestedDaysOffset?: number;
  competencyTags?: string[];
}

export interface CourseWithModules extends Course {
  modules: (CourseModule & {
    items: CourseItem[];
  })[];
}

export interface ModuleWithItems extends CourseModule {
  items: CourseItem[];
}

// ============================================
// Course Operations
// ============================================

/**
 * List all courses for the tenant
 */
export async function listCourses(
  ctx: EliteContext,
  filters?: { status?: CourseStatus; templateId?: string }
): Promise<Course[]> {
  const policy = new ElitePolicy(ctx);

  const where: Prisma.CourseWhereInput = {
    ...policy.tenantWhere(),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.templateId && { templateId: filters.templateId }),
  };

  return prisma.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get a course by ID with all modules and items
 */
export async function getCourseById(
  ctx: EliteContext,
  courseId: string
): Promise<CourseWithModules | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.course.findFirst({
    where: {
      id: courseId,
      ...policy.tenantWhere(),
    },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

/**
 * Create a new course
 */
export async function createCourse(
  ctx: EliteContext,
  data: CreateCourseInput
): Promise<Course> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);
  const events = new EliteEventBus(ctx);

  const course = await prisma.course.create({
    data: {
      clientId: ctx.tenantId,
      name: data.name,
      description: data.description,
      templateId: data.templateId,
      status: data.status || "DRAFT",
    },
  });

  await audit.log("COURSE_CREATED", { type: "Course", id: course.id }, { name: course.name });
  await events.emit({
    eventType: "COURSE_CREATED",
    entityType: "Course",
    entityId: course.id,
    data: { name: course.name },
  });

  return course;
}

/**
 * Update a course
 */
export async function updateCourse(
  ctx: EliteContext,
  courseId: string,
  data: UpdateCourseInput
): Promise<Course> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);

  const existing = await prisma.course.findFirst({
    where: {
      id: courseId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Course not found");
  }

  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  await audit.log("COURSE_UPDATED", { type: "Course", id: course.id }, { previous: existing, current: course });

  return course;
}

/**
 * Delete a course (and all related modules/items)
 */
export async function deleteCourse(
  ctx: EliteContext,
  courseId: string
): Promise<void> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);

  const existing = await prisma.course.findFirst({
    where: {
      id: courseId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Course not found");
  }

  // Delete in cascade order: items -> modules -> course
  await prisma.$transaction(async (tx) => {
    // Get all modules
    const modules = await tx.courseModule.findMany({
      where: { courseId },
      select: { id: true },
    });

    const moduleIds = modules.map((m) => m.id);

    // Delete items
    await tx.courseItem.deleteMany({
      where: { moduleId: { in: moduleIds } },
    });

    // Delete modules
    await tx.courseModule.deleteMany({
      where: { courseId },
    });

    // Delete course
    await tx.course.delete({
      where: { id: courseId },
    });
  });

  await audit.log("COURSE_DELETED", { type: "Course", id: courseId }, { previous: existing });
}

// ============================================
// Module Operations
// ============================================

/**
 * List modules for a course
 */
export async function listModules(
  ctx: EliteContext,
  courseId: string
): Promise<ModuleWithItems[]> {
  const policy = new ElitePolicy(ctx);

  // Verify course access
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      ...policy.tenantWhere(),
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  return prisma.courseModule.findMany({
    where: {
      courseId,
      ...policy.tenantWhere(),
    },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

/**
 * Get a module by ID
 */
export async function getModuleById(
  ctx: EliteContext,
  moduleId: string
): Promise<ModuleWithItems | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.courseModule.findFirst({
    where: {
      id: moduleId,
      ...policy.tenantWhere(),
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

/**
 * Create a new module
 */
export async function createModule(
  ctx: EliteContext,
  data: CreateModuleInput
): Promise<CourseModule> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);
  const events = new EliteEventBus(ctx);

  // Verify course access
  const course = await prisma.course.findFirst({
    where: {
      id: data.courseId,
      ...policy.tenantWhere(),
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const courseModule = await prisma.courseModule.create({
    data: {
      clientId: ctx.tenantId,
      courseId: data.courseId,
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder,
      prerequisiteModuleId: data.prerequisiteModuleId,
    },
  });

  await audit.log("MODULE_CREATED", { type: "CourseModule", id: courseModule.id }, { name: courseModule.name, courseId: courseModule.courseId });
  await events.emit({
    eventType: "MODULE_CREATED",
    entityType: "CourseModule",
    entityId: courseModule.id,
    data: { name: courseModule.name, courseId: courseModule.courseId },
  });

  return courseModule;
}

/**
 * Update a module
 */
export async function updateModule(
  ctx: EliteContext,
  moduleId: string,
  data: UpdateModuleInput
): Promise<CourseModule> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);

  const existing = await prisma.courseModule.findFirst({
    where: {
      id: moduleId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Module not found");
  }

  const courseModule = await prisma.courseModule.update({
    where: { id: moduleId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.prerequisiteModuleId !== undefined && {
        prerequisiteModuleId: data.prerequisiteModuleId,
      }),
    },
  });

  await audit.log("MODULE_UPDATED", { type: "CourseModule", id: courseModule.id }, { previous: existing, current: courseModule });

  return courseModule;
}

/**
 * Delete a module (and all related items)
 */
export async function deleteModule(
  ctx: EliteContext,
  moduleId: string
): Promise<void> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);

  const existing = await prisma.courseModule.findFirst({
    where: {
      id: moduleId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Module not found");
  }

  await prisma.$transaction(async (tx) => {
    // Delete items first
    await tx.courseItem.deleteMany({
      where: { moduleId },
    });

    // Delete module
    await tx.courseModule.delete({
      where: { id: moduleId },
    });
  });

  await audit.log("MODULE_DELETED", { type: "CourseModule", id: moduleId }, { previous: existing });
}

// ============================================
// Item Operations
// ============================================

/**
 * List items for a module
 */
export async function listItems(
  ctx: EliteContext,
  moduleId: string
): Promise<CourseItem[]> {
  const policy = new ElitePolicy(ctx);

  // Verify module access
  const courseModule = await prisma.courseModule.findFirst({
    where: {
      id: moduleId,
      ...policy.tenantWhere(),
    },
  });

  if (!courseModule) {
    throw new Error("Module not found");
  }

  return prisma.courseItem.findMany({
    where: {
      moduleId,
      ...policy.tenantWhere(),
    },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Get an item by ID
 */
export async function getItemById(
  ctx: EliteContext,
  itemId: string
): Promise<CourseItem | null> {
  const policy = new ElitePolicy(ctx);

  return prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });
}

/**
 * Create a new item
 */
export async function createItem(
  ctx: EliteContext,
  data: CreateItemInput
): Promise<CourseItem> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);
  const events = new EliteEventBus(ctx);

  // Verify module access
  const courseModule = await prisma.courseModule.findFirst({
    where: {
      id: data.moduleId,
      ...policy.tenantWhere(),
    },
  });

  if (!courseModule) {
    throw new Error("Module not found");
  }

  const item = await prisma.courseItem.create({
    data: {
      clientId: ctx.tenantId,
      moduleId: data.moduleId,
      name: data.name,
      description: data.description,
      itemType: data.itemType,
      completionRule: data.completionRule,
      completionThreshold: data.completionThreshold,
      content: data.content,
      sortOrder: data.sortOrder,
      suggestedDaysOffset: data.suggestedDaysOffset,
      competencyTags: data.competencyTags
        ? JSON.stringify(data.competencyTags)
        : null,
    },
  });

  await audit.log("ITEM_CREATED", { type: "CourseItem", id: item.id }, { name: item.name, moduleId: item.moduleId });
  await events.emit({
    eventType: "ITEM_CREATED",
    entityType: "CourseItem",
    entityId: item.id,
    data: {
      name: item.name,
      itemType: item.itemType,
      moduleId: item.moduleId,
    },
  });

  return item;
}

/**
 * Update an item
 */
export async function updateItem(
  ctx: EliteContext,
  itemId: string,
  data: UpdateItemInput
): Promise<CourseItem> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);

  const existing = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Item not found");
  }

  const item = await prisma.courseItem.update({
    where: { id: itemId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.itemType !== undefined && { itemType: data.itemType }),
      ...(data.completionRule !== undefined && {
        completionRule: data.completionRule,
      }),
      ...(data.completionThreshold !== undefined && {
        completionThreshold: data.completionThreshold,
      }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.suggestedDaysOffset !== undefined && {
        suggestedDaysOffset: data.suggestedDaysOffset,
      }),
      ...(data.competencyTags !== undefined && {
        competencyTags: JSON.stringify(data.competencyTags),
      }),
    },
  });

  await audit.log("ITEM_UPDATED", { type: "CourseItem", id: item.id }, { previous: existing, current: item });

  return item;
}

/**
 * Delete an item
 */
export async function deleteItem(
  ctx: EliteContext,
  itemId: string
): Promise<void> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);

  const existing = await prisma.courseItem.findFirst({
    where: {
      id: itemId,
      ...policy.tenantWhere(),
    },
  });

  if (!existing) {
    throw new Error("Item not found");
  }

  await prisma.courseItem.delete({
    where: { id: itemId },
  });

  await audit.log("ITEM_DELETED", { type: "CourseItem", id: itemId }, { previous: existing });
}

// ============================================
// Bulk Operations (for seeding/import)
// ============================================

/**
 * Create a complete course with modules and items in a single transaction
 */
export async function createCourseWithContent(
  ctx: EliteContext,
  courseData: CreateCourseInput,
  modules: {
    module: Omit<CreateModuleInput, "courseId">;
    items: Omit<CreateItemInput, "moduleId">[];
  }[]
): Promise<CourseWithModules> {
  const policy = new ElitePolicy(ctx);
  policy.requirePermission("MANAGE_CURRICULUM");

  const audit = new EliteAudit(ctx);
  const events = new EliteEventBus(ctx);

  const course = await prisma.$transaction(async (tx) => {
    // Create course
    const newCourse = await tx.course.create({
      data: {
        clientId: ctx.tenantId,
        name: courseData.name,
        description: courseData.description,
        templateId: courseData.templateId,
        status: courseData.status || "DRAFT",
      },
    });

    // Create modules and items
    for (const moduleData of modules) {
      const newModule = await tx.courseModule.create({
        data: {
          clientId: ctx.tenantId,
          courseId: newCourse.id,
          name: moduleData.module.name,
          description: moduleData.module.description,
          sortOrder: moduleData.module.sortOrder,
          prerequisiteModuleId: moduleData.module.prerequisiteModuleId,
        },
      });

      // Create items for this module
      for (const itemData of moduleData.items) {
        await tx.courseItem.create({
          data: {
            clientId: ctx.tenantId,
            moduleId: newModule.id,
            name: itemData.name,
            description: itemData.description,
            itemType: itemData.itemType,
            completionRule: itemData.completionRule,
            completionThreshold: itemData.completionThreshold,
            content: itemData.content,
            sortOrder: itemData.sortOrder,
            suggestedDaysOffset: itemData.suggestedDaysOffset,
            competencyTags: itemData.competencyTags
              ? JSON.stringify(itemData.competencyTags)
              : null,
          },
        });
      }
    }

    // Return the complete course
    return tx.course.findUnique({
      where: { id: newCourse.id },
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
  });

  if (!course) {
    throw new Error("Failed to create course");
  }

  await audit.log("COURSE_CREATED", { type: "Course", id: course.id }, {
    name: course.name,
    moduleCount: course.modules.length,
    itemCount: course.modules.reduce((acc, m) => acc + m.items.length, 0),
  });

  await events.emit({
    eventType: "COURSE_CREATED",
    entityType: "Course",
    entityId: course.id,
    data: {
      name: course.name,
      moduleCount: course.modules.length,
    },
  });

  return course;
}

// Export as a service object for consistency
export const curriculumService = {
  // Courses
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,

  // Modules
  listModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,

  // Items
  listItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,

  // Bulk
  createCourseWithContent,
};

