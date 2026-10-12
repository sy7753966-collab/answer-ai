import type { Answer, Question, QuestionSeed } from "@workspace/db";

export class MemoryStore {
  private questions: Question[] = [];
  private answers: Answer[] = [];
  private nextQuestionId = 1;
  private nextAnswerId = 1;
  private seeded = false;

  public isSeeded(): boolean {
    return this.seeded;
  }

  public setSeeded(val: boolean): void {
    this.seeded = val;
  }

  public getQuestions(): Question[] {
    return [...this.questions].sort((a, b) => a.id - b.id);
  }

  public getQuestion(id: number): Question | undefined {
    return this.questions.find((q) => q.id === id);
  }

  public addQuestion(
    data: Omit<Question, "id" | "createdAt">,
  ): Question {
    const question: Question = {
      ...data,
      id: this.nextQuestionId++,
      createdAt: new Date(),
    };
    this.questions.push(question);
    return question;
  }

  public updateQuestion(
    id: number,
    data: Partial<Omit<Question, "id" | "createdAt">>,
  ): Question | undefined {
    const idx = this.questions.findIndex((q) => q.id === id);
    if (idx === -1) return undefined;
    const updated: Question = {
      ...this.questions[idx],
      ...data,
    };
    this.questions[idx] = updated;
    return updated;
  }

  public deleteQuestion(id: number): boolean {
    const prevLen = this.questions.length;
    this.questions = this.questions.filter((q) => q.id !== id);
    this.answers = this.answers.filter((a) => a.questionId !== id);
    return this.questions.length < prevLen;
  }

  public getAnswers(questionId?: number): Answer[] {
    const list = questionId
      ? this.answers.filter((a) => a.questionId === questionId)
      : this.answers;
    return [...list].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id - b.id,
    );
  }

  public getAnswer(id: number): Answer | undefined {
    return this.answers.find((a) => a.id === id);
  }

  public addAnswer(
    data: Omit<Answer, "id" | "createdAt">,
  ): Answer {
    const answer: Answer = {
      ...data,
      id: this.nextAnswerId++,
      createdAt: new Date(),
    };
    this.answers.push(answer);
    return answer;
  }

  public updateTeacherScore(
    id: number,
    teacherScore: number,
  ): Answer | undefined {
    const answer = this.getAnswer(id);
    if (!answer) return undefined;
    answer.teacherScore = teacherScore;
    return { ...answer };
  }

  public seed(
    questionSeeds: Omit<Question, "id" | "createdAt">[],
    answerSeeds: (Omit<Answer, "id" | "createdAt"> & { questionIndex?: number })[],
  ): void {
    if (this.questions.length === 0) {
      for (const q of questionSeeds) {
        this.addQuestion(q);
      }
    }
    if (this.answers.length === 0) {
      for (const a of answerSeeds) {
        const targetQ = a.questionId
          ? this.getQuestion(a.questionId)
          : this.questions[a.questionIndex ?? 0];
        if (targetQ) {
          this.addAnswer({
            ...a,
            questionId: targetQ.id,
          });
        }
      }
    }
    this.seeded = true;
  }
}

export const memoryStore = new MemoryStore();
