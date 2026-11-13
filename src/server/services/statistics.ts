import { db } from "@/server/db/client";

export async function getDashboardStatistics(userId: string) {
  const [progress, activity, sessions] = await Promise.all([
    db.userProgress.findMany({ where: { userId, topicId: { not: null } }, include: { } }),
    db.dailyActivity.findMany({ where: { userId }, orderBy: { day: "desc" }, take: 90 }),
    db.testSession.count({ where: { userId, status: "COMPLETED" } }),
  ]);
  const topics = await db.topic.findMany({ where: { id: { in: progress.map((item) => item.topicId!).filter(Boolean) } }, select: { id: true, titleRu: true, category: { select: { titleRu: true } } } });
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const topicStats = progress.map((item) => ({ topicId: item.topicId!, titleRu: byId.get(item.topicId!)?.titleRu ?? "Тема", categoryRu: byId.get(item.topicId!)?.category.titleRu ?? "", answered: item.answeredCount, correct: item.correctCount, percent: item.answeredCount ? Math.round((item.correctCount / item.answeredCount) * 100) : 0, mastery: item.mastery })).sort((a, b) => a.percent - b.percent);
  const total = topicStats.reduce((sum, item) => sum + item.answered, 0); const correct = topicStats.reduce((sum, item) => sum + item.correct, 0);
  const activeDays = new Set(activity.filter((item) => item.answers > 0).map((item) => item.day.toISOString().slice(0, 10))); let streak = 0; const cursor = new Date(); cursor.setUTCHours(0, 0, 0, 0); while (activeDays.has(cursor.toISOString().slice(0, 10))) { streak += 1; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  return { totalAnswers: total, correctAnswers: correct, percent: total ? Math.round((correct / total) * 100) : 0, completedSessions: sessions, streak, weakTopics: topicStats.slice(0, 3), topicStats, activity: activity.map((item) => ({ day: item.day, answers: item.answers })) };
}
