export type Level =
  "Primary" | "Middle school" | "Secondary" | "Higher secondary" | "College";
export type ActivityKind =
  | "choice"
  | "multi"
  | "fill"
  | "match"
  | "order"
  | "flashcard"
  | "maze"
  | "simulation"
  | "code"
  | "project"
  | "fraction-game"
  | "memory";
export interface Activity {
  id: string;
  kind: ActivityKind;
  prompt: string;
  options?: string[];
  answer: string | string[];
  hint: string;
  explanation: string;
  xp: number;
}
export interface Lesson {
  id: string;
  world: string;
  title: string;
  subtitle: string;
  level: Level;
  minutes: number;
  difficulty: string;
  intro: string;
  concept: string;
  activities: Activity[];
}
export interface World {
  id: string;
  title: string;
  subject: string;
  description: string;
  color: string;
  icon: string;
}
export interface Attempt {
  lessonId: string;
  activityId: string;
  correct: boolean;
  score: number;
  xp: number;
  at: string;
}
export interface Profile {
  name: string;
  grade: string;
  level: Level;
  ageBand: string;
  country: string;
  curriculum: string;
  language: string;
  interests: string[];
  goal: number;
  timezone: string;
  reminders: boolean;
  quietStart: number;
  quietEnd: number;
  leaderboard: boolean;
  reducedMotion: boolean;
  sound: boolean;
  role: "student" | "teacher" | "guardian" | "admin";
}
export interface LearningState {
  quizRuns?: QuizRun[];
  learningReports?: LearningReport[];
  profile: Profile;
  attempts: Attempt[];
  completed: string[];
  xp: number;
  coins: number;
  days: string[];
  readNotifications: string[];
  onboarded: boolean;
}
export interface QuizResponse {
  correct: boolean;
  xp: number;
  at: string;
}
export interface LearningReport {
  id: string;
  kind: "assessment" | "subject";
  lessonId?: string;
  subject: string;
  title: string;
  level: string;
  completedAt: string;
  timezone: string;
  attempt: number;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number | null;
  xp: number;
  todayXp: number;
  completed: number;
  required: number;
  recommendation: string;
  items: {
    id: string;
    prompt: string;
    explanation: string;
    correct: boolean | null;
  }[];
}
export interface QuizRun {
  id: string;
  lesson_id: string;
  title: string;
  subject: string;
  level: string;
  started_at: string;
  ended_at: string | null;
  questions: Activity[];
  responses: Record<string, QuizResponse>;
  report: LearningReport | null;
}
