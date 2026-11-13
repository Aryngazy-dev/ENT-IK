import { redirect } from "next/navigation";
import { currentIdentity } from "@/server/auth/session";

const resources = [
  ["Категории и темы", "/admin/content", "Иерархия эпох, тем и подтем"],
  ["Вопросы", "/admin/questions", "Черновики, варианты, объяснения и модерация"],
  ["Личности", "/admin/persons", "Энциклопедические карточки и связи"],
  ["Медиа", "/admin/media", "Загрузка карт, портретов, документов и лицензий"],
  ["Разметка карт", "/admin/maps", "Маркеры и защищённые регионы на картах"],
  ["AI-генерация", "/admin/generation", "Факты, вопросы, перефразирование и верификация"],
  ["Модерация", "/admin/moderation", "Проверка и публикация AI-черновиков"],
  ["Импорт", "/admin/import", "Предпросмотр CSV перед маппингом"],
];
export default async function AdminPage() {
  const identity = await currentIdentity(); if (!identity || identity.role !== "ADMIN") redirect("/");
  return <main><p className="eyebrow">АДМИНИСТРИРОВАНИЕ</p><h1>Банк контента</h1><section className="grid">{resources.map(([title, href, description]) => <article key={href}><h2>{title}</h2><p>{description}</p><a href={href}>Открыть API</a></article>)}</section></main>;
}
