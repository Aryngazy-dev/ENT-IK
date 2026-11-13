export const examConfig = {
  mockExam: { durationMinutes: 60, questions: 30 },
  questionTypes: {
    SINGLE_CHOICE: { minOptions: 4, maxOptions: 5 },
    MULTIPLE_CHOICE: { minOptions: 5, maxOptions: 6 },
  },
  duplicateSimilarityThreshold: 0.92,
} as const;
