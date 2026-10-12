import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  CreateAnswerBody,
  CreateQuestionBody,
  DeleteQuestionParams,
  GetAnswerParams,
  GetAnswerResponse,
  GetQuestionParams,
  GetQuestionResponse,
  ListAnswersQueryParams,
  ListAnswersResponse,
  ListQuestionsResponse,
  UpdateQuestionBody,
  UpdateQuestionParams,
  UpdateTeacherScoreBody,
  UpdateTeacherScoreParams,
} from "@workspace/api-zod";
import { answersTable, db, hasDatabaseUrl, questionsTable } from "@workspace/db";
import { ensureDemoData } from "../lib/demo-data";
import { calculateCorrelation, evaluateAnswer } from "../lib/grader";
import { memoryStore } from "../lib/memory-store";

const router: IRouter = Router();

router.use(async (_req, _res, next) => {
  try {
    await ensureDemoData();
    next();
  } catch (error) {
    next(error);
  }
});

function toAnswer(answer: typeof answersTable.$inferSelect) {
  return {
    ...answer,
    teacherScore: answer.teacherScore ?? null,
    scoreGap:
      answer.teacherScore == null ? null : answer.aiScore - answer.teacherScore,
    absoluteGap:
      answer.teacherScore == null
        ? null
        : Math.abs(answer.aiScore - answer.teacherScore),
    createdAt:
      typeof answer.createdAt === "string"
        ? answer.createdAt
        : answer.createdAt.toISOString(),
  };
}

async function toQuestion(question: typeof questionsTable.$inferSelect) {
  let answers: { aiScore: number }[];
  if (hasDatabaseUrl && db) {
    answers = await db
      .select({ aiScore: answersTable.aiScore })
      .from(answersTable)
      .where(eq(answersTable.questionId, question.id));
  } else {
    answers = memoryStore
      .getAnswers(question.id)
      .map((a) => ({ aiScore: a.aiScore }));
  }
  const averageScore = answers.length
    ? Number(
        (
          answers.reduce((total, item) => total + item.aiScore, 0) /
          answers.length
        ).toFixed(1),
      )
    : 0;
  return {
    ...question,
    attempts: answers.length,
    averageScore,
  };
}

router.get("/questions", async (_req, res): Promise<void> => {
  const questions =
    hasDatabaseUrl && db
      ? await db.select().from(questionsTable).orderBy(asc(questionsTable.id))
      : memoryStore.getQuestions();
  const data = await Promise.all(questions.map(toQuestion));
  res.json(ListQuestionsResponse.parse(data));
});

router.post("/questions", async (req, res): Promise<void> => {
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rubricMarks = parsed.data.markingScheme.reduce(
    (total, point) => total + point.marks,
    0,
  );
  if (rubricMarks < parsed.data.marks) {
    res.status(400).json({
      error: "Marking scheme points must allocate at least the full question marks.",
    });
    return;
  }
  const question =
    hasDatabaseUrl && db
      ? (await db.insert(questionsTable).values(parsed.data).returning())[0]
      : memoryStore.addQuestion(parsed.data);
  res.status(201).json(
    GetQuestionResponse.parse({
      ...question,
      attempts: 0,
      averageScore: 0,
    }),
  );
});

router.get("/questions/:id", async (req, res): Promise<void> => {
  const params = GetQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const question =
    hasDatabaseUrl && db
      ? (
          await db
            .select()
            .from(questionsTable)
            .where(eq(questionsTable.id, params.data.id))
        )[0]
      : memoryStore.getQuestion(params.data.id);
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.json(GetQuestionResponse.parse(await toQuestion(question)));
});

router.put("/questions/:id", async (req, res): Promise<void> => {
  const params = UpdateQuestionParams.safeParse(req.params);
  const body = UpdateQuestionBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({
      error: params.error.message,
    });
    return;
  }
  if (!body.success) {
    res.status(400).json({
      error: body.error.message,
    });
    return;
  }
  const rubricMarks = body.data.markingScheme.reduce(
    (total, point) => total + point.marks,
    0,
  );
  if (rubricMarks < body.data.marks) {
    res.status(400).json({
      error: "Marking scheme points must allocate at least the full question marks.",
    });
    return;
  }
  const question =
    hasDatabaseUrl && db
      ? (
          await db
            .update(questionsTable)
            .set(body.data)
            .where(eq(questionsTable.id, params.data.id))
            .returning()
        )[0]
      : memoryStore.updateQuestion(params.data.id, body.data);
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.json(
    GetQuestionResponse.parse({
      ...question,
      ...(await toQuestion(question)),
    }),
  );
});

router.delete("/questions/:id", async (req, res): Promise<void> => {
  const params = DeleteQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const deleted =
    hasDatabaseUrl && db
      ? (
          await db
            .delete(questionsTable)
            .where(eq(questionsTable.id, params.data.id))
            .returning({ id: questionsTable.id })
        )[0]
      : memoryStore.deleteQuestion(params.data.id);
  if (!deleted) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/answers", async (req, res): Promise<void> => {
  const query = ListAnswersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const rows =
    hasDatabaseUrl && db
      ? query.data.questionId
        ? await db
            .select()
            .from(answersTable)
            .where(eq(answersTable.questionId, query.data.questionId))
            .orderBy(desc(answersTable.createdAt), asc(answersTable.id))
        : await db
            .select()
            .from(answersTable)
            .orderBy(desc(answersTable.createdAt), asc(answersTable.id))
      : memoryStore.getAnswers(query.data.questionId);
  res.json(ListAnswersResponse.parse(rows.map(toAnswer)));
});

router.post("/answers", async (req, res): Promise<void> => {
  const parsed = CreateAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const question =
    hasDatabaseUrl && db
      ? (
          await db
            .select()
            .from(questionsTable)
            .where(eq(questionsTable.id, parsed.data.questionId))
        )[0]
      : memoryStore.getQuestion(parsed.data.questionId);
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
    benchmark: false,
  };
  const answer =
    hasDatabaseUrl && db
      ? (await db.insert(answersTable).values(answerPayload).returning())[0]
      : memoryStore.addAnswer(answerPayload);
  res.status(201).json(GetAnswerResponse.parse(toAnswer(answer)));
});

router.get("/answers/:id", async (req, res): Promise<void> => {
  const params = GetAnswerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const answer =
    hasDatabaseUrl && db
      ? (
          await db
            .select()
            .from(answersTable)
            .where(eq(answersTable.id, params.data.id))
        )[0]
      : memoryStore.getAnswer(params.data.id);
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }
  res.json(GetAnswerResponse.parse(toAnswer(answer)));
});

router.patch("/answers/:id/teacher-score", async (req, res): Promise<void> => {
  const params = UpdateTeacherScoreParams.safeParse(req.params);
  const body = UpdateTeacherScoreBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({
      error: params.error.message,
    });
    return;
  }
  if (!body.success) {
    res.status(400).json({
      error: body.error.message,
    });
    return;
  }
  const answer =
    hasDatabaseUrl && db
      ? (
          await db
            .select()
            .from(answersTable)
            .where(eq(answersTable.id, params.data.id))
        )[0]
      : memoryStore.getAnswer(params.data.id);
  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }
  const question =
    hasDatabaseUrl && db
      ? (
          await db
            .select({ marks: questionsTable.marks })
            .from(questionsTable)
            .where(eq(questionsTable.id, answer.questionId))
        )[0]
      : memoryStore.getQuestion(answer.questionId);
  if (!question || body.data.teacherScore > question.marks) {
    res.status(400).json({ error: "Teacher score must be within the question mark limit." });
    return;
  }
  const updated =
    hasDatabaseUrl && db
      ? (
          await db
            .update(answersTable)
            .set({ teacherScore: body.data.teacherScore })
            .where(eq(answersTable.id, answer.id))
            .returning()
        )[0]
      : memoryStore.updateTeacherScore(params.data.id, body.data.teacherScore);
  res.json(GetAnswerResponse.parse(toAnswer(updated!)));
});

router.get("/dashboard", async (_req, res): Promise<void> => {
  const questions =
    hasDatabaseUrl && db
      ? await db.select().from(questionsTable)
      : memoryStore.getQuestions();
  const answers =
    hasDatabaseUrl && db
      ? await db
          .select()
          .from(answersTable)
          .orderBy(desc(answersTable.createdAt), asc(answersTable.id))
      : memoryStore.getAnswers();
  const teacherScored = answers.filter((item) => item.teacherScore != null);
  const average = (values: number[]) =>
    values.length
      ? Number((values.reduce((total, item) => total + item, 0) / values.length).toFixed(1))
      : 0;
  const distinctQuestions = new Set(answers.map((item) => item.questionId));
  const data = {
    totalQuestions: questions.length,
    attemptedQuestions: distinctQuestions.size,
    totalAnswers: answers.length,
    averageAiScore: average(answers.map((item) => item.aiScore)),
    averageTeacherScore: average(
      teacherScored.map((item) => item.teacherScore ?? 0),
    ),
    averageGap: average(
      teacherScored.map((item) => item.aiScore - (item.teacherScore ?? 0)),
    ),
    agreementPercent: teacherScored.length
      ? Math.round(
          (teacherScored.filter((item) => item.aiScore === item.teacherScore)
            .length /
            teacherScored.length) *
            100,
        )
      : 0,
    keywordCoverage: average(answers.map((item) => item.keywordCoverage)),
    conceptCoverage: average(answers.map((item) => item.conceptCoverage)),
    recentAnswers: answers.slice(0, 8).map(toAnswer),
  };
  res.json(data);
});

router.get("/analytics/fairness", async (_req, res): Promise<void> => {
  const rows =
    hasDatabaseUrl && db
      ? await db
          .select()
          .from(answersTable)
          .where(and(eq(answersTable.benchmark, true)))
          .orderBy(asc(answersTable.id))
      : memoryStore.getAnswers().filter((item) => item.benchmark);
  const answers = rows.map(toAnswer);
  const compared = answers.filter((item) => item.teacherScore != null);
  const count = compared.length;
  const average = (values: number[]) =>
    values.length
      ? Number((values.reduce((total, item) => total + item, 0) / values.length).toFixed(2))
      : 0;
  const gaps = compared.map((item) => item.scoreGap ?? 0);
  const aiScores = compared.map((item) => item.aiScore);
  const teacherScores = compared.map((item) => item.teacherScore ?? 0);
  const words = compared.map((item) => item.wordCount);
  const wordAiCorrelation = calculateCorrelation(words, aiScores);
  const wordTeacherCorrelation = calculateCorrelation(words, teacherScores);
  const detectedBiases: string[] = [];

  if (
    wordAiCorrelation > 0.35 &&
    wordAiCorrelation - wordTeacherCorrelation > 0.2
  ) {
    detectedBiases.push("Length bias");
  }
  if (
    compared.some(
      (item) =>
        item.keywordCoverage >= 80 &&
        (item.scoreGap ?? 0) >= 1,
    )
  ) {
    detectedBiases.push("Keyword bias");
  }
  const medianWords = [...words].sort((a, b) => a - b)[
    Math.floor(words.length / 2)
  ];
  if (
    compared.some(
      (item) =>
        item.wordCount <= (medianWords ?? 0) &&
        (item.scoreGap ?? 0) <= -1,
    )
  ) {
    detectedBiases.push("Short-answer penalty");
  }
  if (
    compared.some(
      (item) =>
        item.keywordCoverage < 50 &&
        item.conceptCoverage >= 70 &&
        (item.scoreGap ?? 0) < 0,
    )
  ) {
    detectedBiases.push("Semantic matching failure");
  }
  const upperWordBound = words.length
    ? [...words].sort((a, b) => a - b)[Math.floor(words.length * 0.75)]
    : 0;
  if (
    compared.some(
      (item) =>
        item.wordCount > (upperWordBound ?? 0) &&
        item.relevance < 50 &&
        (item.scoreGap ?? 0) > 0,
    )
  ) {
    detectedBiases.push("Irrelevance reward");
  }
  if (
    compared.some(
      (item) =>
        item.incorrectStatements.length > 0 && (item.scoreGap ?? 0) > 0,
    )
  ) {
    detectedBiases.push("Factual error reward");
  }

  const agreement = count
    ? compared.filter((item) => item.scoreGap === 0).length / count
    : 0;
  const over = count ? compared.filter((item) => (item.scoreGap ?? 0) > 0).length / count : 0;
  const under = count ? compared.filter((item) => (item.scoreGap ?? 0) < 0).length / count : 0;
  const meanAbsoluteError = average(gaps.map(Math.abs));
  const conclusion =
    count === 0
      ? "Add teacher scores to answer evaluations to compare the rubric grader with human marking."
      : `Across ${count} teacher-scored benchmark answers, exact agreement was ${Math.round(
          agreement * 100,
        )}% (MAE ${meanAbsoluteError.toFixed(2)} marks). ${
          detectedBiases.length
            ? `The benchmark triggered these review flags: ${detectedBiases.join(", ")}.`
            : "No configured length, keyword, short-answer, semantic, relevance, or factual-error flags were triggered."
        } These are screening signals from a small sample, not proof of fairness.`;

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
    conclusion,
  });
});

export default router;
