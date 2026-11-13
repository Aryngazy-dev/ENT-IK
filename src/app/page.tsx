const milestones = ["Контент и администрирование", "Тесты в стиле НЦТ", "Проверяемая AI-генерация"];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">ЕНТ · ИСТОРИЯ КАЗАХСТАНА</p>
        <h1>Учиться по фактам. Отвечать уверенно.</h1>
        <p className="lead">Платформа строится вокруг качественной базы вопросов, карт, личностей и разбора ошибок.</p>
        <div className="actions"><a href="/train">Начать тренировку</a><a className="secondary" href="/dashboard">Мой прогресс</a></div>
      </section>
      <section id="architecture" className="grid">
        {milestones.map((item, index) => <article key={item}><span>0{index + 1}</span><h2>{item}</h2><p>Расширяемый модуль с серверной валидацией и автоматическими тестами.</p></article>)}
      </section>
      <section id="status" className="status"><strong>Этап 1 запущен</strong><p>Схема PostgreSQL, pgvector, основа типов заданий и тесты добавляются в проект.</p></section>
    </main>
  );
}
