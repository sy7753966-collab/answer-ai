import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  getGetAnswerQueryKey, getGetDashboardQueryKey, getGetFairnessAnalyticsQueryKey,
  getGetQuestionQueryKey, getListAnswersQueryKey, getListQuestionsQueryKey,
  useCreateAnswer, useCreateQuestion, useDeleteQuestion, useGetAnswer,
  useGetDashboard, useGetFairnessAnalytics, useGetQuestion, useListAnswers,
  useListQuestions, useUpdateQuestion, useUpdateTeacherScore,
} from '@workspace/api-client-react';
import type { Answer, Question, QuestionInput } from '@workspace/api-client-react';
import {
  Activity, ArrowRight, BarChart3, BookOpen,
  Check, CircleHelp, ClipboardCheck, Download, FileText, Filter,
  Gauge, GraduationCap, LayoutDashboard, Menu, Plus, Search, Settings2, ShieldCheck,
  SlidersHorizontal, Trash2, X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 20_000, retry: 1 } } });

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/questions', label: 'Question bank', icon: BookOpen },
  { href: '/answers', label: 'Evaluations', icon: ClipboardCheck },
  { href: '/fairness', label: 'Fairness lab', icon: BarChart3 },
];
const teacherItems = [
  { href: '/teacher', label: 'Rubric studio', icon: SlidersHorizontal },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/settings', label: 'Scoring method', icon: Settings2 },
];

function Shell({ children }: { children: React.ReactNode }) {
  const [path] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = [...navItems, ...teacherItems].find((n) => n.href === path);
  const nav = (items: typeof navItems) => items.map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href} className={`nav-link ${path === href ? 'active' : ''}`} onClick={() => setMenuOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <Icon /><span>{label}</span>
    </Link>
  ));
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark">a</div><div><div className="brand-name">AI Answer Grader</div><div className="brand-sub">Assessment workspace</div></div></div>
      <div className="nav-label">Workspace</div>{nav(navItems)}
      <div className="nav-label">Teaching tools</div>{nav(teacherItems)}
      <div className="side-bottom"><div className="profile"><div className="avatar">MS</div><div><div className="profile-name">Morgan Shaw</div><div className="profile-role">Humanities department</div></div></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="top-tools">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={17}/></button>
          <div className="crumb">Workspace <span style={{ padding: '0 7px', opacity: .5 }}>/</span><strong>{current?.label ?? (path.startsWith('/attempt') ? 'Answer attempt' : path.startsWith('/answers/') ? 'Answer detail' : 'Workspace')}</strong></div>
        </div>
        <div className="top-tools"><div className="engine-pill"><span className="engine-dot"/><span>RULES ENGINE · EXPLAINABLE</span></div><Link href="/settings" className="icon-button" title="Scoring method"><CircleHelp size={16}/></Link></div>
      </header>
      <div className="content animate-in">{children}</div>
    </main>
  </div>;
}

function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>{action}</div>;
}
function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return <div className="panel" aria-label="Loading"><div className="panel-head"><div className="skeleton" style={{ width: 160 }}/></div><div style={{ padding: '0 22px 20px' }}>{Array.from({ length: rows }, (_, i) => <div className="skeleton" key={i} style={{ width: `${88 - i * 7}%` }}/>)}</div></div>;
}
function QueryError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="panel error-state"><div className="empty-mark"><Activity size={18}/></div><strong style={{ color: 'hsl(var(--foreground))' }}>We couldn't load this view</strong><p style={{ margin: '7px 0 14px' }}>{message}</p><button className="btn" onClick={retry}>Try again</button></div>;
}
function Empty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-mark"><BookOpen size={18}/></div><strong style={{ color: 'hsl(var(--foreground))', display: 'block', marginBottom: 6 }}>{title}</strong><div style={{ marginBottom: action ? 15 : 0 }}>{detail}</div>{action}</div>;
}
function pct(n?: number | null) { return n == null || Number.isNaN(Number(n)) ? '—' : `${Math.round(Number(n) * (Number(n) <= 1 ? 100 : 1))}%`; }
function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}
function scoreText(score?: number | null, max?: number) { return score == null ? '—' : `${Number(score).toFixed(score % 1 ? 1 : 0)}${max ? ` / ${max}` : ''}`; }
function asDate(value?: string) { return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'; }
function metric(label: string, value: string | number, foot: string) { return <div className="panel metric" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-foot">{foot}</div></div>; }

function AnswerTable({ answers, questions }: { answers: Answer[]; questions: Question[] }) {
  if (!answers.length) return <Empty title="No evaluations yet" detail="Submitted answers will appear here with their rubric breakdown." />;
  const byId = new Map(questions.map((q) => [q.id, q]));
  return <div className="table-wrap"><table><thead><tr><th>Student</th><th>Question</th><th>Rule score</th><th>Teacher</th><th>Evaluation</th><th>Date</th><th/></tr></thead><tbody>
    {answers.map((a) => <tr key={a.id} data-testid={`row-answer-${a.id}`}>
      <td><div className="student-cell">{a.studentName}</div><div className="sub-cell">{a.wordCount} words</div></td>
      <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>{byId.get(a.questionId)?.question ?? `Question #${a.questionId}`}</td>
      <td className="score">{scoreText(a.aiScore, byId.get(a.questionId)?.marks)}</td>
      <td className="score">{a.teacherScore == null ? <span style={{ color: '#958e7e' }}>Pending</span> : scoreText(a.teacherScore)}</td>
      <td><span className={`tag ${a.teacherScore == null ? 'tag-warm' : ''}`}>{a.teacherScore == null ? 'Awaiting review' : `Gap ${scoreText(a.absoluteGap)}`}</span></td>
      <td>{asDate(a.createdAt)}</td><td><Link className="btn btn-quiet" href={`/answers/${a.id}`} aria-label={`View answer ${a.id}`}><ArrowRight size={15}/></Link></td>
    </tr>)}
  </tbody></table></div>;
}

function Dashboard() {
  const dashboard = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const questionsQuery = useListQuestions({ query: { queryKey: getListQuestionsQueryKey() } });
  const d = dashboard.data;
  const questions = questionsQuery.data ?? [];
  if (dashboard.isLoading || questionsQuery.isLoading) return <><PageHeading eyebrow="Classroom pulse" title="Overview" subtitle="A clear view of assessment quality, submissions, and where to look next."/><div className="metrics">{[1,2,3,4].map((x) => <div className="panel metric" key={x}><div className="skeleton"/><div className="skeleton" style={{ height: 30 }}/></div>)}</div><LoadingBlock/></>;
  if (dashboard.isError) return <><PageHeading eyebrow="Classroom pulse" title="Overview" subtitle="A clear view of assessment quality, submissions, and where to look next."/><QueryError message="Dashboard data is temporarily unavailable." retry={() => dashboard.refetch()}/></>;
  const answers = d?.recentAnswers ?? [];
  return <>
    <PageHeading eyebrow="Classroom pulse · today" title="Assessment overview" subtitle="A transparent read on student work and scoring consistency." action={<Link className="btn btn-primary" href="/questions"><Plus size={15}/>Start an assessment</Link>}/>
    <div className="notice" style={{ marginBottom: 17 }}><ShieldCheck size={16}/><span><strong>Rule-based grading, fully traceable.</strong> Scores come from teacher-authored marking points and concept matches—not a generative model. Every award has a reason.</span></div>
    <div className="metrics">
      {metric('Questions in bank', d?.totalQuestions ?? questions.length, `${d?.attemptedQuestions ?? 0} with submissions`)}
      {metric('Answers evaluated', d?.totalAnswers ?? 0, 'Across all active questions')}
      {metric('Mean awarded', `${Number(d?.averageAiScore ?? 0).toFixed(1)}`, `Teacher mean ${Number(d?.averageTeacherScore ?? 0).toFixed(1)}`)}
      {metric('Score agreement', pct(d?.agreementPercent), `Mean score gap ${Number(d?.averageGap ?? 0).toFixed(1)} points`)}
    </div>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Recent evaluations</h2><p className="panel-note">Latest work scored against your rubric</p></div><Link href="/answers" className="btn btn-quiet">All evaluations <ArrowRight size={14}/></Link></div>
        {answers.length ? <AnswerTable answers={answers.slice(0, 6)} questions={questions}/> : <Empty title="No answers to review" detail="When students submit an answer, its evaluation will show here." action={<Link href="/questions" className="btn btn-primary">Browse questions</Link>}/>}
      </section>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Evidence coverage</h2><p className="panel-note">What the rules engine can verify</p></div><Gauge size={17} color="#4a8270"/></div>
          <div className="coverage-list"><div className="coverage-row"><div className="coverage-top"><span>Marking keywords</span><strong>{pct(d?.keywordCoverage)}</strong></div><div className="coverage-track"><div className="coverage-fill" style={{ width: pct(d?.keywordCoverage) }}/></div></div>
            <div className="coverage-row"><div className="coverage-top"><span>Concept coverage</span><strong>{pct(d?.conceptCoverage)}</strong></div><div className="coverage-track"><div className="coverage-fill" style={{ width: pct(d?.conceptCoverage) }}/></div></div></div>
        </section>
        <section className="panel" style={{ padding: 19 }}><div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}><div className="empty-mark" style={{ margin: 0, flex: 'none' }}><GraduationCap size={18}/></div><div><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Teacher remains in control</div><div style={{ fontSize: 11, lineHeight: 1.6, color: 'hsl(var(--muted-foreground))' }}>Add a teacher score to any evaluation. Score differences inform fairness analysis; they never silently alter a student's result.</div><Link href="/fairness" className="btn btn-quiet" style={{ paddingLeft: 0, marginTop: 8 }}>Explore fairness <ArrowRight size={14}/></Link></div></div></section>
      </div>
    </div>
  </>;
}

function QuestionBank({ management = false }: { management?: boolean }) {
  const queryClient = useQueryClient();
  const q = useListQuestions({ query: { queryKey: getListQuestionsQueryKey() } });
  const remove = useDeleteQuestion();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [editor, setEditor] = useState<Question | 'new' | null>(null);
  const questions = q.data ?? [];
  const subjects = [...new Set(questions.map((item) => item.subject))].sort();
  const filtered = useMemo(() => questions.filter((item) =>
    `${item.question} ${item.subject}`.toLowerCase().includes(search.toLowerCase()) &&
    (subject === 'all' || item.subject === subject) &&
    (difficulty === 'all' || item.difficulty.toLowerCase() === difficulty)
  ), [questions, search, subject, difficulty]);
  const onDelete = (item: Question) => {
    if (window.confirm(`Delete this question and its rubric? This action cannot be undone.`)) {
      remove.mutate({ id: item.id }, { onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetQuestionQueryKey(item.id) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      } });
    }
  };
  return <>
    <PageHeading eyebrow={management ? 'Teacher tools · rubric studio' : 'Assessment library'} title={management ? 'Rubric studio' : 'Question bank'} subtitle={management ? 'Build precise, inspectable marking rules. Each point is visible to students after submission.' : 'Choose a question, see its marking basis, and start an answer attempt.'} action={management ? <button className="btn btn-primary" onClick={() => setEditor('new')}><Plus size={15}/>New question</button> : undefined}/>
    {!management && <div className="notice" style={{ marginBottom: 18 }}><ShieldCheck size={16}/><span>Every question is graded against its saved rubric with explicit keyword, concept, and point-level evidence.</span></div>}
    <div className="toolbar">
      <label style={{ position: 'relative' }}><Search size={15} style={{ position: 'absolute', left: 11, top: 11, color: '#80877e' }}/><input className="field search-field" style={{ paddingLeft: 34 }} placeholder="Search questions or subjects" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-question-search"/></label>
      <select className="select" aria-label="Filter subject" value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="select-question-subject"><option value="all">All subjects</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select>
      <select className="select" aria-label="Filter difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} data-testid="select-question-difficulty"><option value="all">All difficulty</option>{['easy','medium','hard'].map((x) => <option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</select>
      <span style={{ marginLeft: 'auto', font: '10px var(--app-font-mono)', color: 'hsl(var(--muted-foreground))' }}>{filtered.length} QUESTION{filtered.length === 1 ? '' : 'S'}</span>
    </div>
    {q.isLoading ? <LoadingBlock/> : q.isError ? <QueryError message="Questions couldn't be loaded." retry={() => q.refetch()}/> : !filtered.length ? <section className="panel"><Empty title="No questions match" detail={questions.length ? 'Try another search or clear a filter.' : 'Create a question and define its marking scheme to get started.'} action={management ? <button className="btn btn-primary" onClick={() => setEditor('new')}><Plus size={14}/>Create question</button> : undefined}/></section> :
      <div className="panel table-wrap"><table><thead><tr><th>Question</th><th>Subject</th><th>Level</th><th>Marks</th><th>Attempts</th><th>Average</th><th/></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} data-testid={`row-question-${item.id}`}>
        <td style={{ minWidth: 260, maxWidth: 430, whiteSpace: 'normal' }}><div className="student-cell">{item.question}</div><div className="sub-cell">{item.questionType} · {item.timeAllowed} min</div></td>
        <td><span className="tag tag-muted">{item.subject}</span></td><td>{item.difficulty}</td><td className="score">{item.marks}</td><td>{item.attempts}</td><td className="score">{item.averageScore ? `${item.averageScore.toFixed(1)}` : '—'}</td>
        <td><div style={{ display: 'flex', gap: 5 }}>{management ? <><button className="btn btn-quiet" onClick={() => setEditor(item)}>Edit</button><button className="delete-icon" aria-label={`Delete ${item.question}`} onClick={() => onDelete(item)} disabled={remove.isPending}><Trash2 size={14}/></button></> : <Link className="btn btn-primary" href={`/attempt/${item.id}`}>Attempt <ArrowRight size={13}/></Link>}</div></td>
      </tr>)}</tbody></table></div>}
    {editor && <QuestionEditor initial={editor === 'new' ? null : editor} onClose={() => setEditor(null)}/>}
  </>;
}

type RubricPoint = { description: string; marks: number; keywords: string; alternatives: string };
type Concept = { name: string; alternatives: string };
function QuestionEditor({ initial, onClose }: { initial: Question | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const create = useCreateQuestion();
  const update = useUpdateQuestion();
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [marks, setMarks] = useState(initial?.marks ?? 5);
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 'Medium');
  const [questionType, setQuestionType] = useState(initial?.questionType ?? 'Short answer');
  const [timeAllowed, setTimeAllowed] = useState(initial?.timeAllowed ?? 15);
  const [referenceAnswer, setReferenceAnswer] = useState(initial?.referenceAnswer ?? '');
  const [points, setPoints] = useState<RubricPoint[]>(initial?.markingScheme.map((p) => ({ ...p, keywords: p.keywords.join(', '), alternatives: p.alternatives.join(', ') })) ?? [{ description: '', marks: 1, keywords: '', alternatives: '' }]);
  const [concepts, setConcepts] = useState<Concept[]>(initial?.concepts.map((c) => ({ name: c.name, alternatives: c.alternatives.join(', ') })) ?? [{ name: '', alternatives: '' }]);
  const mutationPending = create.isPending || update.isPending;
  const updatePoint = (idx: number, key: keyof RubricPoint, value: string | number) => setPoints((current) => current.map((p, i) => i === idx ? { ...p, [key]: value } : p));
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const data: QuestionInput = {
      question: question.trim(), subject: subject.trim(), marks: Number(marks), difficulty, questionType, timeAllowed: Number(timeAllowed),
      referenceAnswer: referenceAnswer.trim(),
      markingScheme: points.filter((p) => p.description.trim()).map((p) => ({ description: p.description.trim(), marks: Number(p.marks), keywords: p.keywords.split(',').map((s) => s.trim()).filter(Boolean), alternatives: p.alternatives.split(',').map((s) => s.trim()).filter(Boolean) })),
      concepts: concepts.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), alternatives: c.alternatives.split(',').map((s) => s.trim()).filter(Boolean) })),
    };
    const done = () => { queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); if (initial) queryClient.invalidateQueries({ queryKey: getGetQuestionQueryKey(initial.id) }); onClose(); };
    if (initial) update.mutate({ id: initial.id, data }, { onSuccess: done });
    else create.mutate({ data }, { onSuccess: done });
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <form className="modal" onSubmit={save}>
      <div className="modal-head"><div><div className="eyebrow">Rubric studio</div><h2 className="panel-title" style={{ fontSize: 21 }}>{initial ? 'Edit question' : 'Create a question'}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={16}/></button></div>
      <div className="modal-body">
        <div className="form-grid">
          <div className="form-field full"><label className="form-label">Question prompt</label><textarea className="textarea" value={question} onChange={(e) => setQuestion(e.target.value)} required minLength={1} data-testid="input-question-prompt" placeholder="Write the question students will answer"/></div>
          <div className="form-field"><label className="form-label">Subject</label><input className="field" style={{ width: '100%' }} value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="e.g. Biology"/></div>
          <div className="form-field"><label className="form-label">Question type</label><input className="field" style={{ width: '100%' }} value={questionType} onChange={(e) => setQuestionType(e.target.value)} required/></div>
          <div className="form-field"><label className="form-label">Total marks</label><input className="field" style={{ width: '100%' }} type="number" min="1" value={marks} onChange={(e) => setMarks(Number(e.target.value))} required/></div>
          <div className="form-field"><label className="form-label">Time allowed · minutes</label><input className="field" style={{ width: '100%' }} type="number" min="1" value={timeAllowed} onChange={(e) => setTimeAllowed(Number(e.target.value))} required/></div>
          <div className="form-field"><label className="form-label">Difficulty</label><select className="select" style={{ width: '100%' }} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
          <div className="form-field full"><label className="form-label">Reference answer</label><textarea className="textarea" value={referenceAnswer} onChange={(e) => setReferenceAnswer(e.target.value)} placeholder="An exemplar, used as a guide for rule design."/></div>
          <div className="form-field full"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><div><label className="form-label" style={{ marginBottom: 3 }}>Marking points</label><div className="form-help">Points are matched explicitly against answer evidence.</div></div><button className="btn" type="button" onClick={() => setPoints((all) => [...all, { description: '', marks: 1, keywords: '', alternatives: '' }])}><Plus size={13}/>Add point</button></div>
            <div className="scheme-editor">{points.map((p, i) => <div className="scheme-item" key={i}><textarea className="textarea" value={p.description} onChange={(e) => updatePoint(i, 'description', e.target.value)} placeholder="What earns these marks?"/><input className="field" type="number" min="1" value={p.marks} onChange={(e) => updatePoint(i, 'marks', Number(e.target.value))} aria-label={`Marks for point ${i+1}`}/><button className="delete-icon" type="button" aria-label="Remove marking point" onClick={() => setPoints((all) => all.filter((_, ix) => ix !== i))}><Trash2 size={14}/></button><div className="scheme-bottom"><input className="field" value={p.keywords} onChange={(e) => updatePoint(i, 'keywords', e.target.value)} placeholder="Keywords, comma separated"/><input className="field" value={p.alternatives} onChange={(e) => updatePoint(i, 'alternatives', e.target.value)} placeholder="Accepted alternatives"/></div></div>)}</div>
          </div>
          <div className="form-field full"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><div><label className="form-label" style={{ marginBottom: 3 }}>Concept groups</label><div className="form-help">Related phrases count as the same concept.</div></div><button className="btn" type="button" onClick={() => setConcepts((all) => [...all, { name: '', alternatives: '' }])}><Plus size={13}/>Add concept</button></div>
            <div className="scheme-editor">{concepts.map((c, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: 8 }}><input className="field" value={c.name} onChange={(e) => setConcepts((all) => all.map((x, ix) => ix === i ? { ...x, name: e.target.value } : x))} placeholder="Concept name"/><input className="field" value={c.alternatives} onChange={(e) => setConcepts((all) => all.map((x, ix) => ix === i ? { ...x, alternatives: e.target.value } : x))} placeholder="Synonyms, comma separated"/><button className="delete-icon" type="button" aria-label="Remove concept" onClick={() => setConcepts((all) => all.filter((_, ix) => ix !== i))}><Trash2 size={14}/></button></div>)}</div>
          </div>
        </div>
        {(create.isError || update.isError) && <p style={{ color: '#a43c36', fontSize: 11, margin: '15px 0 0' }}>Unable to save this question. Check the fields and try again.</p>}
      </div>
      <div className="modal-footer"><button className="btn" type="button" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" disabled={mutationPending}>{mutationPending ? 'Saving…' : initial ? 'Save changes' : 'Create question'}</button></div>
    </form>
  </div>;
}

function Attempt() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = Number(rawId);
  const queryClient = useQueryClient();
  const questionQuery = useGetQuestion(id, { query: { queryKey: getGetQuestionQueryKey(id), enabled: Number.isFinite(id) && id > 0 } });
  const submitAnswer = useCreateAnswer();
  const [name, setName] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState<Answer | null>(null);
  const question = questionQuery.data;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    submitAnswer.mutate({ data: { questionId: question.id, studentName: name.trim(), answerText: answer.trim() } }, { onSuccess: (result) => {
      setSubmitted(result);
      queryClient.invalidateQueries({ queryKey: getListAnswersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFairnessAnalyticsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
    } });
  };
  if (questionQuery.isLoading) return <><PageHeading eyebrow="Student workspace" title="Answer attempt" subtitle="Loading question and rubric…"/><LoadingBlock rows={5}/></>;
  if (questionQuery.isError || !question) return <><PageHeading eyebrow="Student workspace" title="Question unavailable" subtitle="We couldn't find that question."/><QueryError message="Question details could not be loaded." retry={() => questionQuery.refetch()}/></>;
  if (submitted) return <><PageHeading eyebrow="Submission complete" title="Your answer is evaluated" subtitle="Your result is based on the visible marking rules below." action={<Link href={`/answers/${submitted.id}`} className="btn btn-primary">Open full evaluation <ArrowRight size={14}/></Link>}/>
    <div className="detail-grid"><section className="panel"><div className="panel-head"><div><h2 className="panel-title">Point-by-point result</h2><p className="panel-note">Each award is tied to a rubric criterion</p></div></div><div style={{ padding: '0 22px 20px' }}>{submitted.pointResults?.map((point, i) => <div className="point-row" key={i}><div><div className="point-description">{point.description}</div><div className="point-feedback">{point.feedback}</div></div><div className="point-mark">{point.awarded} / {point.marks}</div></div>)}</div></section>
      <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Score summary</h2><p className="panel-note">A rules-based assessment, not a model opinion</p></div></div><div className="score-hero"><div><div className="score-big">{scoreText(submitted.aiScore, question.marks)}</div><div className="score-label">MARKS AWARDED</div></div><Check size={25} color="#4a8270"/></div><div style={{ padding: '0 22px 22px', fontSize: 11, lineHeight: 1.65, color: 'hsl(var(--muted-foreground))' }}>{submitted.feedback}</div></section></div>
  </>;
  return <>
    <PageHeading eyebrow={`${question.subject} · ${question.difficulty}`} title="Write your answer" subtitle={`Question ${question.id} · ${question.marks} marks · ${question.timeAllowed} minutes`}/>
    <div className="detail-grid">
      <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Question prompt</h2><p className="panel-note">{question.questionType} · {question.marks} marks available</p></div><span className="tag tag-muted">{question.timeAllowed} min</span></div><div style={{ padding: '3px 22px 20px', font: '500 21px/1.45 var(--app-font-serif)' }}>{question.question}</div>
        <div style={{ padding: '16px 22px 20px', borderTop: '1px solid hsl(var(--border))' }}><div style={{ fontSize: 10, fontFamily: 'var(--app-font-mono)', color: 'hsl(var(--muted-foreground))', letterSpacing: '.1em', marginBottom: 10 }}>WHAT YOUR MARKER LOOKS FOR</div>{question.markingScheme.map((p, i) => <div key={i} style={{ display: 'flex', gap: 10, fontSize: 11, margin: '9px 0' }}><span className="tag tag-muted">{p.marks} pt</span><span>{p.description}</span></div>)}</div>
      </section>
      <form className="panel" onSubmit={submit}><div className="panel-head"><div><h2 className="panel-title">Submit your response</h2><p className="panel-note">Your answer is checked against the rubric above.</p></div></div><div style={{ padding: '0 22px 22px' }}><label className="form-label">Your name</label><input className="field" style={{ width: '100%', marginBottom: 15 }} value={name} onChange={(e) => setName(e.target.value)} required placeholder="First and last name" data-testid="input-student-name"/><label className="form-label">Answer</label><textarea className="textarea" style={{ width: '100%', minHeight: 230 }} value={answer} onChange={(e) => setAnswer(e.target.value)} required placeholder="Make your reasoning clear. The marking rules look for explicit evidence." data-testid="input-answer-text"/><div className="form-help" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span><span>Submitted text is evaluated by the published rules</span></div>{submitAnswer.isError && <p style={{ color: '#a43c36', fontSize: 11, marginTop: 12 }}>Submission failed. Please try again.</p>}<button className="btn btn-primary" style={{ width: '100%', marginTop: 17 }} disabled={submitAnswer.isPending}>{submitAnswer.isPending ? 'Checking your answer…' : 'Submit for evaluation'} <ArrowRight size={14}/></button></div></form>
    </div>
  </>;
}

function Answers() {
  const qs = useListQuestions({ query: { queryKey: getListQuestionsQueryKey() } });
  const as = useListAnswers(undefined, { query: { queryKey: getListAnswersQueryKey() } });
  const [question, setQuestion] = useState('all');
  const answers = as.data ?? [];
  const filtered = question === 'all' ? answers : answers.filter((a) => a.questionId === Number(question));
  return <>
    <PageHeading eyebrow="Marking record" title="Evaluations" subtitle="Review each answer's point awards, evidence, and teacher comparison." action={<Link href="/questions" className="btn btn-primary"><BookOpen size={14}/>Browse questions</Link>}/>
    <div className="toolbar"><div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'hsl(var(--muted-foreground))' }}><Filter size={14}/>Filter by question</div><select className="select" value={question} onChange={(e) => setQuestion(e.target.value)} data-testid="select-answer-question"><option value="all">Every question</option>{(qs.data ?? []).map((q) => <option value={q.id} key={q.id}>{q.subject}: {q.question.slice(0, 65)}</option>)}</select><span style={{ marginLeft: 'auto', font: '10px var(--app-font-mono)', color: 'hsl(var(--muted-foreground))' }}>{filtered.length} EVALUATIONS</span></div>
    <section className="panel">{as.isLoading || qs.isLoading ? <LoadingBlock/> : as.isError ? <QueryError message="Evaluation records could not be loaded." retry={() => as.refetch()}/> : <AnswerTable answers={filtered} questions={qs.data ?? []}/>}</section>
  </>;
}

function AnswerDetail() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = Number(rawId);
  const queryClient = useQueryClient();
  const answerQuery = useGetAnswer(id, { query: { queryKey: getGetAnswerQueryKey(id), enabled: Number.isFinite(id) && id > 0 } });
  const questionQuery = useListQuestions({ query: { queryKey: getListQuestionsQueryKey() } });
  const scoreMutation = useUpdateTeacherScore();
  const [score, setScore] = useState('');
  const item = answerQuery.data;
  const question = questionQuery.data?.find((q) => q.id === item?.questionId);
  const saveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || score === '') return;
    scoreMutation.mutate({ id: item.id, data: { teacherScore: Number(score) } }, { onSuccess: (updated) => {
      queryClient.setQueryData(getGetAnswerQueryKey(item.id), updated);
      queryClient.invalidateQueries({ queryKey: getListAnswersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFairnessAnalyticsQueryKey() });
    } });
  };
  if (answerQuery.isLoading) return <><PageHeading eyebrow="Evaluation detail" title="Answer detail" subtitle="Loading evidence…"/><LoadingBlock rows={5}/></>;
  if (answerQuery.isError || !item) return <><PageHeading eyebrow="Evaluation detail" title="Answer unavailable" subtitle="This evaluation could not be loaded."/><QueryError message="Evaluation data is temporarily unavailable." retry={() => answerQuery.refetch()}/></>;
  const ratio = question?.marks ? `${item.aiScore} / ${question.marks}` : String(item.aiScore);
  const indicators = [['Keyword coverage', item.keywordCoverage], ['Concept coverage', item.conceptCoverage], ['Relevance', item.relevance], ['Accuracy', item.accuracy], ['Explanation quality', item.explanationQuality]] as const;
  return <>
    <PageHeading eyebrow={`${item.studentName} · ${asDate(item.createdAt)}`} title="Evaluation detail" subtitle={question?.question ?? `Question #${item.questionId}`} action={<Link href="/answers" className="btn"><ArrowRight size={14} style={{ transform: 'rotate(180deg)' }}/>Back to evaluations</Link>}/>
    <div className="detail-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Rubric breakdown</h2><p className="panel-note">The exact marking points that determined this result</p></div><span className="tag">{ratio} marks</span></div>
          <div style={{ padding: '0 22px 18px' }}>{item.pointResults?.length ? item.pointResults.map((point, i) => <div className="point-row" key={`${point.description}-${i}`}><div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className={`tag ${point.matched ? '' : 'tag-warm'}`}>{point.matched ? 'Matched' : 'Not matched'}</span><span className="point-description">{point.description}</span></div><div className="point-feedback">{point.feedback}</div></div><div className="point-mark">{point.awarded} / {point.marks}</div></div>) : <Empty title="No point detail returned" detail="This answer has no point-level evidence to display."/>}</div>
        </section>
        <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Student response</h2><p className="panel-note">{item.wordCount} words · submitted {new Date(item.createdAt).toLocaleString()}</p></div></div><div style={{ padding: '0 22px 22px' }}><div className="answer-copy">{item.answerText}</div></div></section>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Scoring evidence</h2><p className="panel-note">Deterministic indicators from the rules engine</p></div><ShieldCheck size={16} color="#4a8270"/></div><div className="coverage-list">{indicators.map(([label, value]) => <div className="coverage-row" key={label}><div className="coverage-top"><span>{label}</span><strong>{pct(value)}</strong></div><div className="coverage-track"><div className="coverage-fill" style={{ width: pct(value) }}/></div></div>)}</div>
          <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '16px 22px 20px' }}><div style={{ fontSize: 10, fontFamily: 'var(--app-font-mono)', letterSpacing: '.08em', marginBottom: 8 }}>RULE ENGINE EXPLANATION</div><div style={{ fontSize: 11, lineHeight: 1.7, color: 'hsl(var(--muted-foreground))' }}>{item.feedback || 'No additional feedback provided.'}</div></div>
        </section>
        <section className="panel" style={{ padding: 20 }}><h2 className="panel-title" style={{ marginBottom: 12 }}>Teacher comparison</h2><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '9px 0', borderBottom: '1px solid hsl(var(--border))' }}><span>Rule score</span><strong className="score">{ratio}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '9px 0' }}><span>Teacher score</span><strong className="score">{item.teacherScore == null ? 'Not recorded' : scoreText(item.teacherScore, question?.marks)}</strong></div>
          <form onSubmit={saveScore} style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 15, marginTop: 7 }}><label className="form-label">Record teacher score {question ? `(0–${question.marks})` : ''}</label><div style={{ display: 'flex', gap: 8 }}><input className="field" style={{ width: 110 }} type="number" min="0" max={question?.marks} step="0.5" required value={score} onChange={(e) => setScore(e.target.value)} placeholder={item.teacherScore == null ? 'Score' : String(item.teacherScore)} data-testid="input-teacher-score"/><button className="btn btn-primary" disabled={scoreMutation.isPending}>{scoreMutation.isPending ? 'Saving…' : 'Save score'}</button></div>{scoreMutation.isError && <div className="form-help" style={{ color: '#a43c36' }}>Score couldn't be saved. Try again.</div>}</form>
        </section>
        <section className="panel" style={{ padding: 20 }}><h2 className="panel-title" style={{ marginBottom: 10 }}>Concept evidence</h2><div className="form-help">Matched concepts</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0 14px' }}>{item.matchedConcepts?.length ? item.matchedConcepts.map((c) => <span className="tag" key={c}>{c}</span>) : <span className="form-help">None matched</span>}</div><div className="form-help">Missing concepts</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{item.missingConcepts?.length ? item.missingConcepts.map((c) => <span className="tag tag-warm" key={c}>{c}</span>) : <span className="form-help">No missing concepts</span>}</div>{Boolean(item.incorrectStatements?.length) && <div style={{ marginTop: 14 }}><div className="form-help">Incorrect statements</div>{item.incorrectStatements.map((x, i) => <div key={i} style={{ fontSize: 11, marginTop: 7, color: '#a34c42' }}>{x}</div>)}</div>}</section>
      </div>
    </div>
  </>;
}

function Fairness() {
  const fair = useGetFairnessAnalytics({ query: { queryKey: getGetFairnessAnalyticsQueryKey() } });
  const questions = useListQuestions({ query: { queryKey: getListQuestionsQueryKey() } });
  const d = fair.data;
  const rows = d?.answers ?? [];
  const paired = rows.filter((a) => a.teacherScore != null);
  const questionById = new Map((questions.data ?? []).map((q) => [q.id, q]));
  const percentageScore = (answer: Answer) => {
    const marks = questionById.get(answer.questionId)?.marks ?? Math.max(1, answer.aiScore);
    return answer.aiScore / marks * 100;
  };
  const distribution = [
    { label: '0–20%', value: rows.filter((a) => percentageScore(a) <= 20).length },
    { label: '21–40%', value: rows.filter((a) => percentageScore(a) > 20 && percentageScore(a) <= 40).length },
    { label: '41–60%', value: rows.filter((a) => percentageScore(a) > 40 && percentageScore(a) <= 60).length },
    { label: '61–80%', value: rows.filter((a) => percentageScore(a) > 60 && percentageScore(a) <= 80).length },
    { label: '81–100%', value: rows.filter((a) => percentageScore(a) > 80).length },
  ];
  const maxValue = Math.max(1, ...distribution.map((x) => x.value));
  return <>
    <PageHeading eyebrow="Evaluation research" title="Fairness lab" subtitle="Compare rule scores with teacher judgments, identify patterns, and inspect the underlying submissions." action={<Link href="/reports" className="btn"><Download size={14}/>Download report</Link>}/>
    <div className="notice" style={{ marginBottom: 17 }}><ShieldCheck size={16}/><span>Analytics describe score relationships in submitted data. They do not rewrite scores or infer protected attributes.</span></div>
    {fair.isLoading ? <LoadingBlock rows={5}/> : fair.isError ? <QueryError message="Fairness analytics are unavailable." retry={() => fair.refetch()}/> : <>
      <div className="metrics">
        {metric('Mean absolute error', `${Number(d?.meanAbsoluteError ?? 0).toFixed(2)}`, 'Points between rule and teacher scores')}
        {metric('Agreement rate', pct(d?.agreementRate), `${paired.length} answers with teacher scores`)}
        {metric('Over / under', `${pct(d?.overestimationRate)} / ${pct(d?.underestimationRate)}`, 'Overestimation / underestimation')}
        {metric('Score correlation', Number(d?.aiTeacherCorrelation ?? 0).toFixed(2), 'Rule scores compared with teacher scores')}
      </div>
      <div className="dashboard-grid" style={{ marginBottom: 16 }}>
        <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Score distribution</h2><p className="panel-note">Rule score bands across {rows.length} submissions</p></div><span className="tag tag-muted">All answers</span></div>
          {rows.length ? <div className="chart-bars">{distribution.map((item) => <div className="chart-col" key={item.label}><div className="chart-value">{item.value}</div><div className="chart-bar-wrap"><div className="chart-bar" style={{ height: `${Math.max(2, item.value / maxValue * 100)}%` }}/></div><div className="chart-label">{item.label}</div></div>)}</div> : <Empty title="No submissions to compare" detail="Score distribution will appear when answers have been evaluated."/>}
          <div style={{ display: 'flex', gap: 22, padding: '15px 22px 18px', fontSize: 10, color: 'hsl(var(--muted-foreground))' }}><span>Rule / teacher correlation by answer length</span><strong style={{ color: 'hsl(var(--foreground))' }}>{Number(d?.wordAiCorrelation ?? 0).toFixed(2)} / {Number(d?.wordTeacherCorrelation ?? 0).toFixed(2)}</strong></div>
        </section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Interpretation</h2><p className="panel-note">Summary of the current evidence</p></div></div><div style={{ padding: '0 21px 20px', fontSize: 12, lineHeight: 1.7 }}>{d?.conclusion || 'More teacher-scored answers are needed before a useful conclusion can be drawn.'}</div></section>
          <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Patterns to inspect</h2><p className="panel-note">Automated flags from score relationships</p></div></div><div style={{ padding: '0 21px 20px' }}>{d?.detectedBiases?.length ? d.detectedBiases.map((bias, i) => <div key={i} style={{ fontSize: 11, padding: '9px 0', borderBottom: '1px solid hsl(var(--border))', lineHeight: 1.5 }}>{bias}</div>) : <div className="form-help">No detected patterns in the available data.</div>}</div></section>
        </div>
      </div>
      <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Teacher-scored submissions</h2><p className="panel-note">Use each row to inspect the score evidence behind a comparison</p></div><span className="tag tag-muted">{paired.length} paired</span></div><AnswerTable answers={paired} questions={questions.data ?? []}/></section>
    </>}
  </>;
}

function Reports() {
  const dashboard = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const answersQuery = useListAnswers(undefined, { query: { queryKey: getListAnswersQueryKey() } });
  const questionsQuery = useListQuestions({ query: { queryKey: getListQuestionsQueryKey() } });
  const fairnessQuery = useGetFairnessAnalytics({ query: { queryKey: getGetFairnessAnalyticsQueryKey() } });
  const questions = questionsQuery.data ?? [];
  const answers = answersQuery.data ?? [];
  const generateCsv = () => {
    const questionById = new Map(questions.map((q) => [q.id, q]));
    const rows = [['student', 'question_id', 'question', 'subject', 'rule_score', 'teacher_score', 'score_gap', 'absolute_gap', 'keyword_coverage', 'concept_coverage', 'relevance', 'accuracy', 'explanation_quality', 'word_count', 'point_results', 'missing_concepts', 'incorrect_statements', 'student_answer', 'feedback', 'benchmark', 'submitted_at']];
    answers.forEach((a) => rows.push([a.studentName, String(a.questionId), questionById.get(a.questionId)?.question ?? '', questionById.get(a.questionId)?.subject ?? '', String(a.aiScore), a.teacherScore == null ? '' : String(a.teacherScore), a.scoreGap == null ? '' : String(a.scoreGap), a.absoluteGap == null ? '' : String(a.absoluteGap), String(a.keywordCoverage), String(a.conceptCoverage), String(a.relevance), String(a.accuracy), String(a.explanationQuality), String(a.wordCount), JSON.stringify(a.pointResults), JSON.stringify(a.missingConcepts), JSON.stringify(a.incorrectStatements), a.answerText, a.feedback, String(a.benchmark), a.createdAt]));
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `ai-answer-grader-data-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  const loading = dashboard.isLoading || answersQuery.isLoading || questionsQuery.isLoading || fairnessQuery.isLoading;
  const generateAcademicReport = () => {
    const fair = fairnessQuery.data;
    if (!fair) return;
    const paired = answers.filter((answer) => answer.teacherScore != null);
    const average = (values: number[]) => values.length
      ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)
      : '0.00';
    const questionStats = questions.map((question) => {
      const related = answers.filter((answer) => answer.questionId === question.id);
      const teacherRated = related.filter((answer) => answer.teacherScore != null);
      return {
        question,
        count: related.length,
        ai: related.length ? related.reduce((sum, item) => sum + item.aiScore, 0) / related.length : 0,
        teacher: teacherRated.length ? teacherRated.reduce((sum, item) => sum + (item.teacherScore ?? 0), 0) / teacherRated.length : 0,
        teacherCount: teacherRated.length,
      };
    });
    const pairedBenchmark = answers.filter((answer) => answer.benchmark && answer.teacherScore != null);
    const sampleQuestion = questions.find((question) => question.id === pairedBenchmark[0]?.questionId);
    const maxWords = Math.max(1, ...pairedBenchmark.map((answer) => answer.wordCount));
    const scatterSvg = (scoreKey: 'aiScore' | 'teacherScore', color: string, title: string) => {
      const maxMarks = Math.max(1, sampleQuestion?.marks ?? 5);
      const plotWidth = 700, plotHeight = 250, left = 48, top = 18;
      const px = (wordCount: number) => left + wordCount / maxWords * plotWidth;
      const py = (score: number) => top + plotHeight - score / maxMarks * plotHeight;
      const scores = pairedBenchmark.map((answer) => scoreKey === 'aiScore' ? answer.aiScore : (answer.teacherScore ?? 0));
      const meanX = pairedBenchmark.length ? pairedBenchmark.reduce((sum, answer) => sum + answer.wordCount, 0) / pairedBenchmark.length : 0;
      const meanY = average(scores) === '0.00' ? 0 : Number(average(scores));
      const denominator = pairedBenchmark.reduce((sum, answer) => sum + (answer.wordCount - meanX) ** 2, 0);
      const slope = denominator ? pairedBenchmark.reduce((sum, answer, index) => sum + (answer.wordCount - meanX) * (scores[index] - meanY), 0) / denominator : 0;
      const intercept = meanY - slope * meanX;
      const startY = Math.max(0, Math.min(maxMarks, intercept));
      const endY = Math.max(0, Math.min(maxMarks, slope * maxWords + intercept));
      const grid = Array.from({ length: maxMarks + 1 }, (_, mark) => `<line x1="${left}" x2="${left + plotWidth}" y1="${py(mark)}" y2="${py(mark)}" stroke="#e6e2da"/><text x="${left - 10}" y="${py(mark) + 4}" text-anchor="end" fill="#6d7773" font-size="11">${mark}</text>`).join('');
      const points = pairedBenchmark.map((answer) => `<circle cx="${px(answer.wordCount)}" cy="${py(scoreKey === 'aiScore' ? answer.aiScore : (answer.teacherScore ?? 0))}" r="5" fill="${color}" fill-opacity=".82"><title>${escapeHtml(answer.studentName)}: ${answer.wordCount} words, ${scoreKey === 'aiScore' ? answer.aiScore : answer.teacherScore}/${maxMarks}</title></circle>`).join('');
      return `<div class="chart-card"><h3>${title}</h3><svg viewBox="0 0 ${left + plotWidth + 12} ${top + plotHeight + 42}" role="img" aria-label="${title}"><rect width="100%" height="100%" fill="white"/>${grid}<line x1="${left}" y1="${top + plotHeight}" x2="${left + plotWidth}" y2="${top + plotHeight}" stroke="#aeb5af"/><line x1="${left}" y1="${top}" x2="${left}" y2="${top + plotHeight}" stroke="#aeb5af"/><line x1="${px(0)}" y1="${py(startY)}" x2="${px(maxWords)}" y2="${py(endY)}" stroke="${color}" stroke-width="2" stroke-dasharray="6 5" opacity=".65"/>${points}<text x="${left + plotWidth / 2}" y="${top + plotHeight + 30}" text-anchor="middle" fill="#68736e" font-size="11">Answer length (words)</text><text x="14" y="${top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 14 ${top + plotHeight / 2})" fill="#68736e" font-size="11">Score (/${maxMarks})</text></svg></div>`;
    };
    const questionRows = questionStats.map(({ question, count, ai, teacher, teacherCount }) => `<tr><td>${escapeHtml(question.subject)} · ${escapeHtml(question.question)}</td><td>${count}</td><td>${ai.toFixed(2)} / ${question.marks}</td><td>${teacherCount ? `${teacher.toFixed(2)} / ${question.marks}` : 'Not scored'}</td></tr>`).join('');
    const questionSections = questions.map((question, index) => `<article class="question"><h3>Question ${index + 1} · ${escapeHtml(question.subject)} · ${question.marks} marks</h3><p><strong>Question:</strong> ${escapeHtml(question.question)}</p><p><strong>Official marking scheme:</strong></p><ol>${question.markingScheme.map((point) => `<li>${escapeHtml(point.description)} — ${point.marks} ${point.marks === 1 ? 'mark' : 'marks'}; keywords: ${escapeHtml(point.keywords.join(', ') || 'none')}; accepted alternatives: ${escapeHtml(point.alternatives.join(', ') || 'none')}</li>`).join('')}</ol><p><strong>Teacher reference answer:</strong> ${escapeHtml(question.referenceAnswer)}</p></article>`).join('');
    const answerSections = answers.map((answer) => {
      const question = questions.find((item) => item.id === answer.questionId);
      return `<article class="answer"><h3>${escapeHtml(answer.studentName)} · ${escapeHtml(question?.subject ?? 'Question')} · ${answer.aiScore}/${question?.marks ?? '—'} rule score</h3><p class="meta">${answer.wordCount} words · AI–teacher gap: ${answer.scoreGap == null ? 'Awaiting teacher score' : `${answer.scoreGap > 0 ? '+' : ''}${answer.scoreGap}`} · ${answer.benchmark ? 'Benchmark answer' : 'Submitted answer'}</p><blockquote>${escapeHtml(answer.answerText)}</blockquote><p><strong>Coverage:</strong> Keywords ${answer.keywordCoverage}% · Concepts ${answer.conceptCoverage}% · Relevance signal ${answer.relevance}% · Contradiction signal ${answer.accuracy}% · Explanation indicator ${answer.explanationQuality}%</p><table><thead><tr><th>Official point</th><th>Marks</th><th>Rule award</th><th>Evidence</th></tr></thead><tbody>${answer.pointResults.map((point) => `<tr><td>${escapeHtml(point.description)}</td><td>${point.marks}</td><td>${point.awarded}</td><td>${escapeHtml(point.feedback)}</td></tr>`).join('')}</tbody></table><p><strong>Recognized concepts:</strong> ${escapeHtml(answer.matchedConcepts.join(', ') || 'None')}</p><p><strong>Missing concepts:</strong> ${escapeHtml(answer.missingConcepts.join(', ') || 'None')}</p>${answer.incorrectStatements.length ? `<p><strong>Recognized contradictions:</strong> ${escapeHtml(answer.incorrectStatements.join(' · '))}</p>` : ''}<p><strong>Rule feedback:</strong> ${escapeHtml(answer.feedback)}</p></article>`;
    }).join('');
    const comparisonRows = paired.map((answer) => `<tr><td>${escapeHtml(answer.studentName)}</td><td>${answer.wordCount}</td><td>${answer.keywordCoverage}%</td><td>${answer.aiScore}</td><td>${answer.teacherScore}</td><td>${answer.scoreGap == null ? '—' : answer.scoreGap > 0 ? `+${answer.scoreGap}` : answer.scoreGap}</td><td>${answer.scoreGap === 0 ? 'Agree' : (answer.scoreGap ?? 0) > 0 ? 'Overestimate' : 'Underestimate'}</td></tr>`).join('');
    const distribution = `<div class="metrics">${[['Exact agreement', `${Math.round(fair.agreementRate * 100)}%`], ['Overestimation', `${Math.round(fair.overestimationRate * 100)}%`], ['Underestimation', `${Math.round(fair.underestimationRate * 100)}%`], ['MAE', `${fair.meanAbsoluteError.toFixed(2)} marks`], ['AI–teacher correlation', String(fair.aiTeacherCorrelation)], ['Words–rule score correlation', String(fair.wordAiCorrelation)], ['Words–teacher score correlation', String(fair.wordTeacherCorrelation)]].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI Answer Grader — Academic Evaluation Report</title><style>
      :root{font-family:Arial,Helvetica,sans-serif;color:#243531;background:#f6f5f0}body{max-width:1050px;margin:0 auto;padding:42px 28px;line-height:1.6}h1,h2,h3{font-family:Georgia,serif;color:#203930;line-height:1.25}h1{font-size:34px;margin-bottom:4px}h2{font-size:24px;margin:40px 0 13px;padding-bottom:8px;border-bottom:1px solid #d8ded6}h3{font-size:17px;margin:8px 0}.subtitle,.meta{color:#6d7773;font-size:13px}.label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#537767;font-weight:bold}.notice{background:#e9f0e8;border:1px solid #d5e2d4;padding:14px;border-radius:9px;margin:22px 0}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.metrics>div{background:white;border:1px solid #e4e2da;border-radius:9px;padding:14px}.metrics span{display:block;color:#6d7773;font-size:11px}.metrics strong{display:block;font-family:Georgia,serif;font-size:22px;margin-top:4px}table{width:100%;border-collapse:collapse;background:white;font-size:12px}th,td{text-align:left;padding:9px;border-bottom:1px solid #e9e7e1;vertical-align:top}th{background:#f0f2ed;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.question,.answer,.chart-card{background:white;border:1px solid #e5e2da;border-radius:10px;padding:18px;margin:12px 0;break-inside:avoid}blockquote{margin:10px 0;padding:12px 16px;border-left:3px solid #4d836e;background:#f8f8f5;white-space:pre-wrap}.charts{display:grid;grid-template-columns:1fr 1fr;gap:14px}.chart-card svg{display:block;width:100%;height:auto}.button{position:fixed;right:22px;top:18px;border:0;border-radius:8px;background:#28695a;color:white;padding:11px 15px;cursor:pointer}@media(max-width:700px){body{padding:28px 16px}.charts{grid-template-columns:1fr}}@media print{body{background:white;max-width:none;padding:0 8mm}.button{display:none}h2{break-after:avoid}.question,.answer,.chart-card{box-shadow:none}.charts{grid-template-columns:1fr 1fr}}
      </style></head><body><button class="button" onclick="window.print()">Print / Save as PDF</button><div class="label">Academic assessment study · ${new Date().toLocaleDateString()}</div><h1>AI Answer Grader</h1><p class="subtitle">Fair, Explainable &amp; Data-Driven Exam Evaluation</p><div class="notice"><strong>Project objective.</strong> Compare an explainable marking-scheme rules engine with teacher-assigned marks and investigate whether answer length, keyword overlap, concise responses, or irrelevant/error content distort scores.<br><strong>Scoring limitation.</strong> This build uses deterministic teacher-authored phrase and alternative matching. It is not an LLM, does not perform open-ended semantic reasoning, and should not be treated as an independent factual verifier. Findings below are screening signals from a small benchmark.</div>
      <h2>1. Statistical summary</h2>${distribution}<p>${escapeHtml(fair.conclusion)}</p><h2>2. Question performance</h2><table><thead><tr><th>Question</th><th>Answers</th><th>Mean rule score</th><th>Mean teacher score</th></tr></thead><tbody>${questionRows}</tbody></table><h2>3. Length and score charts</h2><p>Benchmark scatter plots compare word count against rule and teacher marks. Dashed lines are linear trend lines; raw marks are used for this single-question experiment.</p><div class="charts">${pairedBenchmark.length ? scatterSvg('aiScore', '#357762', 'Answer length vs rule score') + scatterSvg('teacherScore', '#cf855e', 'Answer length vs teacher score') : '<p>Teacher-scored benchmark answers are needed for length charts.</p>'}</div>
      <h2>4. Detected fairness patterns</h2><p>${fair.detectedBiases.length ? fair.detectedBiases.map(escapeHtml).join(' · ') : 'No configured patterns were flagged.'}</p><h2>5. Fairness conclusion</h2><p>${escapeHtml(fair.conclusion)}</p><p>Exact agreement: ${Math.round(fair.agreementRate * 100)}%; overestimation: ${Math.round(fair.overestimationRate * 100)}%; underestimation: ${Math.round(fair.underestimationRate * 100)}%. MAE = mean absolute AI–teacher mark difference.</p>
      <h2>6. AI/rule vs teacher comparison</h2><table><thead><tr><th>Answer</th><th>Words</th><th>Keyword coverage</th><th>Rule marks</th><th>Teacher marks</th><th>Gap</th><th>Result</th></tr></thead><tbody>${comparisonRows || '<tr><td colspan="7">No teacher-scored answers yet.</td></tr>'}</tbody></table>
      <h2>7. Official questions, marking schemes &amp; reference answers</h2>${questionSections}<h2>8. Answer-level evaluations</h2>${answerSections || '<p>No answer records available.</p>'}<footer class="meta">Generated from the current project data. Teacher scores are kept separate from rule scores; update records in the app and regenerate this report for a fresh snapshot.</footer></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `ai-answer-grader-academic-report-${new Date().toISOString().slice(0, 10)}.html`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <>
    <PageHeading eyebrow="Data export" title="Reports" subtitle="Export answer-level evidence for review, record keeping, or your own analysis."/>
    {loading ? <LoadingBlock/> : dashboard.isError || answersQuery.isError || questionsQuery.isError ? <QueryError message="Report data couldn't be assembled." retry={() => { dashboard.refetch(); answersQuery.refetch(); questionsQuery.refetch(); }}/> : <>
      <div className="dashboard-grid">
        <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Assessment record</h2><p className="panel-note">A row per answer, including scores, coverage, and question context</p></div><FileText size={17} color="#4a8270"/></div>
          <div style={{ padding: '0 22px 22px' }}><div className="metrics" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))', marginTop: 8 }}>{metric('Questions', questions.length, 'Current bank')}{metric('Answers', answers.length, 'Submitted evaluations')}</div><div className="notice"><ShieldCheck size={15}/><span>Academic report includes the rubric, reference answers, answer-level evidence, charts, fairness metrics, and generated findings. It contains the current stored submissions.</span></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 17 }}><button className="btn btn-primary" onClick={generateAcademicReport} disabled={!answers.length || !fairnessQuery.data}><FileText size={14}/>Download academic report</button><button className="btn" onClick={generateCsv} disabled={!answers.length}><Download size={14}/>Data CSV</button></div>{!answers.length && <div className="form-help" style={{ marginTop: 8 }}>No answer records are available to export yet.</div>}</div>
        </section>
        <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Snapshot</h2><p className="panel-note">Current workspace metrics</p></div><BarChart3 size={17} color="#4a8270"/></div><div style={{ padding: '0 21px 20px' }}>
          {[['Mean rule score', Number(dashboard.data?.averageAiScore ?? 0).toFixed(1)], ['Mean teacher score', Number(dashboard.data?.averageTeacherScore ?? 0).toFixed(1)], ['Agreement', pct(dashboard.data?.agreementPercent)], ['Mean absolute error', Number(fairnessQuery.data?.meanAbsoluteError ?? 0).toFixed(2)]].map(([label, value]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid hsl(var(--border))', fontSize: 11 }}><span>{label}</span><strong className="score">{value}</strong></div>)}</div></section>
      </div>
    </>}
  </>;
}

function Settings() {
  return <>
    <PageHeading eyebrow="Method notes" title="How scoring works" subtitle="A plain-language explanation of the rules engine behind every mark. Built to be inspected, not guessed at."/>
    <div className="detail-grid"><section className="panel">
       <div className="settings-section"><div className="eyebrow">The short version</div><h2 className="panel-title" style={{ fontSize: 22, marginBottom: 9 }}>Not an LLM. Not a black box.</h2><p style={{ fontSize: 12, lineHeight: 1.7, color: 'hsl(var(--muted-foreground))', maxWidth: 700, margin: 0 }}>AI Answer Grader uses a deterministic, rubric-based rules engine. It checks a response against the teacher's marking points, keywords, accepted alternatives, and concept groups. No generative model writes or decides the score.</p></div>
      <div className="settings-section"><div className="eyebrow">Scoring sequence</div>
         {[['Teacher defines the rubric', 'Each marking point has a description, mark value, and optional keywords or accepted alternatives. Concept groups capture key ideas and synonyms.'], ['Answer is checked against explicit evidence', 'The rules engine matches teacher-configured terms and accepted alternatives. Coverage and contradiction indicators are transparent rule signals, not open-ended semantic reasoning or a general fact check.'], ['Marks are allocated point by point', 'Each criterion produces an awarded mark and an explanation. Unmatched concepts and recognized contradictions are surfaced rather than hidden in a single score.'], ['Teacher review remains authoritative', 'Teachers can record their own score beside the rule score. The comparison is used for transparency and fairness analysis; it does not silently change the evaluation.']].map(([title, copy], i) => <div className="method-step" key={title}><div className="step-num">{String(i+1).padStart(2, '0')}</div><div><div className="method-title">{title}</div><div className="method-copy">{copy}</div></div></div>)}
      </div>
      <div className="settings-section"><div className="eyebrow">What gets recorded</div><div className="method-copy">For each answer, we retain the question reference, response text, rule score, optional teacher score, per-point results, keyword and concept coverage, matched and missing concepts, flagged incorrect statements, and written feedback. Reports export this record without turning it into a model-generated judgment.</div></div>
    </section>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section className="panel" style={{ padding: 21 }}><div className="empty-mark" style={{ marginLeft: 0 }}><ShieldCheck size={18}/></div><h2 className="panel-title">Understand every award</h2><p className="method-copy" style={{ margin: '8px 0 15px' }}>Open any evaluation to see the exact point descriptions, marks awarded, and feedback for each criterion.</p><Link href="/answers" className="btn">Inspect evaluations <ArrowRight size={14}/></Link></section>
      <section className="panel" style={{ padding: 21 }}><div className="empty-mark" style={{ marginLeft: 0, background: '#f3eadf', color: '#986b40' }}><Activity size={18}/></div><h2 className="panel-title">Measure agreement</h2><p className="method-copy" style={{ margin: '8px 0 15px' }}>Fairness analytics compare teacher and rule scores, with patterns visible for review—not automatic correction.</p><Link href="/fairness" className="btn">Open fairness lab <ArrowRight size={14}/></Link></section>
      <section className="panel" style={{ padding: 21 }}><h2 className="panel-title">Manage the rules</h2><p className="method-copy" style={{ margin: '8px 0 15px' }}>Rubric quality starts with the people who teach the material.</p><Link href="/teacher" className="btn btn-primary">Open rubric studio <ArrowRight size={14}/></Link></section>
    </div></div>
  </>;
}

function NotFound() {
  return <div className="panel empty-state"><div className="empty-mark"><Search size={18}/></div><h1 className="page-title" style={{ fontSize: 31, marginBottom: 10 }}>Page not found</h1><p>The page you're looking for isn't in this workspace.</p><Link className="btn btn-primary" href="/">Return to overview</Link></div>;
}
function Router() {
  return <ErrorBoundary><Shell><Switch>
    <Route path="/" component={Dashboard}/>
    <Route path="/questions" component={() => <QuestionBank/>}/>
    <Route path="/attempt/:id" component={Attempt}/>
    <Route path="/answers" component={Answers}/>
    <Route path="/answers/:id" component={AnswerDetail}/>
    <Route path="/fairness" component={Fairness}/>
    <Route path="/teacher" component={() => <QuestionBank management/>}/>
    <Route path="/reports" component={Reports}/>
    <Route path="/settings" component={Settings}/>
    <Route component={NotFound}/>
  </Switch></Shell></ErrorBoundary>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router/><Toaster/></TooltipProvider></QueryClientProvider>;
}
export default App;
