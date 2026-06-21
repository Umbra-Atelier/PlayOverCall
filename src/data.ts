export const forbiddenWordsCards = [
  { word: "Eiffel Tower", forbidden: ["Paris", "France", "Metal", "Tall", "Landmark"] },
  { word: "Pizza", forbidden: ["Cheese", "Italian", "Slice", "Pepperoni", "Dough"] },
  { word: "Vampire", forbidden: ["Blood", "Dracula", "Bat", "Bite", "Garlic"] },
  { word: "Internet", forbidden: ["Web", "Computer", "Online", "Wifi", "Connection"] },
  { word: "Astronaut", forbidden: ["Space", "Moon", "NASA", "Suit", "Rocket"] },
  { word: "Coffee", forbidden: ["Morning", "Drink", "Caffeine", "Mug", "Beans"] },
  { word: "Guitar", forbidden: ["Strings", "Music", "Play", "Acoustic", "Instrument"] },
  { word: "Library", forbidden: ["Books", "Read", "Quiet", "Borrow", "Pages"] },
  { word: "Bicycle", forbidden: ["Ride", "Wheels", "Pedal", "Helmet", "Chain"] },
  { word: "Snowman", forbidden: ["Winter", "Cold", "Frosty", "Carrot", "Ice"] }
];

export const triviaQuestions = [
  {
    q: "In what year did the Titanic sink?",
    options: ["1905", "1912", "1923", "1898"],
    a: 1, // 1912
    reason: "The RMS Titanic sank early morning on April 15, 1912."
  },
  {
    q: "What is the rarest blood type among humans?",
    options: ["O Negative", "B Positive", "AB Negative", "A Negative"],
    a: 2, // AB Negative
    reason: "AB Negative is the rarest blood type, found in less than 1% of the population."
  },
  {
    q: "Which planet in our solar system has the most moons?",
    options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    a: 1, // Saturn
    reason: "Saturn surpassed Jupiter recently and has 146 discovered moons."
  },
  {
    q: "What is the primary ingredient in hummus?",
    options: ["Lentils", "Black Beans", "Chickpeas", "Edamame"],
    a: 2, // Chickpeas
    reason: "Hummus is traditionally made by blending chickpeas (garbanzo beans) with tahini."
  },
  {
    q: "Who was the first woman to win a Nobel Prize?",
    options: ["Mother Teresa", "Marie Curie", "Rosa Parks", "Amelia Earhart"],
    a: 1, // Marie Curie
    reason: "Marie Curie won the Nobel Prize in Physics in 1903 alongside her husband."
  }
];

// Grid mappings:
// 0: Floor
// 1: Wall
// 2: Start Point
// 3: Exit/Finish
// 4: Key
// 5: Locked Door
export const dungeonLevels = [
  // Level 1: Simple introduction
  [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 1, 3, 0, 1],
    [1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1]
  ],
  // Level 2: Introduce keys and doors
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 1, 4, 0, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 5, 1, 1, 1],
    [1, 1, 1, 1, 0, 3, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]
  ],
  // Level 3: A bit more complex
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 0, 1, 0, 0, 4, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 3, 5, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
];
