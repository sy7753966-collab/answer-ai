import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type MarkingPoint = {
  description: string;
  marks: number;
  keywords: string[];
  alternatives: string[];
};

export type ConceptGroup = {
  name: string;
  alternatives: string[];
};

export type PointResult = {
  description: string;
  marks: number;
  awarded: number;
  matched: boolean;
  feedback: string;
};

export const questionsTable = pgTable("grader_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  subject: text("subject").notNull(),
  marks: integer("marks").notNull(),
  difficulty: text("difficulty").notNull(),
  questionType: text("question_type").notNull(),
  timeAllowed: integer("time_allowed").notNull(),
  referenceAnswer: text("reference_answer").notNull(),
  markingScheme: jsonb("marking_scheme").$type<MarkingPoint[]>().notNull(),
  concepts: jsonb("concepts").$type<ConceptGroup[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const answersTable = pgTable("grader_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questionsTable.id, { onDelete: "cascade" }),
  studentName: text("student_name").notNull(),
  answerText: text("answer_text").notNull(),
  wordCount: integer("word_count").notNull(),
  aiScore: integer("ai_score").notNull(),
  teacherScore: integer("teacher_score"),
  keywordCoverage: real("keyword_coverage").notNull(),
  conceptCoverage: real("concept_coverage").notNull(),
  relevance: real("relevance").notNull(),
  accuracy: real("accuracy").notNull(),
  explanationQuality: real("explanation_quality").notNull(),
  pointResults: jsonb("point_results").$type<PointResult[]>().notNull(),
  missingConcepts: jsonb("missing_concepts").$type<string[]>().notNull(),
  matchedConcepts: jsonb("matched_concepts").$type<string[]>().notNull(),
  incorrectStatements: jsonb("incorrect_statements")
    .$type<string[]>()
    .notNull(),
  feedback: text("feedback").notNull(),
  benchmark: boolean("benchmark").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const graderMetaTable = pgTable("grader_meta", {
  key: text("key").primaryKey(),
  version: integer("version").notNull(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({
  id: true,
  createdAt: true,
});
export const insertAnswerSchema = createInsertSchema(answersTable).omit({
  id: true,
  createdAt: true,
});

export type Question = typeof questionsTable.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Answer = typeof answersTable.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
