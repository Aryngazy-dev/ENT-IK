import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const categories = [
  ["ancient-world", "Древний мир и саки", "Ежелгі дүние және сақтар"],
  ["turkic-period", "Тюркский период", "Түркі дәуірі"],
  ["kazakh-khanate", "Казахское ханство", "Қазақ хандығы"],
  ["independent-kazakhstan", "Независимый Казахстан", "Тәуелсіз Қазақстан"],
] as const;
const facts = [
  ["Казахское ханство", "1465–1466 гг.", "образовалось"], ["Тюркский каганат", "552 г.", "образовался"], ["Независимость Республики Казахстан", "16 декабря 1991 г.", "была провозглашена"], ["Золотой человек", "Иссыкский курган", "был найден в"],
] as const;

async function main() {
  const passwordHash = await hash("Admin12345!", 12);
  await prisma.user.upsert({ where: { email: "admin@example.test" }, update: {}, create: { email: "admin@example.test", passwordHash, role: "ADMIN" } });
  const created = await Promise.all(categories.map(([slug, titleRu, titleKk], sortOrder) => prisma.category.upsert({ where: { slug }, update: { titleRu, titleKk, sortOrder }, create: { slug, titleRu, titleKk, sortOrder } })));
  const topics = await Promise.all(created.map((category) => prisma.topic.upsert({ where: { slug: `${category.slug}-basics` }, update: {}, create: { slug: `${category.slug}-basics`, categoryId: category.id, titleRu: `Основы: ${category.titleRu}`, titleKk: `Негіздері: ${category.titleKk}`, sortOrder: 1 } })));
  for (let index = 0; index < 32; index += 1) {
    const [subject, answer, verb] = facts[index % facts.length]; const topic = topics[index % topics.length]; const slug = `seed-question-${index + 1}`;
    const existing = await prisma.question.findFirst({ where: { tags: { has: slug } } }); if (existing) continue;
    await prisma.question.create({ data: { topicId: topic.id, type: "SINGLE_CHOICE", difficulty: index % 3 === 0 ? "HARD" : "MEDIUM", status: "APPROVED", origin: "MANUAL", textRu: `Когда ${verb} ${subject}?`, textKk: `${subject} қашан ${verb}?`, explanationRu: `Согласно демонстрационному учебному материалу, правильный ответ: ${answer}.`, payload: { kind: "SINGLE_CHOICE", options: [{ id: "correct", contentRu: answer, isCorrect: true }, { id: "d1", contentRu: "1219 г.", isCorrect: false }, { id: "d2", contentRu: "1731 г.", isCorrect: false }, { id: "d3", contentRu: "1995 г.", isCorrect: false }] }, tags: [slug], options: { create: [{ contentRu: answer, isCorrect: true, sortOrder: 0 }, { contentRu: "1219 г.", isCorrect: false, sortOrder: 1 }, { contentRu: "1731 г.", isCorrect: false, sortOrder: 2 }, { contentRu: "1995 г.", isCorrect: false, sortOrder: 3 }] } } });
  }
  await prisma.person.upsert({ where: { slug: "keray-khan" }, update: {}, create: { slug: "keray-khan", nameRu: "Керей хан", nameKk: "Керей хан", types: ["хан"], summaryRu: "Один из основателей Казахского ханства.", summaryKk: "Қазақ хандығының негізін қалаушылардың бірі.", status: "APPROVED", categoryId: created[2].id } });
}
main().finally(() => prisma.$disconnect());
