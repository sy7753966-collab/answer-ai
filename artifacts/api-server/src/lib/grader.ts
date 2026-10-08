import type {
  ConceptGroup,
  MarkingPoint,
  PointResult,
  Question,
} from "@workspace/db";

export type GradeResult = {
  wordCount: number;
  aiScore: number;
  keywordCoverage: number;
  conceptCoverage: number;
  relevance: number;
  accuracy: number;
  explanationQuality: number;
  pointResults: PointResult[];
  missingConcepts: string[];
  matchedConcepts: string[];
  incorrectStatements: string[];
  feedback: string;
};

function normalize(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(answer: string, phrase: string): boolean {
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  return ` ${normalize(answer)} `.includes(` ${normalizedPhrase} `);
}

function isNegated(answer: string, terms: string[]): boolean {
  const normalizedAnswer = normalize(answer);
  const negations = [
    "does not",
    "doesnt",
    "never",
    "cannot",
    "cant",
    "is not",
    "isnt",
    "no longer",
  ];
  return terms.some((term) =>
    negations.some((negation) =>
      containsPhrase(normalizedAnswer, `${negation} ${term}`),
    ),
  );
}

function contradictsPoint(answer: string, description: string): boolean {
  const rules: Record<string, string[]> = {
    "Issues currency": [
      "does not issue currency",
      "never issues currency",
      "cannot issue currency",
    ],
    "Banker and adviser to government": [
      "does not manage government accounts",
      "not the government banker",
      "not banker to government",
    ],
    "Banker's bank and lender of last resort": [
      "does not support commercial banks",
      "not a banker's bank",
      "not bankers bank",
      "never lends to banks",
    ],
    "Controls credit through monetary policy": [
      "does not control credit",
      "does not control the money supply",
      "never regulates credit",
    ],
    "Manages reserves and financial stability": [
      "does not manage foreign reserves",
      "never manages foreign reserves",
      "does not hold foreign exchange reserves",
    ],
  };
  return (rules[description] ?? []).some((phrase) =>
    containsPhrase(answer, phrase),
  );
}

function pointTerms(point: MarkingPoint): string[] {
  return [...point.keywords, ...point.alternatives];
}

function conceptTerms(concept: ConceptGroup): string[] {
  return [concept.name, ...concept.alternatives];
}

function hasAnyPhrase(answer: string, terms: string[]): boolean {
  return terms.some((term) => containsPhrase(answer, term));
}

export function evaluateAnswer(
  question: Pick<Question, "marks" | "markingScheme" | "concepts">,
  answerText: string,
): GradeResult {
  const answer = answerText.trim();
  const words = answer.match(/\b[\w'-]+\b/g) ?? [];
  const scheme = question.markingScheme ?? [];
  const concepts = question.concepts ?? [];

  const incorrectStatements: string[] = [];
  const pointResults = scheme.map((point) => {
    const terms = pointTerms(point);
    const matched = hasAnyPhrase(answer, terms);
    const negated =
      isNegated(answer, terms) || contradictsPoint(answer, point.description);
    const awarded = matched && !negated ? point.marks : 0;
    if (matched && negated) {
      incorrectStatements.push(
        `The answer appears to deny the required point: ${point.description}.`,
      );
    }
    return {
      description: point.description,
      marks: point.marks,
      awarded,
      matched: awarded > 0,
      feedback:
        awarded > 0
          ? "Recognized by the rubric."
          : negated
            ? "A contradictory statement was detected."
            : "This marking point was not identified.",
    };
  });

  const matchedConcepts = concepts
    .filter(
      (concept, index) =>
        pointResults[index]?.awarded > 0 ||
        hasAnyPhrase(answer, conceptTerms(concept)),
    )
    .map((concept) => concept.name);
  const missingConcepts = concepts
    .filter((concept) => !matchedConcepts.includes(concept.name))
    .map((concept) => concept.name);

  const canonicalKeywordCount = scheme.reduce(
    (total, point) => total + point.keywords.length,
    0,
  );
  const matchedPointsWithKeywords = scheme.filter((point) =>
    hasAnyPhrase(answer, pointTerms(point)),
  ).length;
  const keywordCoverage = canonicalKeywordCount
    ? Math.round(
        (matchedPointsWithKeywords / Math.max(scheme.length, 1)) * 100,
      )
    : 0;

  const possibleMarks = scheme.reduce((sum, point) => sum + point.marks, 0);
  const awardedMarks = pointResults.reduce(
    (sum, point) => sum + point.awarded,
    0,
  );
  const conceptCoverage = possibleMarks
    ? Math.round((awardedMarks / possibleMarks) * 100)
    : 0;
  const aiScore = Math.min(question.marks, awardedMarks);
  const contradictionCount = incorrectStatements.length;
  const accuracy = Math.max(0, 100 - contradictionCount * 25);
  const relevance = words.length
    ? Math.min(100, Math.max(25, Math.round((matchedConcepts.length / Math.max(concepts.length, 1)) * 100)))
    : 0;
  const explanationQuality =
    words.length === 0
      ? 0
      : Math.min(100, Math.max(35, Math.round(conceptCoverage * 0.8 + Math.min(words.length, 40) * 0.5)));

  const earnedDescriptions = pointResults
    .filter((point) => point.awarded > 0)
    .map((point) => point.description);
  const missedDescriptions = pointResults
    .filter((point) => point.awarded === 0)
    .map((point) => point.description);
  const feedback =
    missedDescriptions.length === 0 && contradictionCount === 0
      ? "All rubric points were identified. Concise answers receive full credit when they include the required concepts."
      : [
          earnedDescriptions.length
            ? `Credit awarded for: ${earnedDescriptions.join(", ")}.`
            : "No official marking points were identified.",
          missedDescriptions.length
            ? `Still needed: ${missedDescriptions.join(", ")}.`
            : "",
          contradictionCount
            ? "Review the contradictory claim flagged below."
            : "",
        ]
          .filter(Boolean)
          .join(" ");

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
    feedback,
  };
}

export function calculateCorrelation(
  first: number[],
  second: number[],
): number {
  if (first.length !== second.length || first.length < 2) return 0;
  const meanFirst = first.reduce((sum, value) => sum + value, 0) / first.length;
  const meanSecond = second.reduce((sum, value) => sum + value, 0) / second.length;
  const numerator = first.reduce(
    (sum, value, index) =>
      sum + (value - meanFirst) * (second[index] - meanSecond),
    0,
  );
  const denominator = Math.sqrt(
    first.reduce((sum, value) => sum + (value - meanFirst) ** 2, 0) *
      second.reduce((sum, value) => sum + (value - meanSecond) ** 2, 0),
  );
  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(2));
}
