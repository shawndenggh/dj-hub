const DEEZER_API_URL = process.env.DEEZER_API_URL ?? "https://api.deezer.com";

export interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: {
    id: number;
    name: string;
    picture_medium: string;
  };
  album: {
    id: number;
    title: string;
    cover_medium: string;
  };
  explicit_lyrics: boolean;
  bpm: number;
}

export interface DeezerSearchResult {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

export interface DeezerGenre {
  id: number;
  name: string;
  picture: string;
}

export interface DeezerChart {
  tracks: { data: DeezerTrack[] };
}

async function fetchDeezer<T>(endpoint: string): Promise<T> {
  const url = `${DEEZER_API_URL}${endpoint}`;
  const res = await fetch(url, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    throw new Error(`Deezer API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function searchTracks(
  query: string,
  options: { limit?: number; index?: number } = {}
): Promise<DeezerSearchResult> {
  const { limit = 25, index = 0 } = options;
  return fetchDeezer<DeezerSearchResult>(
    `/search?q=${encodeURIComponent(query)}&limit=${limit}&index=${index}`
  );
}

export async function searchByGenre(
  genre: string,
  options: { limit?: number } = {}
): Promise<DeezerSearchResult> {
  const { limit = 25 } = options;
  return fetchDeezer<DeezerSearchResult>(
    `/search?q=genre:"${encodeURIComponent(genre)}"&limit=${limit}`
  );
}

export async function getTrack(id: number | string): Promise<DeezerTrack> {
  return fetchDeezer<DeezerTrack>(`/track/${id}`);
}

export async function getGenres(): Promise<{ data: DeezerGenre[] }> {
  return fetchDeezer<{ data: DeezerGenre[] }>("/genre");
}

export async function getChart(): Promise<DeezerChart> {
  return fetchDeezer<DeezerChart>("/chart");
}

export async function getRadio(genreId: number): Promise<{ data: DeezerTrack[] }> {
  return fetchDeezer<{ data: DeezerTrack[] }>(`/genre/${genreId}/radios`);
}

export async function getArtistTopTracks(
  artistId: number
): Promise<{ data: DeezerTrack[] }> {
  return fetchDeezer<{ data: DeezerTrack[] }>(`/artist/${artistId}/top?limit=10`);
}

export interface RecommendationFilters {
  genres?: string[];
  bpmRange?: { min: number; max: number };
  excludeExplicit?: boolean;
  limit?: number;
}

export async function getRecommendations(
  filters: RecommendationFilters
): Promise<DeezerTrack[]> {
  const { genres = [], bpmRange, excludeExplicit = false, limit = 20 } = filters;

  const tracks: DeezerTrack[] = [];

  // Fetch tracks for each genre
  if (genres.length > 0) {
    for (const genre of genres.slice(0, 3)) {
      try {
        const result = await searchByGenre(genre, { limit: Math.ceil(limit / genres.length) });
        tracks.push(...result.data);
      } catch (error) {
        console.error(`Error fetching genre ${genre}:`, error);
      }
    }
  } else {
    // Fallback to chart
    try {
      const chart = await getChart();
      tracks.push(...chart.tracks.data.slice(0, limit));
    } catch (error) {
      console.error("Error fetching chart:", error);
    }
  }

  // Filter tracks
  let filtered = tracks;

  if (excludeExplicit) {
    filtered = filtered.filter((t) => !t.explicit_lyrics);
  }

  if (bpmRange && bpmRange.min > 0 && bpmRange.max > 0) {
    filtered = filtered.filter(
      (t) => t.bpm >= bpmRange.min && t.bpm <= bpmRange.max
    );
  }

  // Deduplicate by ID
  const seen = new Set<number>();
  const unique = filtered.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  return unique.slice(0, limit);
}
