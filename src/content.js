const DATA_FILES = {
  books: "/data/books.json",
  dailyItems: "/data/daily.json",
  domains: "/data/domains.json",
  entries: "/data/entries.json",
  exercises: "/data/exercises.json",
  formulas: "/data/formulas.json",
  glossary: "/data/glossary.json",
  mathematicians: "/data/mathematicians.json",
  modeContent: "/data/modes.json",
  modules: "/data/modules.json",
  objects: "/data/objects.json",
  places: "/data/places.json",
  problems: "/data/problems.json",
  quiz: "/data/quiz.json",
  quotes: "/data/quotes.json",
  theorems: "/data/theorems.json",
  timelineItems: "/data/timeline.json"
};

export async function loadContent() {
  const pairs = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, url]) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Impossible de charger ${url}`);
      return [key, await response.json()];
    })
  );
  return Object.fromEntries(pairs);
}

export const dataFileUrls = Object.values(DATA_FILES);
