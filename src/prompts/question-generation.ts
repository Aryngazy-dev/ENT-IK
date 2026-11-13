export const questionGenerationPrompt = (fact: string, evidence: string, material: string) => `Ты составляешь задания ЕНТ по истории Казахстана исключительно по приведённому учебному материалу.

ФАКТ: ${fact}
ДОКАЗАТЕЛЬСТВО: ${evidence}
МАТЕРИАЛ: ${material}

Не допускай угадывания. Дистракторы должны быть правдоподобны и относиться к той же эпохе и типу объектов. Запрещено добавлять имена, даты и связи, отсутствующие в материале. Если качественный вопрос невозможен, верни пустой массив. Подготовь 3–5 разных русских формулировок с одним ответом. Для контекстного типа дай 2–5 предложений, перефразируя только материал. Поддерживаемые форматы в этом проходе: SINGLE_CHOICE, MULTIPLE_CHOICE, CONTEXT, ODD_ONE_OUT, CAUSE_EFFECT, DEFINITION.

Верни ТОЛЬКО JSON: {"questions":[{"type":"SINGLE_CHOICE","difficulty":"MEDIUM","textRu":"...","contextRu":"...","options":[{"contentRu":"...","isCorrect":true}],"explanationRu":"...","sourceEvidence":"...","variantsRu":["...","...","..."]}]}`;
