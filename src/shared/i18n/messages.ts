export const locales = ["ru", "kk"] as const;
export type Locale = (typeof locales)[number];
export const messages = { ru: { train: "Тренировка", dashboard: "Мой прогресс", exam: "Пробный ЕНТ", continue: "Продолжить", start: "Начать" }, kk: { train: "Жаттығу", dashboard: "Менің прогресім", exam: "Сынақ ҰБТ", continue: "Жалғастыру", start: "Бастау" } } as const;
