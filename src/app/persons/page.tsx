import { useEffect, useState } from "react";
type Person = { slug: string; nameRu: string; nameKk: string | null; types: string[]; lifeStart: string | null; lifeEnd: string | null; summaryRu: string; category: { titleRu: string } | null };
"use client";

import { useEffect, useState } from "react";

type Person = {
  slug: string;
  nameRu: string;
  nameKk: string | null;
  types: string[];
  lifeStart: string | null;
  lifeEnd: string | null;
  summaryRu: string | null;
  category: {
    titleRu: string;
  } | null;
};

export default function PersonsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(value = query) {
    setLoading(true);
    try {
      const response = await fetch(`/api/persons?q=${encodeURIComponent(value)}`);
      if (response.ok) {
        const data = await response.json();
        setPeople(data);
      }
    } catch (error) {
      console.error("Failed to load persons", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void search("");
  }, []);

  return (
    <main>
      <p className="eyebrow">ЛИЧНОСТИ</p>
      <h1>Исторические личности Казахстана</h1>
      <div className="search">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Имя, прозвище или фамилия"
        />
        <button onClick={() => search()}>Найти</button>
      </div>
      {loading ? (
        <p>Ищем…</p>
      ) : (
        <section className="person-grid">
          {people.map((person) => (
            <a
              className="person-card"
              href={`/persons/${person.slug}`}
              key={person.slug}
            >
              <p className="eyebrow">
                {person.category?.titleRu ?? "История Казахстана"}
              </p>
              <h2>{person.nameRu}</h2>
              <p>
                {person.lifeStart || "?"}
                {person.lifeEnd ? ` — ${person.lifeEnd}` : ""}
              </p>
              <p>{person.summaryRu}</p>
              <small>{person.types?.join(" · ") ?? ""}</small>
            </a>
          ))}
        </section>
      )}
    </main>
  );
}
