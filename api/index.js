// Auto-generated Vercel serverless function entrypoint
import { createRequire as __crReq } from 'module';
const require = __crReq(import.meta.url);

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/app.ts
import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";

// server/routes/index.ts
import { Router as Router3 } from "express";

// server/routes/health.ts
import { Router } from "express";

// lib/api-zod/src/generated/api.ts
import * as zod from "zod";
var HealthCheckResponse = zod.object({
  "status": zod.string()
});
var ListQuestionsResponseItem = zod.object({
  "question": zod.string().min(1),
  "subject": zod.string().min(1),
  "marks": zod.number().int().min(1),
  "difficulty": zod.string(),
  "questionType": zod.string(),
  "timeAllowed": zod.number().int().min(1),
  "referenceAnswer": zod.string(),
  "markingScheme": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int().min(1),
    "keywords": zod.array(zod.string()),
    "alternatives": zod.array(zod.string())
  })),
  "concepts": zod.array(zod.object({
    "name": zod.string(),
    "alternatives": zod.array(zod.string())
  }))
}).and(zod.object({
  "id": zod.number().int(),
  "attempts": zod.number().int(),
  "averageScore": zod.number()
}));
var ListQuestionsResponse = zod.array(ListQuestionsResponseItem);
var CreateQuestionBody = zod.object({
  "question": zod.string().min(1),
  "subject": zod.string().min(1),
  "marks": zod.number().int().min(1),
  "difficulty": zod.string(),
  "questionType": zod.string(),
  "timeAllowed": zod.number().int().min(1),
  "referenceAnswer": zod.string(),
  "markingScheme": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int().min(1),
    "keywords": zod.array(zod.string()),
    "alternatives": zod.array(zod.string())
  })),
  "concepts": zod.array(zod.object({
    "name": zod.string(),
    "alternatives": zod.array(zod.string())
  }))
});
var CreateQuestionResponse = zod.object({
  "question": zod.string().min(1),
  "subject": zod.string().min(1),
  "marks": zod.number().int().min(1),
  "difficulty": zod.string(),
  "questionType": zod.string(),
  "timeAllowed": zod.number().int().min(1),
  "referenceAnswer": zod.string(),
  "markingScheme": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int().min(1),
    "keywords": zod.array(zod.string()),
    "alternatives": zod.array(zod.string())
  })),
  "concepts": zod.array(zod.object({
    "name": zod.string(),
    "alternatives": zod.array(zod.string())
  }))
}).and(zod.object({
  "id": zod.number().int(),
  "attempts": zod.number().int(),
  "averageScore": zod.number()
}));
var GetQuestionParams = zod.object({
  "id": zod.coerce.number().int()
});
var GetQuestionResponse = zod.object({
  "question": zod.string().min(1),
  "subject": zod.string().min(1),
  "marks": zod.number().int().min(1),
  "difficulty": zod.string(),
  "questionType": zod.string(),
  "timeAllowed": zod.number().int().min(1),
  "referenceAnswer": zod.string(),
  "markingScheme": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int().min(1),
    "keywords": zod.array(zod.string()),
    "alternatives": zod.array(zod.string())
  })),
  "concepts": zod.array(zod.object({
    "name": zod.string(),
    "alternatives": zod.array(zod.string())
  }))
}).and(zod.object({
  "id": zod.number().int(),
  "attempts": zod.number().int(),
  "averageScore": zod.number()
}));
var UpdateQuestionParams = zod.object({
  "id": zod.coerce.number().int()
});
var UpdateQuestionBody = zod.object({
  "question": zod.string().min(1),
  "subject": zod.string().min(1),
  "marks": zod.number().int().min(1),
  "difficulty": zod.string(),
  "questionType": zod.string(),
  "timeAllowed": zod.number().int().min(1),
  "referenceAnswer": zod.string(),
  "markingScheme": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int().min(1),
    "keywords": zod.array(zod.string()),
    "alternatives": zod.array(zod.string())
  })),
  "concepts": zod.array(zod.object({
    "name": zod.string(),
    "alternatives": zod.array(zod.string())
  }))
});
var UpdateQuestionResponse = zod.object({
  "question": zod.string().min(1),
  "subject": zod.string().min(1),
  "marks": zod.number().int().min(1),
  "difficulty": zod.string(),
  "questionType": zod.string(),
  "timeAllowed": zod.number().int().min(1),
  "referenceAnswer": zod.string(),
  "markingScheme": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int().min(1),
    "keywords": zod.array(zod.string()),
    "alternatives": zod.array(zod.string())
  })),
  "concepts": zod.array(zod.object({
    "name": zod.string(),
    "alternatives": zod.array(zod.string())
  }))
}).and(zod.object({
  "id": zod.number().int(),
  "attempts": zod.number().int(),
  "averageScore": zod.number()
}));
var DeleteQuestionParams = zod.object({
  "id": zod.coerce.number().int()
});
var DeleteQuestionResponse = zod.void();
var ListAnswersQueryParams = zod.object({
  "questionId": zod.coerce.number().int().optional()
});
var ListAnswersResponseItem = zod.object({
  "id": zod.number().int(),
  "questionId": zod.number().int(),
  "studentName": zod.string(),
  "answerText": zod.string(),
  "wordCount": zod.number().int(),
  "aiScore": zod.number().int(),
  "teacherScore": zod.number().int().nullable(),
  "scoreGap": zod.number().int().nullable(),
  "absoluteGap": zod.number().int().nullable(),
  "keywordCoverage": zod.number(),
  "conceptCoverage": zod.number(),
  "relevance": zod.number(),
  "accuracy": zod.number(),
  "explanationQuality": zod.number(),
  "pointResults": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int(),
    "awarded": zod.number().int(),
    "matched": zod.boolean(),
    "feedback": zod.string()
  })),
  "missingConcepts": zod.array(zod.string()),
  "matchedConcepts": zod.array(zod.string()),
  "incorrectStatements": zod.array(zod.string()),
  "feedback": zod.string(),
  "benchmark": zod.boolean(),
  "createdAt": zod.coerce.date()
});
var ListAnswersResponse = zod.array(ListAnswersResponseItem);
var CreateAnswerBody = zod.object({
  "questionId": zod.number().int(),
  "studentName": zod.string().min(1),
  "answerText": zod.string().min(1)
});
var CreateAnswerResponse = zod.object({
  "id": zod.number().int(),
  "questionId": zod.number().int(),
  "studentName": zod.string(),
  "answerText": zod.string(),
  "wordCount": zod.number().int(),
  "aiScore": zod.number().int(),
  "teacherScore": zod.number().int().nullable(),
  "scoreGap": zod.number().int().nullable(),
  "absoluteGap": zod.number().int().nullable(),
  "keywordCoverage": zod.number(),
  "conceptCoverage": zod.number(),
  "relevance": zod.number(),
  "accuracy": zod.number(),
  "explanationQuality": zod.number(),
  "pointResults": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int(),
    "awarded": zod.number().int(),
    "matched": zod.boolean(),
    "feedback": zod.string()
  })),
  "missingConcepts": zod.array(zod.string()),
  "matchedConcepts": zod.array(zod.string()),
  "incorrectStatements": zod.array(zod.string()),
  "feedback": zod.string(),
  "benchmark": zod.boolean(),
  "createdAt": zod.coerce.date()
});
var GetAnswerParams = zod.object({
  "id": zod.coerce.number().int()
});
var GetAnswerResponse = zod.object({
  "id": zod.number().int(),
  "questionId": zod.number().int(),
  "studentName": zod.string(),
  "answerText": zod.string(),
  "wordCount": zod.number().int(),
  "aiScore": zod.number().int(),
  "teacherScore": zod.number().int().nullable(),
  "scoreGap": zod.number().int().nullable(),
  "absoluteGap": zod.number().int().nullable(),
  "keywordCoverage": zod.number(),
  "conceptCoverage": zod.number(),
  "relevance": zod.number(),
  "accuracy": zod.number(),
  "explanationQuality": zod.number(),
  "pointResults": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int(),
    "awarded": zod.number().int(),
    "matched": zod.boolean(),
    "feedback": zod.string()
  })),
  "missingConcepts": zod.array(zod.string()),
  "matchedConcepts": zod.array(zod.string()),
  "incorrectStatements": zod.array(zod.string()),
  "feedback": zod.string(),
  "benchmark": zod.boolean(),
  "createdAt": zod.coerce.date()
});
var UpdateTeacherScoreParams = zod.object({
  "id": zod.coerce.number().int()
});
var updateTeacherScoreBodyTeacherScoreMin = 0;
var UpdateTeacherScoreBody = zod.object({
  "teacherScore": zod.number().int().min(updateTeacherScoreBodyTeacherScoreMin)
});
var UpdateTeacherScoreResponse = zod.object({
  "id": zod.number().int(),
  "questionId": zod.number().int(),
  "studentName": zod.string(),
  "answerText": zod.string(),
  "wordCount": zod.number().int(),
  "aiScore": zod.number().int(),
  "teacherScore": zod.number().int().nullable(),
  "scoreGap": zod.number().int().nullable(),
  "absoluteGap": zod.number().int().nullable(),
  "keywordCoverage": zod.number(),
  "conceptCoverage": zod.number(),
  "relevance": zod.number(),
  "accuracy": zod.number(),
  "explanationQuality": zod.number(),
  "pointResults": zod.array(zod.object({
    "description": zod.string(),
    "marks": zod.number().int(),
    "awarded": zod.number().int(),
    "matched": zod.boolean(),
    "feedback": zod.string()
  })),
  "missingConcepts": zod.array(zod.string()),
  "matchedConcepts": zod.array(zod.string()),
  "incorrectStatements": zod.array(zod.string()),
  "feedback": zod.string(),
  "benchmark": zod.boolean(),
  "createdAt": zod.coerce.date()
});
var GetDashboardResponse = zod.object({
  "totalQuestions": zod.number().int(),
  "attemptedQuestions": zod.number().int(),
  "totalAnswers": zod.number().int(),
  "averageAiScore": zod.number(),
  "averageTeacherScore": zod.number(),
  "averageGap": zod.number(),
  "agreementPercent": zod.number(),
  "keywordCoverage": zod.number(),
  "conceptCoverage": zod.number(),
  "recentAnswers": zod.array(zod.object({
    "id": zod.number().int(),
    "questionId": zod.number().int(),
    "studentName": zod.string(),
    "answerText": zod.string(),
    "wordCount": zod.number().int(),
    "aiScore": zod.number().int(),
    "teacherScore": zod.number().int().nullable(),
    "scoreGap": zod.number().int().nullable(),
    "absoluteGap": zod.number().int().nullable(),
    "keywordCoverage": zod.number(),
    "conceptCoverage": zod.number(),
    "relevance": zod.number(),
    "accuracy": zod.number(),
    "explanationQuality": zod.number(),
    "pointResults": zod.array(zod.object({
      "description": zod.string(),
      "marks": zod.number().int(),
      "awarded": zod.number().int(),
      "matched": zod.boolean(),
      "feedback": zod.string()
    })),
    "missingConcepts": zod.array(zod.string()),
    "matchedConcepts": zod.array(zod.string()),
    "incorrectStatements": zod.array(zod.string()),
    "feedback": zod.string(),
    "benchmark": zod.boolean(),
    "createdAt": zod.coerce.date()
  }))
});
var GetFairnessAnalyticsResponse = zod.object({
  "answers": zod.array(zod.object({
    "id": zod.number().int(),
    "questionId": zod.number().int(),
    "studentName": zod.string(),
    "answerText": zod.string(),
    "wordCount": zod.number().int(),
    "aiScore": zod.number().int(),
    "teacherScore": zod.number().int().nullable(),
    "scoreGap": zod.number().int().nullable(),
    "absoluteGap": zod.number().int().nullable(),
    "keywordCoverage": zod.number(),
    "conceptCoverage": zod.number(),
    "relevance": zod.number(),
    "accuracy": zod.number(),
    "explanationQuality": zod.number(),
    "pointResults": zod.array(zod.object({
      "description": zod.string(),
      "marks": zod.number().int(),
      "awarded": zod.number().int(),
      "matched": zod.boolean(),
      "feedback": zod.string()
    })),
    "missingConcepts": zod.array(zod.string()),
    "matchedConcepts": zod.array(zod.string()),
    "incorrectStatements": zod.array(zod.string()),
    "feedback": zod.string(),
    "benchmark": zod.boolean(),
    "createdAt": zod.coerce.date()
  })),
  "meanAbsoluteError": zod.number(),
  "agreementRate": zod.number(),
  "overestimationRate": zod.number(),
  "underestimationRate": zod.number(),
  "aiTeacherCorrelation": zod.number(),
  "wordAiCorrelation": zod.number(),
  "wordTeacherCorrelation": zod.number(),
  "detectedBiases": zod.array(zod.string()),
  "conclusion": zod.string()
});

// server/routes/health.ts
var router = Router();
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});
var health_default = router;

// server/routes/grader.ts
import { Router as Router2 } from "express";
import { and, asc, desc, eq as eq2 } from "drizzle-orm";

// lib/db/src/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// lib/db/src/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  answersTable: () => answersTable,
  graderMetaTable: () => graderMetaTable,
  insertAnswerSchema: () => insertAnswerSchema,
  insertQuestionSchema: () => insertQuestionSchema,
  questionsTable: () => questionsTable
});

// lib/db/src/schema/answer-grader.ts
import { createInsertSchema } from "drizzle-zod";
import {
  boolean as boolean2,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp
} from "drizzle-orm/pg-core";
var questionsTable = pgTable("grader_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  subject: text("subject").notNull(),
  marks: integer("marks").notNull(),
  difficulty: text("difficulty").notNull(),
  questionType: text("question_type").notNull(),
  timeAllowed: integer("time_allowed").notNull(),
  referenceAnswer: text("reference_answer").notNull(),
  markingScheme: jsonb("marking_scheme").$type().notNull(),
  concepts: jsonb("concepts").$type().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var answersTable = pgTable("grader_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
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
  pointResults: jsonb("point_results").$type().notNull(),
  missingConcepts: jsonb("missing_concepts").$type().notNull(),
  matchedConcepts: jsonb("matched_concepts").$type().notNull(),
  incorrectStatements: jsonb("incorrect_statements").$type().notNull(),
  feedback: text("feedback").notNull(),
  benchmark: boolean2("benchmark").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var graderMetaTable = pgTable("grader_meta", {
  key: text("key").primaryKey(),
  version: integer("version").notNull()
});
var insertQuestionSchema = createInsertSchema(questionsTable).omit({
  id: true,
  createdAt: true
});
var insertAnswerSchema = createInsertSchema(answersTable).omit({
  id: true,
  createdAt: true
});

// lib/db/src/index.ts
var { Pool } = pg;
var hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
var poolInstance = null;
var dbInstance = null;
if (hasDatabaseUrl && process.env.DATABASE_URL) {
  try {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
    });
    dbInstance = drizzle(poolInstance, { schema: schema_exports });
  } catch (err) {
    console.warn("Failed to initialize PostgreSQL pool:", err);
  }
}
var db = dbInstance;

// server/lib/demo-data.ts
import { eq } from "drizzle-orm";

// server/lib/grader.ts
function normalize(text2) {
  return text2.toLocaleLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function containsPhrase(answer, phrase) {
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  return ` ${normalize(answer)} `.includes(` ${normalizedPhrase} `);
}
function isNegated(answer, terms) {
  const normalizedAnswer = normalize(answer);
  const negations = [
    "does not",
    "doesnt",
    "never",
    "cannot",
    "cant",
    "is not",
    "isnt",
    "no longer"
  ];
  return terms.some(
    (term) => negations.some(
      (negation) => containsPhrase(normalizedAnswer, `${negation} ${term}`)
    )
  );
}
function contradictsPoint(answer, description) {
  const rules = {
    "Issues currency": [
      "does not issue currency",
      "never issues currency",
      "cannot issue currency"
    ],
    "Banker and adviser to government": [
      "does not manage government accounts",
      "not the government banker",
      "not banker to government"
    ],
    "Banker's bank and lender of last resort": [
      "does not support commercial banks",
      "not a banker's bank",
      "not bankers bank",
      "never lends to banks"
    ],
    "Controls credit through monetary policy": [
      "does not control credit",
      "does not control the money supply",
      "never regulates credit"
    ],
    "Manages reserves and financial stability": [
      "does not manage foreign reserves",
      "never manages foreign reserves",
      "does not hold foreign exchange reserves"
    ]
  };
  return (rules[description] ?? []).some(
    (phrase) => containsPhrase(answer, phrase)
  );
}
function pointTerms(point) {
  return [...point.keywords, ...point.alternatives];
}
function conceptTerms(concept) {
  return [concept.name, ...concept.alternatives];
}
function hasAnyPhrase(answer, terms) {
  return terms.some((term) => containsPhrase(answer, term));
}
function evaluateAnswer(question, answerText) {
  const answer = answerText.trim();
  const words = answer.match(/\b[\w'-]+\b/g) ?? [];
  const scheme = question.markingScheme ?? [];
  const concepts = question.concepts ?? [];
  const incorrectStatements = [];
  const pointResults = scheme.map((point) => {
    const terms = pointTerms(point);
    const matched = hasAnyPhrase(answer, terms);
    const negated = isNegated(answer, terms) || contradictsPoint(answer, point.description);
    const awarded = matched && !negated ? point.marks : 0;
    if (matched && negated) {
      incorrectStatements.push(
        `The answer appears to deny the required point: ${point.description}.`
      );
    }
    return {
      description: point.description,
      marks: point.marks,
      awarded,
      matched: awarded > 0,
      feedback: awarded > 0 ? "Recognized by the rubric." : negated ? "A contradictory statement was detected." : "This marking point was not identified."
    };
  });
  const matchedConcepts = concepts.filter(
    (concept, index) => pointResults[index]?.awarded > 0 || hasAnyPhrase(answer, conceptTerms(concept))
  ).map((concept) => concept.name);
  const missingConcepts = concepts.filter((concept) => !matchedConcepts.includes(concept.name)).map((concept) => concept.name);
  const canonicalKeywordCount = scheme.reduce(
    (total, point) => total + point.keywords.length,
    0
  );
  const matchedPointsWithKeywords = scheme.filter(
    (point) => hasAnyPhrase(answer, pointTerms(point))
  ).length;
  const keywordCoverage = canonicalKeywordCount ? Math.round(
    matchedPointsWithKeywords / Math.max(scheme.length, 1) * 100
  ) : 0;
  const possibleMarks = scheme.reduce((sum, point) => sum + point.marks, 0);
  const awardedMarks = pointResults.reduce(
    (sum, point) => sum + point.awarded,
    0
  );
  const conceptCoverage = possibleMarks ? Math.round(awardedMarks / possibleMarks * 100) : 0;
  const aiScore = Math.min(question.marks, awardedMarks);
  const contradictionCount = incorrectStatements.length;
  const accuracy = Math.max(0, 100 - contradictionCount * 25);
  const relevance = words.length ? Math.min(100, Math.max(25, Math.round(matchedConcepts.length / Math.max(concepts.length, 1) * 100))) : 0;
  const explanationQuality = words.length === 0 ? 0 : Math.min(100, Math.max(35, Math.round(conceptCoverage * 0.8 + Math.min(words.length, 40) * 0.5)));
  const earnedDescriptions = pointResults.filter((point) => point.awarded > 0).map((point) => point.description);
  const missedDescriptions = pointResults.filter((point) => point.awarded === 0).map((point) => point.description);
  const feedback = missedDescriptions.length === 0 && contradictionCount === 0 ? "All rubric points were identified. Concise answers receive full credit when they include the required concepts." : [
    earnedDescriptions.length ? `Credit awarded for: ${earnedDescriptions.join(", ")}.` : "No official marking points were identified.",
    missedDescriptions.length ? `Still needed: ${missedDescriptions.join(", ")}.` : "",
    contradictionCount ? "Review the contradictory claim flagged below." : ""
  ].filter(Boolean).join(" ");
  return {
    wordCount: words.length,
    aiScore,
    keywordCoverage,
    conceptCoverage,
    relevance,
    accuracy,
    explanationQuality,
    pointResults,
    missingConcepts,
    matchedConcepts,
    incorrectStatements,
    feedback
  };
}
function calculateCorrelation(first, second) {
  if (first.length !== second.length || first.length < 2) return 0;
  const meanFirst = first.reduce((sum, value) => sum + value, 0) / first.length;
  const meanSecond = second.reduce((sum, value) => sum + value, 0) / second.length;
  const numerator = first.reduce(
    (sum, value, index) => sum + (value - meanFirst) * (second[index] - meanSecond),
    0
  );
  const denominator = Math.sqrt(
    first.reduce((sum, value) => sum + (value - meanFirst) ** 2, 0) * second.reduce((sum, value) => sum + (value - meanSecond) ** 2, 0)
  );
  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(2));
}

// server/lib/memory-store.ts
var MemoryStore = class {
  questions = [];
  answers = [];
  nextQuestionId = 1;
  nextAnswerId = 1;
  seeded = false;
  isSeeded() {
    return this.seeded;
  }
  setSeeded(val) {
    this.seeded = val;
  }
  getQuestions() {
    return [...this.questions].sort((a, b) => a.id - b.id);
  }
  getQuestion(id) {
    return this.questions.find((q) => q.id === id);
  }
  addQuestion(data) {
    const question = {
      ...data,
      id: this.nextQuestionId++,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.questions.push(question);
    return question;
  }
  updateQuestion(id, data) {
    const idx = this.questions.findIndex((q) => q.id === id);
    if (idx === -1) return void 0;
    const updated = {
      ...this.questions[idx],
      ...data
    };
    this.questions[idx] = updated;
    return updated;
  }
  deleteQuestion(id) {
    const prevLen = this.questions.length;
    this.questions = this.questions.filter((q) => q.id !== id);
    this.answers = this.answers.filter((a) => a.questionId !== id);
    return this.questions.length < prevLen;
  }
  getAnswers(questionId) {
    const list = questionId ? this.answers.filter((a) => a.questionId === questionId) : this.answers;
    return [...list].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id - b.id
    );
  }
  getAnswer(id) {
    return this.answers.find((a) => a.id === id);
  }
  addAnswer(data) {
    const answer = {
      ...data,
      id: this.nextAnswerId++,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.answers.push(answer);
    return answer;
  }
  updateTeacherScore(id, teacherScore) {
    const answer = this.getAnswer(id);
    if (!answer) return void 0;
    answer.teacherScore = teacherScore;
    return { ...answer };
  }
  seed(questionSeeds, answerSeeds) {
    if (this.questions.length === 0) {
      for (const q of questionSeeds) {
        this.addQuestion(q);
      }
    }
    if (this.answers.length === 0) {
      for (const a of answerSeeds) {
        const targetQ = a.questionId ? this.getQuestion(a.questionId) : this.questions[a.questionIndex ?? 0];
        if (targetQ) {
          this.addAnswer({
            ...a,
            questionId: targetQ.id
          });
        }
      }
    }
    this.seeded = true;
  }
};
var memoryStore = new MemoryStore();

// server/lib/demo-data.ts
var questions = [
  {
    question: "Explain five important functions of a central bank.",
    subject: "Economics",
    marks: 5,
    difficulty: "Medium",
    questionType: "Short answer",
    timeAllowed: 8,
    referenceAnswer: "A central bank issues currency, acts as the government's banker and adviser, serves as the banker's bank and lender of last resort, controls credit through monetary policy, and manages foreign exchange reserves to support financial stability.",
    markingScheme: [
      {
        description: "Issues currency",
        marks: 1,
        keywords: ["issue currency", "bank of issue"],
        alternatives: [
          "prints banknotes",
          "prints currency",
          "currency issuance",
          "issues notes",
          "issues currency",
          "creates the nations notes"
        ]
      },
      {
        description: "Banker and adviser to government",
        marks: 1,
        keywords: ["government's banker", "government banker"],
        alternatives: [
          "banker to government",
          "banks for government",
          "acts as government banker",
          "government accounts",
          "public sector accounts",
          "advises government",
          "financial adviser to government"
        ]
      },
      {
        description: "Banker's bank and lender of last resort",
        marks: 1,
        keywords: ["banker's bank", "bankers bank"],
        alternatives: [
          "bank to commercial banks",
          "lender of last resort",
          "holds reserves for commercial banks",
          "supports commercial banks",
          "emergency funds to banks",
          "lends emergency funds to banks",
          "lends emergency funds to other banks"
        ]
      },
      {
        description: "Controls credit through monetary policy",
        marks: 1,
        keywords: ["credit control", "monetary policy"],
        alternatives: [
          "controls money supply",
          "controls credit",
          "regulates credit",
          "manages interest rates",
          "regulate credit",
          "regulates lending",
          "adjusts policy rates"
        ]
      },
      {
        description: "Manages reserves and financial stability",
        marks: 1,
        keywords: ["foreign exchange reserves", "foreign reserves"],
        alternatives: [
          "manages currency reserves",
          "manages foreign reserves",
          "holds reserves of overseas currency",
          "stabilizes currency",
          "financial stability"
        ]
      }
    ],
    concepts: [
      { name: "Currency issuance", alternatives: ["bank of issue", "prints notes"] },
      { name: "Government banking", alternatives: ["government accounts", "government banker"] },
      { name: "Banking system support", alternatives: ["banker's bank", "lender of last resort"] },
      { name: "Credit and money supply", alternatives: ["monetary policy", "regulates credit"] },
      { name: "Reserves and stability", alternatives: ["foreign reserves", "financial stability"] }
    ]
  },
  {
    question: "Describe how photosynthesis converts light energy into stored chemical energy.",
    subject: "Biology",
    marks: 3,
    difficulty: "Medium",
    questionType: "Explanation",
    timeAllowed: 7,
    referenceAnswer: "Chlorophyll in chloroplasts absorbs light energy. Plants use that energy to convert carbon dioxide and water into glucose, releasing oxygen as a by-product.",
    markingScheme: [
      { description: "Chlorophyll absorbs light", marks: 1, keywords: ["chlorophyll", "absorbs light"], alternatives: ["light energy captured by pigment"] },
      { description: "Carbon dioxide and water form glucose", marks: 1, keywords: ["carbon dioxide", "water", "glucose"], alternatives: ["co2 and h2o produce sugar"] },
      { description: "Oxygen is released", marks: 1, keywords: ["oxygen"], alternatives: ["releases o2"] }
    ],
    concepts: [
      { name: "Light capture", alternatives: ["chlorophyll", "light absorption"] },
      { name: "Sugar production", alternatives: ["glucose", "chemical energy"] },
      { name: "Oxygen release", alternatives: ["oxygen", "o2"] }
    ]
  },
  {
    question: "Explain two causes and one major effect of the Industrial Revolution.",
    subject: "History",
    marks: 3,
    difficulty: "Medium",
    questionType: "Short answer",
    timeAllowed: 6,
    referenceAnswer: "The Industrial Revolution was enabled by access to coal and iron, new inventions such as the steam engine, and investment capital. Factory production and rapid urbanization were major effects.",
    markingScheme: [
      { description: "Access to coal or iron", marks: 1, keywords: ["coal", "iron"], alternatives: ["mineral resources", "fuel resources"] },
      { description: "New machinery or investment", marks: 1, keywords: ["steam engine", "invention"], alternatives: ["mechanization", "investment capital"] },
      { description: "Factory production or urbanization", marks: 1, keywords: ["factory", "urbanization"], alternatives: ["mass production", "growth of cities"] }
    ],
    concepts: [
      { name: "Natural resources", alternatives: ["coal", "iron"] },
      { name: "Technology and capital", alternatives: ["steam engine", "investment"] },
      { name: "Industrial and urban change", alternatives: ["factory", "urbanization"] }
    ]
  },
  {
    question: "State Newton's third law and explain one everyday example.",
    subject: "Physics",
    marks: 4,
    difficulty: "Easy",
    questionType: "Explanation",
    timeAllowed: 5,
    referenceAnswer: "Newton's third law states that when one body exerts a force on another, the second exerts an equal and opposite force on the first. For example, a swimmer pushes water backward and the water pushes the swimmer forward.",
    markingScheme: [
      { description: "An interaction involves two bodies", marks: 1, keywords: ["two bodies", "another body"], alternatives: ["action and reaction pair"] },
      { description: "Forces are equal in magnitude", marks: 1, keywords: ["equal force", "equal in magnitude"], alternatives: ["same size force"] },
      { description: "Forces act in opposite directions", marks: 1, keywords: ["opposite direction"], alternatives: ["equal and opposite", "opposite forces"] },
      { description: "Relevant example correctly explained", marks: 1, keywords: ["swimmer", "rocket", "recoil"], alternatives: ["pushes backward and moves forward", "walking pushes ground"] }
    ],
    concepts: [
      { name: "Paired forces", alternatives: ["action and reaction", "two bodies"] },
      { name: "Equal magnitude", alternatives: ["same size", "equal force"] },
      { name: "Opposite direction", alternatives: ["opposite forces"] },
      { name: "Everyday example", alternatives: ["swimmer", "rocket", "walking"] }
    ]
  },
  {
    question: "Outline the stages of the water cycle and explain the role of the Sun.",
    subject: "Geography",
    marks: 4,
    difficulty: "Easy",
    questionType: "Explanation",
    timeAllowed: 6,
    referenceAnswer: "The Sun heats water and drives evaporation. Water vapor cools and condenses into clouds, then returns as precipitation. Water collects in rivers and oceans, where the cycle repeats.",
    markingScheme: [
      { description: "Sun provides energy for evaporation", marks: 1, keywords: ["sun", "evaporation"], alternatives: ["solar heat evaporates water"] },
      { description: "Vapor condenses into clouds", marks: 1, keywords: ["condensation", "cloud"], alternatives: ["water vapor cools"] },
      { description: "Precipitation returns water", marks: 1, keywords: ["precipitation"], alternatives: ["rainfall", "snow falls"] },
      { description: "Collection and repetition", marks: 1, keywords: ["collection", "cycle"], alternatives: ["water gathers in oceans", "cycle repeats"] }
    ],
    concepts: [
      { name: "Evaporation", alternatives: ["sun heats water"] },
      { name: "Condensation", alternatives: ["cloud formation"] },
      { name: "Precipitation", alternatives: ["rainfall"] },
      { name: "Collection", alternatives: ["runoff", "oceans"] }
    ]
  }
];
var benchmarkTexts = [
  {
    name: "Benchmark 01",
    answer: "The central bank issues currency, acts as the government's banker and adviser, is the banker's bank and lender of last resort, controls credit through monetary policy, and manages foreign exchange reserves to maintain financial stability.",
    teacherScore: 5
  },
  {
    name: "Benchmark 02",
    answer: "It issues currency, manages government accounts, supports commercial banks as their lender of last resort, and uses monetary policy to regulate credit.",
    teacherScore: 4
  },
  {
    name: "Benchmark 03",
    answer: "Issues currency; banks for government; supports commercial banks; controls credit; manages foreign reserves.",
    teacherScore: 5
  },
  {
    name: "Benchmark 04",
    answer: "A central bank issues currency and notes. It advises government and runs its accounts. It is the bankers' bank and can provide funds as lender of last resort. It changes interest rates and uses monetary policy to control the money supply. It also manages foreign reserves, protects financial stability and supports the national currency during external shocks. These tasks help payments and economic policy work smoothly.",
    teacherScore: 5
  },
  {
    name: "Benchmark 05",
    answer: "The central bank is important to the national economy. Companies sell shares on the stock market, consumers buy products, factories hire workers, and trade changes GDP. Weather and sporting events can also influence people's spending habits.",
    teacherScore: 0
  },
  {
    name: "Benchmark 06",
    answer: "It prints currency.",
    teacherScore: 1
  },
  {
    name: "Benchmark 07",
    answer: "The central bank issues currency. It does not control credit or the money supply, does not support commercial banks, and never manages foreign reserves. Its only job is to set company share prices.",
    teacherScore: 1
  },
  {
    name: "Benchmark 08",
    answer: "It creates the nation's notes, keeps public-sector accounts, lends emergency funds to other banks, adjusts policy rates to regulate lending, and holds reserves of overseas currency.",
    teacherScore: 5
  },
  {
    name: "Benchmark 09",
    answer: "Currency, government's banker, banker's bank, lender of last resort, credit control, monetary policy, foreign exchange reserves.",
    teacherScore: 2
  },
  {
    name: "Benchmark 10",
    answer: "The central bank issues notes, serves as the banker's bank and lender of last resort, and uses monetary policy to control the money supply. It is very important to the economy.",
    teacherScore: 3
  }
];
var DEMO_FIXTURE_VERSION = 3;
var seedPromise;
function ensureDemoData() {
  if (!seedPromise) {
    seedPromise = (async () => {
      if (!hasDatabaseUrl || !db) {
        if (!memoryStore.isSeeded()) {
          const sampleQuestion = questions[0];
          const samples2 = benchmarkTexts.map((sample) => {
            const grade = evaluateAnswer(sampleQuestion, sample.answer);
            return {
              questionId: 1,
              studentName: sample.name,
              answerText: sample.answer,
              ...grade,
              teacherScore: sample.teacherScore,
              benchmark: true
            };
          });
          memoryStore.seed(questions, samples2);
        }
        return;
      }
      const existing = await db.select({ id: questionsTable.id }).from(questionsTable).limit(1);
      if (existing.length) {
        const [fixtureVersion] = await db.select().from(graderMetaTable).where(eq(graderMetaTable.key, "demo-fixture"));
        if (!fixtureVersion || fixtureVersion.version < DEMO_FIXTURE_VERSION) {
          const centralBankSeed = questions[0];
          const [centralBankQuestion2] = await db.select().from(questionsTable).where(eq(questionsTable.question, centralBankSeed.question));
          if (centralBankQuestion2) {
            await db.update(questionsTable).set(centralBankSeed).where(eq(questionsTable.id, centralBankQuestion2.id));
            const benchmarkRows = await db.select().from(answersTable).where(eq(answersTable.benchmark, true));
            for (const row of benchmarkRows) {
              const grade = evaluateAnswer(
                { ...centralBankQuestion2, ...centralBankSeed },
                row.answerText
              );
              await db.update(answersTable).set(grade).where(eq(answersTable.id, row.id));
            }
          }
          await db.insert(graderMetaTable).values({ key: "demo-fixture", version: DEMO_FIXTURE_VERSION }).onConflictDoUpdate({
            target: graderMetaTable.key,
            set: { version: DEMO_FIXTURE_VERSION }
          });
        }
        return;
      }
      const insertedQuestions = await db.insert(questionsTable).values(questions).returning();
      const centralBankQuestion = insertedQuestions.find(
        (item) => item.question.startsWith("Explain five important functions")
      );
      if (!centralBankQuestion) return;
      const samples = benchmarkTexts.map((sample) => {
        const grade = evaluateAnswer(centralBankQuestion, sample.answer);
        return {
          questionId: centralBankQuestion.id,
          studentName: sample.name,
          answerText: sample.answer,
          ...grade,
          teacherScore: sample.teacherScore,
          benchmark: true
        };
      });
      await db.insert(answersTable).values(samples);
      await db.insert(graderMetaTable).values({
        key: "demo-fixture",
        version: DEMO_FIXTURE_VERSION
      });
    })();
  }
  return seedPromise;
}

// server/routes/grader.ts
var router2 = Router2();
router2.use(async (_req, _res, next) => {
  try {
    await ensureDemoData();
    next();
  } catch (error) {
    next(error);
  }
});
function toAnswer(answer) {
  return {
    ...answer,
    teacherScore: answer.teacherScore ?? null,
    scoreGap: answer.teacherScore == null ? null : answer.aiScore - answer.teacherScore,
    absoluteGap: answer.teacherScore == null ? null : Math.abs(answer.aiScore - answer.teacherScore),
    createdAt: typeof answer.createdAt === "string" ? answer.createdAt : answer.createdAt.toISOString()
  };
}
async function toQuestion(question) {
  let answers;
  if (hasDatabaseUrl && db) {
    answers = await db.select({ aiScore: answersTable.aiScore }).from(answersTable).where(eq2(answersTable.questionId, question.id));
  } else {
    answers = memoryStore.getAnswers(question.id).map((a) => ({ aiScore: a.aiScore }));
  }
  const averageScore = answers.length ? Number(
    (answers.reduce((total, item) => total + item.aiScore, 0) / answers.length).toFixed(1)
  ) : 0;
  return {
    ...question,
    attempts: answers.length,
    averageScore
  };
}
router2.get("/questions", async (_req, res) => {
  const questions2 = hasDatabaseUrl && db ? await db.select().from(questionsTable).orderBy(asc(questionsTable.id)) : memoryStore.getQuestions();
  const data = await Promise.all(questions2.map(toQuestion));
  res.json(ListQuestionsResponse.parse(data));
});
router2.post("/questions", async (req, res) => {
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rubricMarks = parsed.data.markingScheme.reduce(
    (total, point) => total + point.marks,
    0
  );
  if (rubricMarks < parsed.data.marks) {
    res.status(400).json({
      error: "Marking scheme points must allocate at least the full question marks."
    });
    return;
  }
  const question = hasDatabaseUrl && db ? (await db.insert(questionsTable).values(parsed.data).returning())[0] : memoryStore.addQuestion(parsed.data);
  res.status(201).json(
    GetQuestionResponse.parse({
      ...question,
      attempts: 0,
      averageScore: 0
    })
  );
});
router2.get("/questions/:id", async (req, res) => {
  const params = GetQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const question = hasDatabaseUrl && db ? (await db.select().from(questionsTable).where(eq2(questionsTable.id, params.data.id)))[0] : memoryStore.getQuestion(params.data.id);
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.json(GetQuestionResponse.parse(await toQuestion(question)));
});
router2.put("/questions/:id", async (req, res) => {
  const params = UpdateQuestionParams.safeParse(req.params);
  const body = UpdateQuestionBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({
      error: params.error.message
    });
    return;
  }
  if (!body.success) {
    res.status(400).json({
      error: body.error.message
    });
    return;
  }
  const rubricMarks = body.data.markingScheme.reduce(
    (total, point) => total + point.marks,
    0
  );
  if (rubricMarks < body.data.marks) {
    res.status(400).json({
      error: "Marking scheme points must allocate at least the full question marks."
    });
    return;
  }
  const question = hasDatabaseUrl && db ? (await db.update(questionsTable).set(body.data).where(eq2(questionsTable.id, params.data.id)).returning())[0] : memoryStore.updateQuestion(params.data.id, body.data);
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.json(
    GetQuestionResponse.parse({
      ...question,
      ...await toQuestion(question)
    })
  );
});
router2.delete("/questions/:id", async (req, res) => {
  const params = DeleteQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const deleted = hasDatabaseUrl && db ? (await db.delete(questionsTable).where(eq2(questionsTable.id, params.data.id)).returning({ id: questionsTable.id }))[0] : memoryStore.deleteQuestion(params.data.id);
  if (!deleted) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.sendStatus(204);
});
router2.get("/answers", async (req, res) => {
  const query = ListAnswersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const rows = hasDatabaseUrl && db ? query.data.questionId ? await db.select().from(answersTable).where(eq2(answersTable.questionId, query.data.questionId)).orderBy(desc(answersTable.createdAt), asc(answersTable.id)) : await db.select().from(answersTable).orderBy(desc(answersTable.createdAt), asc(answersTable.id)) : memoryStore.getAnswers(query.data.questionId);
  res.json(ListAnswersResponse.parse(rows.map(toAnswer)));
});
router2.post("/answers", async (req, res) => {
  const parsed = CreateAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const question = hasDatabaseUrl && db ? (await db.select().from(questionsTable).where(eq2(questionsTable.id, parsed.data.questionId)))[0] : memoryStore.getQuestion(parsed.data.questionId);
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  const grade = evaluateAnswer(question, parsed.data.answerText);
  const answerPayload = {
    questionId: question.id,
    studentName: parsed.data.studentName.trim(),
    answerText: parsed.data.answerText.trim(),
    ...grade,
    teacherScore: null,
    benchmark: false
  };
  const answer = hasDatabaseUrl && db ? (await db.insert(answersTable).values(answerPayload).returning())[0] : memoryStore.addAnswer(answerPayload);
  res.status(201).json(GetAnswerResponse.parse(toAnswer(answer)));
});
router2.get("/answers/:id", async (req, res) => {
  const params = GetAnswerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const answer = hasDatabaseUrl && db ? (await db.select().from(answersTable).where(eq2(answersTable.id, params.data.id)))[0] : memoryStore.getAnswer(params.data.id);
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }
  res.json(GetAnswerResponse.parse(toAnswer(answer)));
});
router2.patch("/answers/:id/teacher-score", async (req, res) => {
  const params = UpdateTeacherScoreParams.safeParse(req.params);
  const body = UpdateTeacherScoreBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({
      error: params.error.message
    });
    return;
  }
  if (!body.success) {
    res.status(400).json({
      error: body.error.message
    });
    return;
  }
  const answer = hasDatabaseUrl && db ? (await db.select().from(answersTable).where(eq2(answersTable.id, params.data.id)))[0] : memoryStore.getAnswer(params.data.id);
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }
  const question = hasDatabaseUrl && db ? (await db.select({ marks: questionsTable.marks }).from(questionsTable).where(eq2(questionsTable.id, answer.questionId)))[0] : memoryStore.getQuestion(answer.questionId);
  if (!question || body.data.teacherScore > question.marks) {
    res.status(400).json({ error: "Teacher score must be within the question mark limit." });
    return;
  }
  const updated = hasDatabaseUrl && db ? (await db.update(answersTable).set({ teacherScore: body.data.teacherScore }).where(eq2(answersTable.id, answer.id)).returning())[0] : memoryStore.updateTeacherScore(params.data.id, body.data.teacherScore);
  res.json(GetAnswerResponse.parse(toAnswer(updated)));
});
router2.get("/dashboard", async (_req, res) => {
  const questions2 = hasDatabaseUrl && db ? await db.select().from(questionsTable) : memoryStore.getQuestions();
  const answers = hasDatabaseUrl && db ? await db.select().from(answersTable).orderBy(desc(answersTable.createdAt), asc(answersTable.id)) : memoryStore.getAnswers();
  const teacherScored = answers.filter((item) => item.teacherScore != null);
  const average = (values) => values.length ? Number((values.reduce((total, item) => total + item, 0) / values.length).toFixed(1)) : 0;
  const distinctQuestions = new Set(answers.map((item) => item.questionId));
  const data = {
    totalQuestions: questions2.length,
    attemptedQuestions: distinctQuestions.size,
    totalAnswers: answers.length,
    averageAiScore: average(answers.map((item) => item.aiScore)),
    averageTeacherScore: average(
      teacherScored.map((item) => item.teacherScore ?? 0)
    ),
    averageGap: average(
      teacherScored.map((item) => item.aiScore - (item.teacherScore ?? 0))
    ),
    agreementPercent: teacherScored.length ? Math.round(
      teacherScored.filter((item) => item.aiScore === item.teacherScore).length / teacherScored.length * 100
    ) : 0,
    keywordCoverage: average(answers.map((item) => item.keywordCoverage)),
    conceptCoverage: average(answers.map((item) => item.conceptCoverage)),
    recentAnswers: answers.slice(0, 8).map(toAnswer)
  };
  res.json(data);
});
router2.get("/analytics/fairness", async (_req, res) => {
  const rows = hasDatabaseUrl && db ? await db.select().from(answersTable).where(and(eq2(answersTable.benchmark, true))).orderBy(asc(answersTable.id)) : memoryStore.getAnswers().filter((item) => item.benchmark);
  const answers = rows.map(toAnswer);
  const compared = answers.filter((item) => item.teacherScore != null);
  const count = compared.length;
  const average = (values) => values.length ? Number((values.reduce((total, item) => total + item, 0) / values.length).toFixed(2)) : 0;
  const gaps = compared.map((item) => item.scoreGap ?? 0);
  const aiScores = compared.map((item) => item.aiScore);
  const teacherScores = compared.map((item) => item.teacherScore ?? 0);
  const words = compared.map((item) => item.wordCount);
  const wordAiCorrelation = calculateCorrelation(words, aiScores);
  const wordTeacherCorrelation = calculateCorrelation(words, teacherScores);
  const detectedBiases = [];
  if (wordAiCorrelation > 0.35 && wordAiCorrelation - wordTeacherCorrelation > 0.2) {
    detectedBiases.push("Length bias");
  }
  if (compared.some(
    (item) => item.keywordCoverage >= 80 && (item.scoreGap ?? 0) >= 1
  )) {
    detectedBiases.push("Keyword bias");
  }
  const medianWords = [...words].sort((a, b) => a - b)[Math.floor(words.length / 2)];
  if (compared.some(
    (item) => item.wordCount <= (medianWords ?? 0) && (item.scoreGap ?? 0) <= -1
  )) {
    detectedBiases.push("Short-answer penalty");
  }
  if (compared.some(
    (item) => item.keywordCoverage < 50 && item.conceptCoverage >= 70 && (item.scoreGap ?? 0) < 0
  )) {
    detectedBiases.push("Semantic matching failure");
  }
  const upperWordBound = words.length ? [...words].sort((a, b) => a - b)[Math.floor(words.length * 0.75)] : 0;
  if (compared.some(
    (item) => item.wordCount > (upperWordBound ?? 0) && item.relevance < 50 && (item.scoreGap ?? 0) > 0
  )) {
    detectedBiases.push("Irrelevance reward");
  }
  if (compared.some(
    (item) => item.incorrectStatements.length > 0 && (item.scoreGap ?? 0) > 0
  )) {
    detectedBiases.push("Factual error reward");
  }
  const agreement = count ? compared.filter((item) => item.scoreGap === 0).length / count : 0;
  const over = count ? compared.filter((item) => (item.scoreGap ?? 0) > 0).length / count : 0;
  const under = count ? compared.filter((item) => (item.scoreGap ?? 0) < 0).length / count : 0;
  const meanAbsoluteError = average(gaps.map(Math.abs));
  const conclusion = count === 0 ? "Add teacher scores to answer evaluations to compare the rubric grader with human marking." : `Across ${count} teacher-scored benchmark answers, exact agreement was ${Math.round(
    agreement * 100
  )}% (MAE ${meanAbsoluteError.toFixed(2)} marks). ${detectedBiases.length ? `The benchmark triggered these review flags: ${detectedBiases.join(", ")}.` : "No configured length, keyword, short-answer, semantic, relevance, or factual-error flags were triggered."} These are screening signals from a small sample, not proof of fairness.`;
  res.json({
    answers,
    meanAbsoluteError,
    agreementRate: Number(agreement.toFixed(2)),
    overestimationRate: Number(over.toFixed(2)),
    underestimationRate: Number(under.toFixed(2)),
    aiTeacherCorrelation: calculateCorrelation(aiScores, teacherScores),
    wordAiCorrelation,
    wordTeacherCorrelation,
    detectedBiases,
    conclusion
  });
});
var grader_default = router2;

// server/routes/index.ts
var router3 = Router3();
router3.use(health_default);
router3.use(grader_default);
var routes_default = router3;

// server/lib/logger.ts
import pino from "pino";
var isProduction = process.env.NODE_ENV === "production";
var logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']"
  ],
  ...isProduction ? {} : {
    transport: {
      target: "pino-pretty",
      options: { colorize: true }
    }
  }
});

// server/app.ts
var app = express();
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0]
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode
        };
      }
    }
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "ai-answer-grader-api" });
});
app.use("/api", routes_default);
app.use(routes_default);
var app_default = app;
export {
  app_default as default
};
