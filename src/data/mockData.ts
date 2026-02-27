import { Type } from "@google/genai";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  subject: string;
  grade: number;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
  image?: string;
}

export const QUESTIONS: Question[] = [
  // Math - Grade 1-3
  {
    id: 'm1',
    text: 'What shape has 3 sides?',
    options: ['Square', 'Circle', 'Triangle', 'Rectangle'],
    correctAnswer: 2,
    subject: 'Math',
    grade: 1,
    difficulty: 'easy',
    hint: 'Think of a slice of pizza! 🍕'
  },
  {
    id: 'm2',
    text: 'What is 5 + 3?',
    options: ['7', '8', '9', '10'],
    correctAnswer: 1,
    subject: 'Math',
    grade: 1,
    difficulty: 'easy',
    hint: 'Count your fingers! 🖐️'
  },
  {
    id: 'm3',
    text: 'Which number comes after 19?',
    options: ['18', '20', '21', '22'],
    correctAnswer: 1,
    subject: 'Math',
    grade: 1,
    difficulty: 'easy'
  },
  {
    id: 'm4',
    text: 'How many corners does a square have?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    subject: 'Math',
    grade: 1,
    difficulty: 'easy'
  },
  {
    id: 'm5',
    text: 'What is 10 - 4?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    subject: 'Math',
    grade: 2,
    difficulty: 'medium'
  },
  {
    id: 'm6',
    text: 'Which is the largest number?',
    options: ['45', '54', '39', '51'],
    correctAnswer: 1,
    subject: 'Math',
    grade: 2,
    difficulty: 'medium'
  },
  {
    id: 'm7',
    text: 'What is 2 x 5?',
    options: ['7', '10', '12', '15'],
    correctAnswer: 1,
    subject: 'Math',
    grade: 2,
    difficulty: 'medium'
  },
  {
    id: 'm8',
    text: 'A clock shows 3:00. Where is the big hand?',
    options: ['At 3', 'At 6', 'At 9', 'At 12'],
    correctAnswer: 3,
    subject: 'Math',
    grade: 2,
    difficulty: 'medium'
  },

  // EVS / Science - Grade 1-3
  {
    id: 'e1',
    text: 'Which animal gives us milk?',
    options: ['Lion', 'Cow', 'Dog', 'Cat'],
    correctAnswer: 1,
    subject: 'EVS',
    grade: 1,
    difficulty: 'easy',
    hint: 'It says Mooo! 🐄'
  },
  {
    id: 'e2',
    text: 'Which part of the plant is under the ground?',
    options: ['Leaf', 'Flower', 'Root', 'Stem'],
    correctAnswer: 2,
    subject: 'EVS',
    grade: 1,
    difficulty: 'easy'
  },
  {
    id: 'e3',
    text: 'What do we use to see things?',
    options: ['Ears', 'Nose', 'Eyes', 'Hands'],
    correctAnswer: 2,
    subject: 'EVS',
    grade: 1,
    difficulty: 'easy'
  },
  {
    id: 'e4',
    text: 'Which is a fruit?',
    options: ['Potato', 'Apple', 'Carrot', 'Onion'],
    correctAnswer: 1,
    subject: 'EVS',
    grade: 1,
    difficulty: 'easy'
  },
  {
    id: 'e5',
    text: 'Which animal can fly?',
    options: ['Elephant', 'Bird', 'Fish', 'Rabbit'],
    correctAnswer: 1,
    subject: 'EVS',
    grade: 1,
    difficulty: 'easy'
  },
  {
    id: 'e6',
    text: 'What do plants need to grow?',
    options: ['Chocolate', 'Water and Sunlight', 'Toys', 'Milk'],
    correctAnswer: 1,
    subject: 'EVS',
    grade: 2,
    difficulty: 'medium'
  },
  {
    id: 'e7',
    text: 'Which is a living thing?',
    options: ['Stone', 'Tree', 'Table', 'Car'],
    correctAnswer: 1,
    subject: 'EVS',
    grade: 2,
    difficulty: 'medium'
  },
  {
    id: 'e8',
    text: 'How many sense organs do we have?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 2,
    subject: 'EVS',
    grade: 2,
    difficulty: 'medium'
  },

  // English - Grade 1-3
  {
    id: 'en1',
    text: 'Which is a vowel?',
    options: ['B', 'C', 'E', 'D'],
    correctAnswer: 2,
    subject: 'English',
    grade: 1,
    difficulty: 'easy',
    hint: 'A, E, I, O, U are vowels!'
  },
  {
    id: 'en2',
    text: 'What is the opposite of "Big"?',
    options: ['Tall', 'Small', 'Long', 'Heavy'],
    correctAnswer: 1,
    subject: 'English',
    grade: 1,
    difficulty: 'easy'
  },
  {
    id: 'en3',
    text: 'Choose the correct spelling:',
    options: ['Appel', 'Apple', 'Aple', 'Appal'],
    correctAnswer: 1,
    subject: 'English',
    grade: 1,
    difficulty: 'easy'
  },
  {
    id: 'en4',
    text: 'A ____ barked at the stranger.',
    options: ['Cat', 'Dog', 'Cow', 'Bird'],
    correctAnswer: 1,
    subject: 'English',
    grade: 1,
    difficulty: 'easy'
  },
  {
    id: 'en5',
    text: 'Which word is a naming word (Noun)?',
    options: ['Run', 'Happy', 'Rahul', 'Fast'],
    correctAnswer: 2,
    subject: 'English',
    grade: 2,
    difficulty: 'medium'
  },
  {
    id: 'en6',
    text: 'Plural of "Cat" is:',
    options: ['Cats', 'Cates', 'Caties', 'Cating'],
    correctAnswer: 0,
    subject: 'English',
    grade: 2,
    difficulty: 'medium'
  },
  {
    id: 'en7',
    text: 'Identify the action word (Verb):',
    options: ['Apple', 'Book', 'Jump', 'Red'],
    correctAnswer: 2,
    subject: 'English',
    grade: 2,
    difficulty: 'medium'
  },
  {
    id: 'en8',
    text: 'Which sentence is correct?',
    options: ['I is happy.', 'I am happy.', 'I are happy.', 'I be happy.'],
    correctAnswer: 1,
    subject: 'English',
    grade: 2,
    difficulty: 'medium'
  }
];

export const LIBRARY_PDFS = [
  { id: 'p1', title: 'Math-Magic Class 1', url: 'https://ncert.nic.in/textbook/pdf/aehh101.pdf', grade: 1, subject: 'Math' },
  { id: 'p2', title: 'Marigold Class 1', url: 'https://ncert.nic.in/textbook/pdf/aeen101.pdf', grade: 1, subject: 'English' },
  { id: 'p3', title: 'Looking Around Class 3', url: 'https://ncert.nic.in/textbook/pdf/ceap101.pdf', grade: 3, subject: 'EVS' },
  { id: 'p4', title: 'Math-Magic Class 2', url: 'https://ncert.nic.in/textbook/pdf/behh101.pdf', grade: 2, subject: 'Math' },
  { id: 'p5', title: 'Raindrops Class 2', url: 'https://ncert.nic.in/textbook/pdf/been101.pdf', grade: 2, subject: 'English' },
  { id: 'p6', title: 'Rimjhim Class 1 (Hindi)', url: 'https://ncert.nic.in/textbook/pdf/ahhn101.pdf', grade: 1, subject: 'Hindi' },
  { id: 'p7', title: 'Environmental Studies Class 4', url: 'https://ncert.nic.in/textbook/pdf/deap101.pdf', grade: 4, subject: 'EVS' },
  { id: 'p8', title: 'Mathematics Class 5', url: 'https://ncert.nic.in/textbook/pdf/eehh101.pdf', grade: 5, subject: 'Math' },
  { id: 'p9', title: 'English Marigold Class 5', url: 'https://ncert.nic.in/textbook/pdf/eeen101.pdf', grade: 5, subject: 'English' },
  { id: 'p10', title: 'Science Class 6', url: 'https://ncert.nic.in/textbook/pdf/fesc101.pdf', grade: 6, subject: 'Science' }
];

export const CURRICULUM: Record<string, any[]> = {
  Math: [
    {
      id: 'c1',
      name: 'Numbers & Counting',
      pdfs: [
        { name: 'NCERT Chapter 1', desc: 'Official Concept Theory', url: 'https://ncert.nic.in/textbook/pdf/aehh101.pdf' },
        { name: 'RS Aggarwal Practice', desc: 'Extra Practice Problems', url: '#' },
        { name: 'FluxED Reference', desc: 'Visual Learning Guide', url: '#' }
      ],
      topics: [
        { 
          id: 't1', 
          name: 'Numbers 1-10', 
          videos: [
            { 
              title: 'Counting 1-10 for Kids', 
              platform: 'YouTube',
              duration: '5:00', 
              desc: 'Learn to count from 1 to 10 with fun animations!', 
              url: 'https://www.youtube.com/results?search_query=counting+1-10+for+kids',
              rating: 4.8,
              totalRatings: 1250,
              tags: ['Top Rated', 'Beginner Friendly']
            },
            { 
              title: 'Number Recognition', 
              platform: 'FluxED',
              duration: '3:20', 
              desc: 'Quick guide to identifying numbers.', 
              url: '#',
              rating: 4.5,
              totalRatings: 850,
              tags: ['Short Duration']
            }
          ],
          questions: [
            { text: 'What comes after 5?', options: ['4', '6', '7', '8'], correctAnswer: 1, explanation: '6 comes immediately after 5.' },
            { text: 'How many fingers do you have on one hand?', options: ['3', '4', '5', '10'], correctAnswer: 2, explanation: 'Most people have 5 fingers on one hand.' }
          ]
        },
        { 
          id: 't2', 
          name: 'Addition Basics', 
          videos: [
            { 
              title: 'Intro to Addition', 
              platform: 'YouTube',
              duration: '4:30', 
              desc: 'Simple addition using objects.', 
              url: 'https://www.youtube.com/results?search_query=addition+basics+for+kids',
              rating: 4.7,
              totalRatings: 2100,
              tags: ['Top Rated']
            }
          ],
          questions: [
            { text: '2 + 2 = ?', options: ['3', '4', '5', '6'], correctAnswer: 1, explanation: 'Adding 2 and 2 gives 4.' }
          ]
        }
      ]
    },
    {
      id: 'c2',
      name: 'Shapes & Space',
      pdfs: [
        { name: 'NCERT Chapter 2', desc: 'Shapes and Designs', url: 'https://ncert.nic.in/textbook/pdf/aehh102.pdf' }
      ],
      topics: [
        { 
          id: 't3', 
          name: 'Basic Shapes', 
          videos: [
            { 
              title: 'Shapes Song', 
              platform: 'YouTube',
              duration: '3:15', 
              desc: 'Sing along and learn about circles, squares, and triangles.', 
              url: 'https://www.youtube.com/results?search_query=shapes+song+for+kids',
              rating: 4.9,
              totalRatings: 5400,
              tags: ['Top Rated', 'Short Duration']
            }
          ],
          questions: [
            { text: 'Which shape has no corners?', options: ['Square', 'Triangle', 'Circle', 'Rectangle'], correctAnswer: 2, explanation: 'A circle is round and has no corners.' }
          ]
        }
      ]
    }
  ],
  English: [
    {
      id: 'c3',
      name: 'Alphabet Fun',
      pdfs: [
        { name: 'NCERT Marigold Ch 1', desc: 'A Happy Child', url: 'https://ncert.nic.in/textbook/pdf/aeen101.pdf' }
      ],
      topics: [
        { 
          id: 't4', 
          name: 'Vowels & Consonants', 
          videos: [
            { 
              title: 'The Vowel Song', 
              platform: 'YouTube',
              duration: '6:00', 
              desc: 'A, E, I, O, U are the vowels!', 
              url: 'https://www.youtube.com/results?search_query=vowels+and+consonants+for+kids',
              rating: 4.6,
              totalRatings: 3200,
              tags: ['Beginner Friendly']
            }
          ],
          questions: [
            { text: 'Which of these is a vowel?', options: ['B', 'C', 'E', 'D'], correctAnswer: 2, explanation: 'E is one of the five vowels (A, E, I, O, U).' }
          ]
        }
      ]
    }
  ],
  EVS: [
    {
      id: 'c4',
      name: 'My Body',
      pdfs: [
        { name: 'NCERT EVS Ch 1', desc: 'Poonam\'s Day Out', url: 'https://ncert.nic.in/textbook/pdf/ceap101.pdf' }
      ],
      topics: [
        { 
          id: 't5', 
          name: 'Sense Organs', 
          videos: [
            { 
              title: 'Our 5 Senses', 
              platform: 'YouTube',
              duration: '5:45', 
              desc: 'Learn how we see, hear, smell, taste, and touch.', 
              url: 'https://www.youtube.com/results?search_query=5+senses+for+kids',
              rating: 4.7,
              totalRatings: 1800,
              tags: ['Top Rated']
            }
          ],
          questions: [
            { text: 'Which organ do we use to smell?', options: ['Eyes', 'Ears', 'Nose', 'Tongue'], correctAnswer: 2, explanation: 'We use our nose to smell things.' }
          ]
        }
      ]
    }
  ]
};
