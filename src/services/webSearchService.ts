export async function serperSearch(query: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query }),
    });

    if (!res.ok) {
      return `Web search failed: ${res.status} ${res.statusText}`;
    }

    const data = await res.json();
    const results: any[] = data?.organic ?? [];

    if (results.length === 0) {
      return `No results found for "${query}".`;
    }

    return results
      .slice(0, 5)
      .map((r: any, i: number) => `[${i + 1}] ${r.title}\n${r.link}\n${r.snippet ?? ''}`)
      .join('\n\n');
  } catch (err) {
    return `Web search error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function wikipediaSearch(query: string): Promise<string> {
  try {
    const title = encodeURIComponent(query.trim().replace(/\s+/g, '_'));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (res.status === 404) {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const suggestions: string[] = searchData[1] ?? [];
      if (suggestions.length === 0) {
        return `No Wikipedia article found for "${query}".`;
      }
      return wikipediaSearch(suggestions[0]);
    }

    if (!res.ok) {
      return `Wikipedia lookup failed: ${res.status} ${res.statusText}`;
    }

    const data = await res.json();
    const extract = data.extract ?? '';
    const pageTitle = data.title ?? query;

    if (!extract) {
      return `No summary available for "${pageTitle}" on Wikipedia.`;
    }

    return `Wikipedia — ${pageTitle}:\n${extract}`;
  } catch (err) {
    return `Wikipedia error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function calculatorEval(expression: string): Promise<string> {
  try {
    const expr = encodeURIComponent(expression.trim());
    const res = await fetch(`https://api.mathjs.org/v4/?expr=${expr}`);
    if (!res.ok) {
      return `Calculator error: ${res.status} ${res.statusText}`;
    }
    const result = await res.text();
    return `${expression} = ${result.trim()}`;
  } catch (err) {
    return `Calculator error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function weatherLookup(city: string): Promise<string> {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`
    );
    if (!geoRes.ok) {
      return `Weather error: could not geocode "${city}"`;
    }
    const geoData = await geoRes.json();
    const place = geoData.results?.[0];
    if (!place) {
      return `Weather: no location found for "${city}".`;
    }

    const { latitude, longitude, name, country } = place;
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`
    );
    if (!weatherRes.ok) {
      return `Weather error: ${weatherRes.status} ${weatherRes.statusText}`;
    }
    const w = await weatherRes.json();
    const cur = w.current;
    const daily = w.daily;

    const wmoDescription = (code: number): string => {
      if (code === 0) return 'Clear sky';
      if (code <= 3) return 'Partly cloudy';
      if (code <= 9) return 'Overcast';
      if (code <= 19) return 'Foggy';
      if (code <= 29) return 'Light drizzle';
      if (code <= 39) return 'Drizzle';
      if (code <= 49) return 'Freezing drizzle';
      if (code <= 59) return 'Rain showers';
      if (code <= 69) return 'Rain';
      if (code <= 79) return 'Snow';
      if (code <= 84) return 'Rain showers';
      if (code <= 94) return 'Thunderstorm';
      return 'Thunderstorm with hail';
    };

    const lines = [
      `Weather in ${name}, ${country}:`,
      `Current: ${cur.temperature_2m}°C, ${wmoDescription(cur.weather_code)}, Humidity ${cur.relative_humidity_2m}%, Wind ${cur.wind_speed_10m} km/h`,
    ];

    for (let i = 0; i < Math.min(3, daily.time.length); i++) {
      lines.push(`${daily.time[i]}: High ${daily.temperature_2m_max[i]}°C / Low ${daily.temperature_2m_min[i]}°C, ${wmoDescription(daily.weather_code[i])}`);
    }

    return lines.join('\n');
  } catch (err) {
    return `Weather error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

export async function dictionaryLookup(word: string): Promise<string> {
  try {
    const clean = word.trim().toLowerCase().split(/\s+/)[0];
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
    if (res.status === 404) {
      return `Dictionary: no entry found for "${clean}".`;
    }
    if (!res.ok) {
      return `Dictionary error: ${res.status} ${res.statusText}`;
    }
    const data = await res.json();
    const entry = data[0];
    if (!entry) {
      return `Dictionary: no entry found for "${clean}".`;
    }

    const phonetic = entry.phonetic ?? entry.phonetics?.find((p: any) => p.text)?.text ?? '';
    const lines: string[] = [`${entry.word}${phonetic ? ` [${phonetic}]` : ''}`];

    const maxMeanings = 2;
    const maxDefs = 2;
    for (const meaning of (entry.meanings ?? []).slice(0, maxMeanings)) {
      lines.push(`(${meaning.partOfSpeech})`);
      for (const def of (meaning.definitions ?? []).slice(0, maxDefs)) {
        lines.push(`  • ${def.definition}`);
        if (def.example) lines.push(`    e.g. "${def.example}"`);
      }
    }

    return lines.join('\n');
  } catch (err) {
    return `Dictionary error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}
