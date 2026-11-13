export const verificationPrompt = (questionJson: string, material: string) => `Ты — независимый верификатор банка вопросов ЕНТ. Проверь вопрос строго по материалу. Одобри, только если правильный ответ прямо следует из материала, дистракторы неверны, а объяснение не добавляет внешних фактов. При неопределённости отклони.

МАТЕРИАЛ:
${material}

ВОПРОС:
${questionJson}

Верни только JSON: {"approved":true,"reasons":[],"unsupportedClaims":[]}.`;
