import type { Lesson } from "./types";
export const extraLessons: Lesson[] = [
  {
    id: "spaceship-fuel",
    world: "math",
    title: "Spaceship fuel station",
    subtitle: "Build a fraction. Power a spaceship.",
    level: "Primary",
    minutes: 5,
    difficulty: "Explorer",
    intro:
      "Your ship needs exactly three quarters of a tank. Use eight equal fuel cells to prepare it for launch.",
    concept:
      "Equivalent fractions describe the same amount. Multiplying the top and bottom by the same number keeps the value unchanged: 3/4 = 6/8.",
    activities: [
      {
        id: "fuel-game",
        kind: "fraction-game",
        prompt: "Fill exactly 3/4 of the eight-cell tank, then launch.",
        answer: "6",
        hint: "Divide eight cells into four equal groups. You need three of those groups.",
        explanation:
          "Six of eight cells equals three quarters: 6/8 = 3/4. Your spaceship is ready!",
        xp: 40,
      },
    ],
  },
  {
    id: "fraction-memory",
    world: "math",
    title: "Cosmic fraction pairs",
    subtitle: "A memory game with a mathematical twist.",
    level: "Middle school",
    minutes: 6,
    difficulty: "Explorer",
    intro:
      "Turn over cards and match fractions that have the same value. Remembering a card is useful—but understanding the fraction is your superpower.",
    concept:
      "Simplify a fraction by dividing the numerator and denominator by the same number: 2/4 = 1/2, 2/6 = 1/3, and 6/8 = 3/4.",
    activities: [
      {
        id: "memory",
        kind: "memory",
        prompt: "Find all three pairs of equivalent fractions.",
        answer: ["half", "third", "threequarters"],
        hint: "Divide both numbers in 2/4, 2/6, and 6/8 by 2.",
        explanation:
          "All three pairs represent equal amounts, even though they use different numbers of parts.",
        xp: 45,
      },
    ],
  },
];
