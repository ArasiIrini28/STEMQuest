export interface Fact {
  id: string;
  category: string;
  fact: string;
  why: string;
  source: string;
  lesson?: string;
  advanced?: boolean;
  gradeRange: string;
}
const curated: Omit<Fact, "id" | "gradeRange">[] = [
  {
    category: "Space",
    fact: "Sunlight takes about eight minutes to reach Earth.",
    why: "Light is fast, but space is vast. The travel time varies slightly with Earth’s distance.",
    source: "https://science.nasa.gov/sun/facts/",
  },
  {
    category: "Space",
    fact: "The Moon’s gravity is about one sixth of Earth’s.",
    why: "The same jump can carry you higher where gravity is weaker.",
    lesson: "gravity-lab",
    source: "https://science.nasa.gov/moon/facts/",
  },
  {
    category: "Space",
    fact: "Venus takes longer to rotate once than to orbit the Sun.",
    why: "Rotation and orbit are different motions.",
    source: "https://science.nasa.gov/venus/facts/",
  },
  {
    category: "Earth",
    fact: "Earth’s plates move slowly over time.",
    why: "Their motion helps build mountains and causes many earthquakes.",
    source:
      "https://www.usgs.gov/programs/earthquake-hazards/science/plate-tectonics",
  },
  {
    category: "Weather",
    fact: "Cloud droplets and ice crystals can grow into precipitation.",
    why: "A cloud is made of tiny water particles, not water vapour alone.",
    source: "https://scijinks.gov/rain/",
  },
  {
    category: "Nature",
    fact: "Plants use light energy to help make sugars.",
    why: "Photosynthesis connects sunlight with many food chains.",
    source: "https://www.britannica.com/science/photosynthesis",
  },
  {
    category: "Biology",
    fact: "A cell membrane helps control what enters and leaves a cell.",
    why: "Cells need to exchange materials while keeping an internal environment.",
    lesson: "cell-explorer",
    source: "https://www.genome.gov/genetics-glossary/Cell-Membrane",
  },
  {
    category: "Biology",
    fact: "DNA stores instructions used by living cells.",
    why: "Different sequences of the same four bases can encode different information.",
    source:
      "https://www.genome.gov/genetics-glossary/DNA-Deoxyribonucleic-Acid",
  },
  {
    category: "Human body",
    fact: "Your heart pumps blood through two connected circulation loops.",
    why: "One serves the lungs and the other supplies the rest of the body.",
    source: "https://www.nhlbi.nih.gov/health/heart",
  },
  {
    category: "Physics",
    fact: "Sound needs matter to travel through.",
    why: "Sound waves are vibrations, so they do not travel through a vacuum.",
    source: "https://www.britannica.com/science/sound-physics",
  },
  {
    category: "Physics",
    fact: "In a vacuum, objects fall with the same gravitational acceleration at the same location.",
    why: "Air resistance explains many differences we notice in ordinary falling objects.",
    lesson: "gravity-lab",
    source: "https://science.nasa.gov/moon/",
  },
  {
    category: "Chemistry",
    fact: "Water can exist as solid, liquid and gas.",
    why: "Temperature and pressure affect which state is stable.",
    source:
      "https://www.usgs.gov/special-topics/water-science-school/science/water-cycle",
  },
  {
    category: "Chemistry",
    fact: "Covalent bonds involve shared electron pairs.",
    why: "Sharing electrons can help atoms form stable molecules.",
    lesson: "chemical-bonds",
    source: "https://www.britannica.com/science/covalent-bond",
    advanced: true,
  },
  {
    category: "Mathematics",
    fact: "One half and two quarters describe the same amount.",
    why: "Multiplying the numerator and denominator by the same nonzero number preserves a fraction’s value.",
    lesson: "fraction-flight",
    source: "https://www.khanacademy.org/math/arithmetic/fraction-arithmetic",
  },
  {
    category: "Mathematics",
    fact: "Zero is an even number.",
    why: "An integer is even when it equals two times an integer; zero equals two times zero.",
    source: "https://www.britannica.com/science/even-number",
  },
  {
    category: "Mathematics",
    fact: "The angles inside a flat triangle sum to 180 degrees.",
    why: "This rule applies in ordinary plane geometry; curved surfaces behave differently.",
    lesson: "bridge-builder",
    source: "https://www.britannica.com/science/triangle",
  },
  {
    category: "Computers",
    fact: "A bit has two possible values.",
    why: "Many bits together can represent numbers, text, sound and pictures.",
    source: "https://www.britannica.com/technology/bit-computing",
  },
  {
    category: "Coding",
    fact: "An algorithm is a sequence of steps for solving a problem.",
    why: "A recipe and a robot route both illustrate ordered instructions.",
    lesson: "sequence-safari",
    source: "https://www.britannica.com/science/algorithm",
  },
  {
    category: "Coding",
    fact: "Python range(5) produces 0, 1, 2, 3 and 4.",
    why: "The stop value is excluded; there are still five numbers.",
    lesson: "loop-lab",
    source:
      "https://docs.python.org/3/tutorial/controlflow.html#the-range-function",
  },
  {
    category: "AI",
    fact: "A model can do well on training examples but poorly on new data.",
    why: "Testing on unseen examples helps detect overfitting.",
    lesson: "ai-patterns",
    source:
      "https://developers.google.com/machine-learning/crash-course/overfitting/overfitting",
    advanced: true,
  },
  {
    category: "Engineering",
    fact: "Triangles are widely used to brace structures.",
    why: "With fixed side lengths, a triangle cannot change shape without changing a side.",
    lesson: "bridge-builder",
    source: "https://www.britannica.com/technology/truss",
  },
  {
    category: "Engineering",
    fact: "Opening a switch breaks a simple electrical circuit.",
    why: "A complete conducting path is needed for sustained current in the ideal circuit.",
    lesson: "circuit-city",
    source: "https://www.britannica.com/technology/electric-circuit",
  },
  {
    category: "History of science",
    fact: "Marie Curie received Nobel Prizes in two different sciences.",
    why: "She won the Physics prize in 1903 and Chemistry in 1911.",
    source:
      "https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/facts/",
  },
  {
    category: "Everyday science",
    fact: "Evaporating water can cool a surface.",
    why: "Evaporation transfers energy away, which helps explain how sweating cools us.",
    source:
      "https://www.usgs.gov/special-topics/water-science-school/science/evaporation-and-water-cycle",
  },
];
export const facts: Fact[] = curated.map((f, i) => ({
  ...f,
  id: "fact-" + i,
  gradeRange: f.advanced
    ? "Grades 9–12 and college"
    : "Grades 3–12 and college",
}));
export function nextFact(recent: string[], level: string) {
  const available = facts.filter((f) => level !== "Primary" || !f.advanced);
  return (
    available.find((f) => !recent.includes(f.id)) ||
    available.find((f) => f.id !== recent.at(-1)) ||
    available[0]
  );
}
export const FACT_INTERVAL = 300_000;
export function factClock(
  elapsed: number,
  delta: number,
  active: boolean,
  visible: boolean,
) {
  return Math.min(
    FACT_INTERVAL,
    elapsed + (active && visible ? Math.max(0, Math.min(delta, 2000)) : 0),
  );
}
