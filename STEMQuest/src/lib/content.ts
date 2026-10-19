import { extraLessons } from "./extra-content.ts";
import type { World, Lesson } from "./types";
export const worlds: World[] = [
  {
    id: "math",
    title: "Math Galaxy",
    subject: "Mathematics",
    description: "Big ideas. Infinite possibilities.",
    color: "#7264e8",
    icon: "planet",
  },
  {
    id: "science",
    title: "Science Lab",
    subject: "Science",
    description: "A little curiosity changes everything.",
    color: "#24a6a0",
    icon: "flask",
  },
  {
    id: "coding",
    title: "Coding Kingdom",
    subject: "Computer science",
    description: "Turn your ideas into instructions.",
    color: "#ed9d45",
    icon: "robot",
  },
  {
    id: "engineering",
    title: "Engineering City",
    subject: "Engineering",
    description: "Imagine it. Build it. Make it better.",
    color: "#e97488",
    icon: "city",
  },
  {
    id: "ai",
    title: "AI & Robotics Academy",
    subject: "Artificial intelligence",
    description: "Discover how machines learn.",
    color: "#5f9add",
    icon: "brain",
  },
  {
    id: "college",
    title: "College Project Studio",
    subject: "Data science",
    description: "Real skills for your next chapter.",
    color: "#a87bc3",
    icon: "chart",
  },
];
export const lessons: Lesson[] = [
  {
    id: "fraction-flight",
    world: "math",
    title: "Fractions in flight",
    subtitle: "Repair your spaceship with a little fraction power.",
    level: "Primary",
    minutes: 8,
    difficulty: "Explorer",
    intro:
      "Mission control needs you! Your spaceship runs on equal parts. Learn how fractions help us describe a piece of a whole.",
    concept:
      "A fraction has a numerator (parts you have) and a denominator (equal parts in the whole). Two quarters make one half: 2/4 = 1/2.",
    activities: [
      {
        id: "fuel",
        kind: "choice",
        prompt:
          "Your fuel tank has 4 equal sections. 2 are full. What fraction is full?",
        options: ["1/4", "1/2", "3/4", "4/4"],
        answer: "1/2",
        hint: "Two out of four parts can be simplified by dividing both numbers by 2.",
        explanation: "2/4 simplifies to 1/2. Exactly half of the tank is full!",
        xp: 25,
      },
      {
        id: "equal",
        kind: "multi",
        prompt: "Select every fraction equal to one half.",
        options: ["2/4", "3/6", "1/3", "4/8"],
        answer: ["2/4", "3/6", "4/8"],
        hint: "The denominator should be twice the numerator.",
        explanation: "2/4, 3/6, and 4/8 all represent one of two equal parts.",
        xp: 30,
      },
      {
        id: "sum",
        kind: "fill",
        prompt:
          "Complete the fuel calculation: 1/4 + 2/4 = __ /4. Enter the numerator.",
        answer: "3",
        hint: "When denominators match, add the numerators.",
        explanation: "1 + 2 = 3, so the result is 3/4. Ready for takeoff!",
        xp: 25,
      },
    ],
  },
  {
    id: "algebra-orbit",
    world: "math",
    title: "Algebra in orbit",
    subtitle: "Find the unknown. Unlock a new universe.",
    level: "Secondary",
    minutes: 10,
    difficulty: "Adventurer",
    intro:
      "An equation is a balance. Do the same thing on both sides to keep it balanced while you find an unknown.",
    concept:
      "To solve 2x + 3 = 11, subtract 3 from each side, then divide each side by 2. You get x = 4.",
    activities: [
      {
        id: "solve",
        kind: "fill",
        prompt: "Solve 3x + 6 = 21. What is x?",
        answer: "5",
        hint: "Subtract 6, then divide by 3.",
        explanation: "3x = 15, so x = 5. Check: 3 × 5 + 6 = 21.",
        xp: 40,
      },
      {
        id: "order",
        kind: "order",
        prompt: "Arrange the steps to solve 2x + 4 = 12.",
        options: [
          "Divide both sides by 2",
          "Subtract 4 from both sides",
          "Check x = 4 in the original equation",
        ],
        answer: [
          "Subtract 4 from both sides",
          "Divide both sides by 2",
          "Check x = 4 in the original equation",
        ],
        hint: "Undo addition before multiplication.",
        explanation: "Subtract 4 to get 2x = 8, then divide by 2 and verify.",
        xp: 35,
      },
    ],
  },
  {
    id: "calculus-launch",
    world: "math",
    title: "A first look at derivatives",
    subtitle: "Measure how quickly your world changes.",
    level: "Higher secondary",
    minutes: 12,
    difficulty: "Challenger",
    intro:
      "The derivative tells us the instantaneous rate of change of a function.",
    concept:
      "The power rule says that the derivative of xⁿ is n·xⁿ⁻¹. If position is x², velocity is 2x.",
    activities: [
      {
        id: "power",
        kind: "choice",
        prompt: "What is the derivative of x³?",
        options: ["3x²", "x²", "3x", "x⁴/4"],
        answer: "3x²",
        hint: "Multiply by the old power, then reduce that power by one.",
        explanation: "The power rule gives 3x².",
        xp: 45,
      },
      {
        id: "slope",
        kind: "fill",
        prompt: "For f(x) = x², what is the slope at x = 3?",
        answer: "6",
        hint: "The derivative is 2x.",
        explanation: "f′(3) = 2 × 3 = 6.",
        xp: 40,
      },
    ],
  },
  {
    id: "gravity-lab",
    world: "science",
    title: "The gravity playground",
    subtitle: "Drop, observe, and discover the pull of a planet.",
    level: "Middle school",
    minutes: 7,
    difficulty: "Explorer",
    intro:
      "Why do things fall? Gravity pulls objects toward a planet. Let’s compare a fall on Earth and the Moon.",
    concept:
      "Ignoring air resistance, objects accelerate equally regardless of mass. Fall time is √(2 × height ÷ gravity). Earth’s gravity is about 9.81 m/s²; the Moon’s is 1.62 m/s².",
    activities: [
      {
        id: "experiment",
        kind: "simulation",
        prompt:
          "Run a drop experiment, then choose the place where a ball falls more slowly from the same height.",
        options: ["Earth", "Moon"],
        answer: "Moon",
        hint: "A smaller gravitational acceleration means a longer fall time.",
        explanation:
          "The Moon has less gravity, so the ball takes longer to fall.",
        xp: 35,
      },
      {
        id: "mass",
        kind: "choice",
        prompt:
          "In a vacuum, a heavy ball and a light ball are dropped together. Which lands first?",
        options: ["The heavy ball", "The light ball", "They land together"],
        answer: "They land together",
        hint: "There is no air resistance in a vacuum.",
        explanation: "Gravity gives both objects the same acceleration.",
        xp: 30,
      },
    ],
  },
  {
    id: "cell-explorer",
    world: "science",
    title: "Meet the living cell",
    subtitle: "Take a tiny tour of life’s building blocks.",
    level: "Primary",
    minutes: 6,
    difficulty: "Explorer",
    intro:
      "All living things are made of cells. Each part has an important job.",
    concept:
      "The nucleus contains genetic instructions. The cell membrane controls what enters and leaves. Mitochondria release usable energy from food.",
    activities: [
      {
        id: "recall",
        kind: "flashcard",
        prompt: "What is the job of the cell membrane?",
        answer: "It controls what enters and leaves the cell.",
        hint: "Think of a gate.",
        explanation: "The membrane acts as a selective barrier.",
        xp: 0,
      },
      {
        id: "match",
        kind: "match",
        prompt: "Match each cell part to its job.",
        options: ["Nucleus", "Membrane", "Mitochondria"],
        answer: [
          "Genetic instructions",
          "Controls entry and exit",
          "Releases energy",
        ],
        hint: "The nucleus is like an instruction library.",
        explanation: "Every organelle has a role that helps the cell function.",
        xp: 30,
      },
    ],
  },
  {
    id: "chemical-bonds",
    world: "science",
    title: "How atoms connect",
    subtitle: "Discover the chemistry of sharing.",
    level: "Higher secondary",
    minutes: 10,
    difficulty: "Challenger",
    intro: "Atoms form bonds to reach more stable electron arrangements.",
    concept:
      "Covalent bonds share electron pairs. Ionic bonding involves ions formed after electron transfer, held together by electrostatic attraction.",
    activities: [
      {
        id: "bond",
        kind: "choice",
        prompt: "Which bond involves sharing electron pairs?",
        options: ["Covalent", "Ionic", "Gravitational"],
        answer: "Covalent",
        hint: "Co- suggests together.",
        explanation:
          "Covalent bonding is the sharing of electron pairs between atoms.",
        xp: 40,
      },
    ],
  },
  {
    id: "robot-rescue",
    world: "coding",
    title: "Robot rescue mission",
    subtitle: "A small robot. A big adventure. Your code.",
    level: "Middle school",
    minutes: 10,
    difficulty: "Explorer",
    intro:
      "Meet Byte, your robot companion. Build a sequence of directions to guide Byte through the garden to the glowing star.",
    concept:
      "An algorithm is an ordered list of instructions. A sequence runs one instruction at a time. Test your program, notice what goes wrong, and improve it—that’s debugging!",
    activities: [
      {
        id: "maze",
        kind: "maze",
        prompt:
          "Guide Byte from the bottom-left corner to the star. Avoid the rocks!",
        answer: "maze-goal",
        hint: "Try moving up twice, right twice, up twice, then right twice.",
        explanation:
          "You created and tested an algorithm! Different valid routes can reach the same goal.",
        xp: 60,
      },
      {
        id: "debug",
        kind: "choice",
        prompt: "Your robot hits a rock. What should you do next?",
        options: [
          "Change a direction and test again",
          "Keep running the same program",
          "Give up",
        ],
        answer: "Change a direction and test again",
        hint: "Debugging means finding and fixing a problem.",
        explanation: "Testing and revising is how programmers solve problems.",
        xp: 25,
      },
    ],
  },
  {
    id: "loop-lab",
    world: "coding",
    title: "Loops, on repeat",
    subtitle: "Do more with fewer instructions.",
    level: "Secondary",
    minutes: 9,
    difficulty: "Adventurer",
    intro:
      "A loop repeats instructions. Python’s range(n) counts from 0 up to, but not including, n.",
    concept:
      "for i in range(3): print(i) prints 0, 1, and 2. Indentation tells Python which instructions belong to the loop.",
    activities: [
      {
        id: "python",
        kind: "code",
        prompt:
          "Use a for loop to print the numbers 0 through 4. This exercise supports only range loops and print(i).",
        answer: "5",
        hint: "Use for i in range(5): followed by an indented print(i).",
        explanation: "range(5) produces 0, 1, 2, 3, and 4.",
        xp: 45,
      },
      {
        id: "count",
        kind: "fill",
        prompt: "How many times does range(8) repeat?",
        answer: "8",
        hint: "It starts at 0 and ends at 7.",
        explanation: "There are eight values: 0 through 7.",
        xp: 25,
      },
    ],
  },
  {
    id: "sequence-safari",
    world: "coding",
    title: "Your first algorithm",
    subtitle: "Put a familiar task in the right order.",
    level: "Primary",
    minutes: 5,
    difficulty: "Explorer",
    intro: "An algorithm can describe everyday actions, like planting a seed.",
    concept:
      "The order matters! You must plant the seed before you can help it grow.",
    activities: [
      {
        id: "plant",
        kind: "order",
        prompt: "Put these gardening instructions in order.",
        options: [
          "Water the soil",
          "Put the seed in the hole",
          "Make a small hole",
          "Cover the seed with soil",
        ],
        answer: [
          "Make a small hole",
          "Put the seed in the hole",
          "Cover the seed with soil",
          "Water the soil",
        ],
        hint: "Start by making a home for the seed.",
        explanation:
          "A clear sequence helps someone else follow your algorithm.",
        xp: 30,
      },
    ],
  },
  {
    id: "circuit-city",
    world: "engineering",
    title: "Light up the city",
    subtitle: "Connect the ideas behind an electric circuit.",
    level: "Middle school",
    minutes: 8,
    difficulty: "Explorer",
    intro: "An electric circuit needs a complete path for current to flow.",
    concept:
      "A simple circuit uses a battery, wires, and a bulb. An open switch breaks the path. A closed switch completes it.",
    activities: [
      {
        id: "parts",
        kind: "multi",
        prompt:
          "Choose the parts needed to make a simple working light circuit.",
        options: ["Battery", "Wires", "Bulb", "Plastic spoon"],
        answer: ["Battery", "Wires", "Bulb"],
        hint: "You need energy, a path, and something that uses the energy.",
        explanation:
          "The battery supplies energy, wires conduct current, and the bulb converts energy into light and heat.",
        xp: 35,
      },
      {
        id: "switch",
        kind: "choice",
        prompt: "A bulb is off because the switch is open. What turns it on?",
        options: ["Close the switch", "Remove the battery", "Cut a wire"],
        answer: "Close the switch",
        hint: "Current needs a complete path.",
        explanation: "Closing the switch completes the circuit.",
        xp: 30,
      },
    ],
  },
  {
    id: "bridge-builder",
    world: "engineering",
    title: "The strongest shape",
    subtitle: "Discover the secret inside a bridge.",
    level: "Secondary",
    minutes: 8,
    difficulty: "Adventurer",
    intro:
      "Engineers use shapes to distribute forces and build stable structures.",
    concept:
      "Triangles are rigid: their shape cannot change without changing a side’s length. Trusses use triangles to resist deformation.",
    activities: [
      {
        id: "shape",
        kind: "choice",
        prompt:
          "Which shape is used in trusses because it resists changing shape?",
        options: [
          "Triangle",
          "Square without bracing",
          "Circle made of string",
        ],
        answer: "Triangle",
        hint: "Think of a three-sided shape.",
        explanation: "Triangular bracing helps structures stay rigid.",
        xp: 35,
      },
      {
        id: "design",
        kind: "project",
        prompt:
          "Describe a small bridge design. Include your material, a triangular support, and how you would test it safely with small weights.",
        answer: "reflection",
        hint: "Explain what you will build, why, and how you will check it.",
        explanation:
          "Your reflection is saved for review. Written projects are not automatically graded.",
        xp: 0,
      },
    ],
  },
  {
    id: "ai-patterns",
    world: "ai",
    title: "Teaching a machine",
    subtitle: "Patterns today. Possibilities tomorrow.",
    level: "Middle school",
    minutes: 8,
    difficulty: "Explorer",
    intro:
      "Machine learning finds patterns in examples. Good examples help a model make better predictions.",
    concept:
      "Training data teaches a model. Test data checks its performance on examples it has not seen. Biased or incomplete data can lead to unreliable results.",
    activities: [
      {
        id: "data",
        kind: "choice",
        prompt:
          "A model only sees pictures of red apples. What could help it recognize green apples?",
        options: [
          "Include varied apple examples in training",
          "Use fewer examples",
          "Rename the model",
        ],
        answer: "Include varied apple examples in training",
        hint: "A model needs examples of the variation it should recognize.",
        explanation: "Representative training data helps a model generalize.",
        xp: 35,
      },
      {
        id: "test",
        kind: "choice",
        prompt: "Why keep some examples out of training?",
        options: [
          "To test on unseen examples",
          "To make training data secret",
          "To guarantee perfect accuracy",
        ],
        answer: "To test on unseen examples",
        hint: "Memorizing answers is different from learning a pattern.",
        explanation:
          "A separate test set gives a better estimate of performance on new inputs.",
        xp: 35,
      },
    ],
  },
  {
    id: "data-detective",
    world: "college",
    title: "Become a data detective",
    subtitle: "Turn a handful of numbers into insight.",
    level: "College",
    minutes: 12,
    difficulty: "Challenger",
    intro:
      "Summary statistics describe a dataset. The mean uses every value; the median is the middle value after sorting.",
    concept:
      "For 2, 3, 4, 5, 36, the mean is 10 and the median is 4. The large outlier pulls the mean upward.",
    activities: [
      {
        id: "median",
        kind: "fill",
        prompt: "Find the median of 3, 7, 8, 12, 40.",
        answer: "8",
        hint: "The list is sorted. Choose the middle value.",
        explanation: "8 has two values on each side, so it is the median.",
        xp: 45,
      },
      {
        id: "outlier",
        kind: "choice",
        prompt:
          "Which measure is usually more resistant to a single extreme outlier?",
        options: ["Median", "Mean", "Sum"],
        answer: "Median",
        hint: "The middle position matters more than the size of the extreme value.",
        explanation:
          "The median depends on rank, so it is less affected by extreme values.",
        xp: 40,
      },
      {
        id: "project",
        kind: "project",
        prompt:
          "Propose a small, anonymous dataset you could collect. Describe one question, one statistic, and one limitation. Avoid personal data.",
        answer: "reflection",
        hint: "Try measuring plant heights or daily temperatures.",
        explanation:
          "Your project is saved as an ungraded reflection for later review.",
        xp: 0,
      },
    ],
  },
  {
    id: "algorithm-studio",
    world: "college",
    title: "Thinking in algorithms",
    subtitle: "Compare approaches, not just answers.",
    level: "College",
    minutes: 12,
    difficulty: "Challenger",
    intro:
      "Complexity describes how an algorithm’s work grows as input size grows.",
    concept:
      "Linear search checks up to n items: O(n). Binary search halves a sorted search space each step: O(log n).",
    activities: [
      {
        id: "search",
        kind: "choice",
        prompt: "What does binary search require?",
        options: ["Sorted data", "Randomly ordered data", "Exactly ten items"],
        answer: "Sorted data",
        hint: "Each comparison must tell us which half to discard.",
        explanation:
          "Sorted order lets binary search safely eliminate half of the remaining candidates.",
        xp: 45,
      },
      {
        id: "complexity",
        kind: "choice",
        prompt: "What is the time complexity of checking every item once?",
        options: ["O(n)", "O(1)", "O(n²)"],
        answer: "O(n)",
        hint: "Twice as many items require about twice as many checks.",
        explanation: "One pass grows linearly with input size.",
        xp: 40,
      },
    ],
  },
  ...extraLessons,
];
export const achievements = [
  {
    id: "first",
    title: "First steps",
    description: "Complete your first activity",
    icon: "footprints",
    target: 1,
  },
  {
    id: "curious",
    title: "Curious mind",
    description: "Complete 5 activities",
    icon: "bulb",
    target: 5,
  },
  {
    id: "explorer",
    title: "World explorer",
    description: "Complete 10 activities",
    icon: "compass",
    target: 10,
  },
  {
    id: "star",
    title: "Supernova",
    description: "Complete 20 activities",
    icon: "star",
    target: 20,
  },
];
