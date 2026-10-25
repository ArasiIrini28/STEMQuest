import type { LearningState, Lesson } from "./types";
import { facts, nextFact } from "./facts";
import { recommendations } from "./personalization";

export interface HelpLink {
  label: string;
  route: string;
}
export interface HelpMessage {
  role: "user" | "assistant";
  text: string;
  mode?: "local" | "ai";
  intent?: string;
  lessonId?: string;
  factId?: string;
  links?: HelpLink[];
  source?: string;
}
export interface HelpContext {
  state: LearningState;
  catalogue: Lesson[];
  lessonId?: string;
  activityId?: string;
}
export const helperRoutes = [
  "dashboard",
  "worlds",
  "catalogue",
  "coding",
  "simulations",
  "progress",
  "reports",
  "facts",
  "settings",
  "achievements",
  "missions",
];
export function validHelpRoute(route: string, catalogue: Lesson[]) {
  return (
    helperRoutes.includes(route) ||
    (/^(lesson|quiz):/.test(route) &&
      catalogue.some((l) => l.id === route.split(":")[1]))
  );
}
const normal = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export function localHelp(
  question: string,
  history: HelpMessage[],
  context: HelpContext,
): HelpMessage {
  const q = normal(question),
    { state, catalogue } = context;
  const previous = history.filter((m) => m.role === "assistant").at(-1);
  const reply = (
    text: string,
    intent: string,
    links: HelpLink[] = [],
    extra: Partial<HelpMessage> = {},
  ): HelpMessage => ({
    role: "assistant",
    text,
    intent,
    mode: "local",
    links: links.filter((l) => validHelpRoute(l.route, catalogue)),
    ...extra,
  });
  const lessonLink = (l: Lesson): HelpLink => ({
    label: "Open " + l.title,
    route: "lesson:" + l.id,
  });
  const topicRules: [RegExp, string][] = [
    [/fraction|half|quarter|math/, "fraction-flight"],
    [/gravity|fall|moon/, "gravity-lab"],
    [/artificial intelligence|\bai\b|machine learn/, "ai-patterns"],
    [/code|coding|python|loop/, "loop-lab"],
    [/algorithm|robot/, "robot-rescue"],
    [/cell|biology/, "cell-explorer"],
    [/circuit|electric/, "circuit-city"],
  ];
  const explicit =
    catalogue.find((l) => q.includes(normal(l.title))) ||
    catalogue.find(
      (l) => l.id === topicRules.find(([pattern]) => pattern.test(q))?.[1],
    );
  const followup =
    /simpler|easier|example|explain this|this topic|quiz me|this question|why.*wrong|another|where is it|find it|see.*lesson/.test(
      q,
    );
  const lesson =
    explicit ||
    catalogue.find(
      (l) =>
        l.id ===
        (followup && previous?.lessonId ? previous.lessonId : context.lessonId),
    );
  const factRequest =
    /\bfact(s)?\b|did you know/.test(q) ||
    (/another|more|space|animals|physics|technology/.test(q) &&
      previous?.intent === "fact" &&
      !/where|find|open/.test(q));
  if (factRequest) {
    const recent = history.flatMap((m) => (m.factId ? [m.factId] : []));
    const category = /animal|nature|biology/.test(q)
      ? /biology|nature/
      : /space|moon|planet/.test(q)
        ? /space/
        : /physics/.test(q)
          ? /physics/
          : /coding|technology|computer/.test(q)
            ? /coding|computer|engineering/
            : null;
    const fact =
      (category &&
        facts.find(
          (f) =>
            category.test(f.category.toLowerCase()) &&
            !recent.includes(f.id) &&
            (state.profile.level !== "Primary" || !f.advanced),
        )) ||
      nextFact(recent, state.profile.level);
    const related = catalogue.find((l) => l.id === fact.lesson);
    return reply(
      `Did you know? ${fact.fact}\n\n${fact.why}\n\nWould you like another fact about space, nature, physics or technology?`,
      "fact",
      [
        { label: "Open STEM facts", route: "facts" },
        ...(related ? [lessonLink(related)] : []),
      ],
      { factId: fact.id, source: fact.source, lessonId: fact.lesson },
    );
  }
  if (
    /where|find|cant see|cannot see|open|go to|navigate|dont know where/.test(q)
  ) {
    let link: HelpLink | undefined;
    if (/report|score|result/.test(q))
      link = { label: "My Learning Reports", route: "reports" };
    else if (/setting|preference/.test(q))
      link = { label: "Settings", route: "settings" };
    else if (/simulation|experiment/.test(q))
      link = { label: "Science simulations", route: "simulations" };
    else if (/coding|playground/.test(q))
      link = { label: "Coding playground", route: "coding" };
    else if (/practi[sc]e/.test(q)) {
      const target = lesson || recommendations(state, catalogue)[0]?.lesson;
      if (target)
        link = {
          label: "Practise " + target.title,
          route: "quiz:" + target.id,
        };
    } else if (explicit) link = lessonLink(explicit);
    else if (/it|that/.test(q)) link = previous?.links?.[0];
    else if (lesson) link = lessonLink(lesson);
    else if (/lesson|subject/.test(q))
      link = { label: "Explore subjects", route: "catalogue" };
    if (link && validHelpRoute(link.route, catalogue))
      return reply(
        `Use “${link.label}” below to go there. The link opens the existing STEMQuest page.`,
        "navigation",
        [link],
        { lessonId: lesson?.id || previous?.lessonId },
      );
    return reply(
      "What are you trying to find: a lesson, practice questions, your learning report, or the Coding Playground?",
      "clarify",
      [
        { label: "Explore subjects", route: "catalogue" },
        { label: "My Learning Reports", route: "reports" },
        { label: "Coding playground", route: "coding" },
      ],
    );
  }
  if (/report|my scores|my results/.test(q))
    return reply(
      "My Learning Reports lists completed quiz attempts and subject milestones. Session summaries remain on your dashboard. A report is listed only after its save succeeds.",
      "navigation",
      [
        { label: "My Learning Reports", route: "reports" },
        { label: "Session history", route: "dashboard" },
      ],
    );
  if (/learn next|recommend|practi[sc]e more|where.*practi[sc]e/.test(q)) {
    const rec = recommendations(state, catalogue)[0];
    if (rec)
      return reply(
        `${rec.lesson.title}: ${rec.reason} You can review the lesson or take its quiz. One result alone is not evidence of a lasting weakness.`,
        "recommendation",
        [
          lessonLink(rec.lesson),
          {
            label: "Practise " + rec.lesson.title,
            route: "quiz:" + rec.lesson.id,
          },
        ],
        { lessonId: rec.lesson.id },
      );
  }
  if (/wrong|incorrect|this question/.test(q)) {
    const last = state.attempts
      .filter((a) => !lesson || a.lessonId === lesson.id)
      .at(-1);
    const l = catalogue.find(
      (l) => l.id === (context.lessonId || last?.lessonId),
    );
    const a = l?.activities.find(
      (a) => a.id === (context.activityId || last?.activityId),
    );
    if (a && l) {
      const recorded =
        last && last.lessonId === l.id && last.activityId === a.id;
      return reply(
        `${a.prompt}\n\n${recorded && !last.correct ? "Your latest recorded answer to this question was incorrect. " : "Here is a hint for this question. "}${recorded && !last.correct ? a.explanation : a.hint}`,
        "feedback",
        [lessonLink(l)],
        { lessonId: l.id },
      );
    }
    return reply(
      "Which question do you mean? Open the lesson or tell me the question and what you tried. I cannot judge an answer I have not seen.",
      "clarify",
    );
  }
  if (/quiz me|practice question|practise question|challenge/.test(q)) {
    const l =
      lesson ||
      catalogue.find(
        (l) =>
          l.level === state.profile.level && l.activities.some((a) => a.xp > 0),
      );
    const a = l?.activities.find((a) => a.xp > 0);
    if (a && l)
      return reply(
        `${a.prompt}\n\nHint: ${a.hint}\n\nUse the quiz link to submit an answer and record your result. Chat practice does not award XP.`,
        "practice",
        [{ label: "Start " + l.title + " quiz", route: "quiz:" + l.id }],
        { lessonId: l.id },
      );
  }
  if (lesson) {
    const simple =
      /simpler|easier|example/.test(q) || state.profile.level === "Primary";
    const explanations: Record<string, [string, string]> = {
      "fraction-flight": [
        "Imagine a sandwich cut into four equal pieces. Eating one piece means eating one quarter. The bottom number counts all equal pieces; the top counts the pieces you mean. What fraction would two pieces make?",
        "1. Identify the whole. 2. Count equal parts (the denominator). 3. Count the selected parts (the numerator). Fractions such as 1/2 and 3/6 have the same value because both numbers were multiplied by 3. Try drawing both.",
      ],
      "gravity-lab": [
        "Gravity is a pull between things that have mass. Earth pulls a dropped ball down. The Moon pulls less strongly, so the same drop takes longer. Try both places in Science simulations.",
        "Near Earth's surface, ignoring air resistance, vertical acceleration is about 9.81 m/s². From rest, distance h = ½gt², so t = √(2h/g). A smaller g gives a longer fall time at the same height. This model assumes constant gravity.",
      ],
      "loop-lab": [
        "A loop repeats instructions. Think: clap, clap, clap. A computer can repeat a print instruction three times using for i in range(3): followed by an indented print(i). It counts from zero.",
        "Python range(n) produces integers from 0 to n−1. A for loop runs its indented body once for each value. Our Coding Playground supports the restricted range/print exercise; it is not a general Python runtime. Try range(3) and predict the output before running it.",
      ],
      "robot-rescue": [
        "An algorithm is a clear set of steps, like a recipe. For a robot, one step might be 'move up'. Read each step in order and look for the first one that sends the robot into an obstacle.",
        "Trace an algorithm by recording state after every instruction. In the maze, record the robot's (x, y) position after each command. Fix the first invalid transition, then rerun; changing later steps cannot repair an earlier collision.",
      ],
    };
    const text = explanations[lesson.id]?.[simple ? 0 : 1] || lesson.concept;
    return reply(
      `${lesson.title}\n\n${text}\n\nWould an example, a practice question, or the lesson itself help next?`,
      "explanation",
      [lessonLink(lesson)],
      { lessonId: lesson.id },
    );
  }
  if (/\bhi\b|hello|help$/.test(q))
    return reply(
      "I can explain a STEM topic, share a sourced fact, help you practise, or take you to a real page. What would you like help with?",
      "clarify",
    );
  return reply(
    "I do not have a verified local explanation for that request yet. Which STEM topic or page do you mean? Try ‘explain fractions’, ‘daily fact’, ‘help with coding’, or ‘open my report’.",
    "unknown",
    [{ label: "Explore subjects", route: "catalogue" }],
  );
}

export type HelpProvider = (
  input: {
    question: string;
    history: { role: string; text: string }[];
    lessonId?: string;
    activityId?: string;
  },
  signal: AbortSignal,
) => Promise<{ answer: string; mode: string }>;
export async function answerHelp(
  question: string,
  history: HelpMessage[],
  context: HelpContext,
  provider?: HelpProvider,
  timeoutMs = 35000,
) {
  const local = localHelp(question, history, context);
  if (
    !provider ||
    ["fact", "navigation", "recommendation", "clarify"].includes(local.intent!)
  )
    return { message: local, error: "" };
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const input = {
      question,
      history: history
        .slice(-8)
        .map((m) => ({ role: m.role, text: m.text.slice(0, 2500) })),
      lessonId: local.lessonId || context.lessonId,
      activityId: context.activityId,
    };
    const result = await Promise.race([
      provider(input, controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("timeout"));
        }, timeoutMs);
      }),
    ]);
    if (
      result.mode !== "ai" ||
      typeof result.answer !== "string" ||
      !result.answer.trim() ||
      result.answer.length > 2500
    )
      throw new Error("Invalid response");
    return {
      message: { ...local, text: result.answer.trim(), mode: "ai" as const },
      error: "",
    };
  } catch {
    return {
      message: local,
      error:
        "AI could not respond (configuration, consent, usage limit or network). Built-in study help is shown below. You can retry AI or continue locally.",
    };
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
