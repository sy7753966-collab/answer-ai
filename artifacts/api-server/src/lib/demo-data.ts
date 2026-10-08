import { eq } from "drizzle-orm";
import {
  answersTable,
  db,
  graderMetaTable,
  questionsTable,
  type ConceptGroup,
  type MarkingPoint,
} from "@workspace/db";
import { evaluateAnswer } from "./grader";

type QuestionSeed = {
  question: string;
  subject: string;
  marks: number;
  difficulty: string;
  questionType: string;
  timeAllowed: number;
  referenceAnswer: string;
  markingScheme: MarkingPoint[];
  concepts: ConceptGroup[];
};

const questions: QuestionSeed[] = [
  {
    question: "Explain five important functions of a central bank.",
    subject: "Economics",
    marks: 5,
    difficulty: "Medium",
    questionType: "Short answer",
    timeAllowed: 8,
    referenceAnswer:
      "A central bank issues currency, acts as the government's banker and adviser, serves as the banker's bank and lender of last resort, controls credit through monetary policy, and manages foreign exchange reserves to support financial stability.",
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
          "creates the nations notes",
        ],
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
          "financial adviser to government",
        ],
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
          "lends emergency funds to other banks",
        ],
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
          "adjusts policy rates",
        ],
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
          "financial stability",
        ],
      },
    ],
    concepts: [
      { name: "Currency issuance", alternatives: ["bank of issue", "prints notes"] },
      { name: "Government banking", alternatives: ["government accounts", "government banker"] },
      { name: "Banking system support", alternatives: ["banker's bank", "lender of last resort"] },
      { name: "Credit and money supply", alternatives: ["monetary policy", "regulates credit"] },
      { name: "Reserves and stability", alternatives: ["foreign reserves", "financial stability"] },
    ],
  },
  {
    question: "Describe how photosynthesis converts light energy into stored chemical energy.",
    subject: "Biology",
    marks: 3,
    difficulty: "Medium",
    questionType: "Explanation",
    timeAllowed: 7,
    referenceAnswer:
      "Chlorophyll in chloroplasts absorbs light energy. Plants use that energy to convert carbon dioxide and water into glucose, releasing oxygen as a by-product.",
    markingScheme: [
      { description: "Chlorophyll absorbs light", marks: 1, keywords: ["chlorophyll", "absorbs light"], alternatives: ["light energy captured by pigment"] },
      { description: "Carbon dioxide and water form glucose", marks: 1, keywords: ["carbon dioxide", "water", "glucose"], alternatives: ["co2 and h2o produce sugar"] },
      { description: "Oxygen is released", marks: 1, keywords: ["oxygen"], alternatives: ["releases o2"] },
    ],
    concepts: [
      { name: "Light capture", alternatives: ["chlorophyll", "light absorption"] },
      { name: "Sugar production", alternatives: ["glucose", "chemical energy"] },
      { name: "Oxygen release", alternatives: ["oxygen", "o2"] },
    ],
  },
  {
    question: "Explain two causes and one major effect of the Industrial Revolution.",
    subject: "History",
    marks: 3,
    difficulty: "Medium",
    questionType: "Short answer",
    timeAllowed: 6,
    referenceAnswer:
      "The Industrial Revolution was enabled by access to coal and iron, new inventions such as the steam engine, and investment capital. Factory production and rapid urbanization were major effects.",
    markingScheme: [
      { description: "Access to coal or iron", marks: 1, keywords: ["coal", "iron"], alternatives: ["mineral resources", "fuel resources"] },
      { description: "New machinery or investment", marks: 1, keywords: ["steam engine", "invention"], alternatives: ["mechanization", "investment capital"] },
      { description: "Factory production or urbanization", marks: 1, keywords: ["factory", "urbanization"], alternatives: ["mass production", "growth of cities"] },
    ],
    concepts: [
      { name: "Natural resources", alternatives: ["coal", "iron"] },
      { name: "Technology and capital", alternatives: ["steam engine", "investment"] },
      { name: "Industrial and urban change", alternatives: ["factory", "urbanization"] },
    ],
  },
  {
    question: "State Newton's third law and explain one everyday example.",
    subject: "Physics",
    marks: 4,
    difficulty: "Easy",
    questionType: "Explanation",
    timeAllowed: 5,
    referenceAnswer:
      "Newton's third law states that when one body exerts a force on another, the second exerts an equal and opposite force on the first. For example, a swimmer pushes water backward and the water pushes the swimmer forward.",
    markingScheme: [
      { description: "An interaction involves two bodies", marks: 1, keywords: ["two bodies", "another body"], alternatives: ["action and reaction pair"] },
      { description: "Forces are equal in magnitude", marks: 1, keywords: ["equal force", "equal in magnitude"], alternatives: ["same size force"] },
      { description: "Forces act in opposite directions", marks: 1, keywords: ["opposite direction"], alternatives: ["equal and opposite", "opposite forces"] },
      { description: "Relevant example correctly explained", marks: 1, keywords: ["swimmer", "rocket", "recoil"], alternatives: ["pushes backward and moves forward", "walking pushes ground"] },
    ],
    concepts: [
      { name: "Paired forces", alternatives: ["action and reaction", "two bodies"] },
      { name: "Equal magnitude", alternatives: ["same size", "equal force"] },
      { name: "Opposite direction", alternatives: ["opposite forces"] },
      { name: "Everyday example", alternatives: ["swimmer", "rocket", "walking"] },
    ],
  },
  {
    question: "Outline the stages of the water cycle and explain the role of the Sun.",
    subject: "Geography",
    marks: 4,
    difficulty: "Easy",
    questionType: "Explanation",
    timeAllowed: 6,
    referenceAnswer:
      "The Sun heats water and drives evaporation. Water vapor cools and condenses into clouds, then returns as precipitation. Water collects in rivers and oceans, where the cycle repeats.",
    markingScheme: [
      { description: "Sun provides energy for evaporation", marks: 1, keywords: ["sun", "evaporation"], alternatives: ["solar heat evaporates water"] },
      { description: "Vapor condenses into clouds", marks: 1, keywords: ["condensation", "cloud"], alternatives: ["water vapor cools"] },
      { description: "Precipitation returns water", marks: 1, keywords: ["precipitation"], alternatives: ["rainfall", "snow falls"] },
      { description: "Collection and repetition", marks: 1, keywords: ["collection", "cycle"], alternatives: ["water gathers in oceans", "cycle repeats"] },
    ],
    concepts: [
      { name: "Evaporation", alternatives: ["sun heats water"] },
      { name: "Condensation", alternatives: ["cloud formation"] },
      { name: "Precipitation", alternatives: ["rainfall"] },
      { name: "Collection", alternatives: ["runoff", "oceans"] },
    ],
  },
];

const benchmarkTexts = [
  {
    name: "Benchmark 01",
    answer:
      "The central bank issues currency, acts as the government's banker and adviser, is the banker's bank and lender of last resort, controls credit through monetary policy, and manages foreign exchange reserves to maintain financial stability.",
    teacherScore: 5,
  },
  {
    name: "Benchmark 02",
    answer:
      "It issues currency, manages government accounts, supports commercial banks as their lender of last resort, and uses monetary policy to regulate credit.",
    teacherScore: 4,
  },
  {
    name: "Benchmark 03",
    answer:
      "Issues currency; banks for government; supports commercial banks; controls credit; manages foreign reserves.",
    teacherScore: 5,
  },
  {
    name: "Benchmark 04",
    answer:
      "A central bank issues currency and notes. It advises government and runs its accounts. It is the bankers' bank and can provide funds as lender of last resort. It changes interest rates and uses monetary policy to control the money supply. It also manages foreign reserves, protects financial stability and supports the national currency during external shocks. These tasks help payments and economic policy work smoothly.",
    teacherScore: 5,
  },
  {
    name: "Benchmark 05",
    answer:
      "The central bank is important to the national economy. Companies sell shares on the stock market, consumers buy products, factories hire workers, and trade changes GDP. Weather and sporting events can also influence people's spending habits.",
    teacherScore: 0,
  },
  {
    name: "Benchmark 06",
    answer: "It prints currency.",
    teacherScore: 1,
  },
  {
    name: "Benchmark 07",
    answer:
      "The central bank issues currency. It does not control credit or the money supply, does not support commercial banks, and never manages foreign reserves. Its only job is to set company share prices.",
    teacherScore: 1,
  },
  {
    name: "Benchmark 08",
    answer:
      "It creates the nation's notes, keeps public-sector accounts, lends emergency funds to other banks, adjusts policy rates to regulate lending, and holds reserves of overseas currency.",
    teacherScore: 5,
  },
  {
    name: "Benchmark 09",
    answer:
      "Currency, government's banker, banker's bank, lender of last resort, credit control, monetary policy, foreign exchange reserves.",
    teacherScore: 2,
  },
  {
    name: "Benchmark 10",
    answer:
      "The central bank issues notes, serves as the banker's bank and lender of last resort, and uses monetary policy to control the money supply. It is very important to the economy.",
    teacherScore: 3,
  },
];

const DEMO_FIXTURE_VERSION = 3;
let seedPromise: Promise<void> | undefined;

export function ensureDemoData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select({ id: questionsTable.id }).from(questionsTable).limit(1);
      if (existing.length) {
        const [fixtureVersion] = await db
          .select()
          .from(graderMetaTable)
          .where(eq(graderMetaTable.key, "demo-fixture"));
        if (!fixtureVersion || fixtureVersion.version < DEMO_FIXTURE_VERSION) {
          const centralBankSeed = questions[0];
          const [centralBankQuestion] = await db
            .select()
            .from(questionsTable)
            .where(eq(questionsTable.question, centralBankSeed.question));
          if (centralBankQuestion) {
            await db
              .update(questionsTable)
              .set(centralBankSeed)
              .where(eq(questionsTable.id, centralBankQuestion.id));
            const benchmarkRows = await db
              .select()
              .from(answersTable)
              .where(eq(answersTable.benchmark, true));
            for (const row of benchmarkRows) {
              const grade = evaluateAnswer(
                { ...centralBankQuestion, ...centralBankSeed },
                row.answerText,
              );
              await db
                .update(answersTable)
                .set(grade)
                .where(eq(answersTable.id, row.id));
            }
          }
          await db
            .insert(graderMetaTable)
            .values({ key: "demo-fixture", version: DEMO_FIXTURE_VERSION })
            .onConflictDoUpdate({
              target: graderMetaTable.key,
              set: { version: DEMO_FIXTURE_VERSION },
            });
        }
        return;
      }

      const insertedQuestions = await db
        .insert(questionsTable)
        .values(questions)
        .returning();
      const centralBankQuestion = insertedQuestions.find((item) =>
        item.question.startsWith("Explain five important functions"),
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
          benchmark: true,
        };
      });
      await db.insert(answersTable).values(samples);
      await db.insert(graderMetaTable).values({
        key: "demo-fixture",
        version: DEMO_FIXTURE_VERSION,
      });
    })();
  }
  return seedPromise;
}
