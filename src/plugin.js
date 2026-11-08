(function() {
    /**
     * @typedef {Object} Response
     * @property {boolean} success
     * @property {any} [data]
     * @property {string} [errorCode]
     * @property {string} [message]
     */

    const MAIN_URL = "https://dexter.pw";
    const API_BASE = "https://dexter.pw/api";

    const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const HEADERS = {
        "User-Agent": USER_AGENT,
        "Referer": `${MAIN_URL}/`,
        "Origin": MAIN_URL,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8"
    };

    const STREAM_HEADERS = {
        "User-Agent": USER_AGENT,
        "Referer": `${MAIN_URL}/`,
        "Origin": MAIN_URL
    };

    async function _fetchJson(url) {
        try {
            const res = await http_get(url, {
                ...HEADERS,
                headers: HEADERS
            });
            if (!res || !res.body) return null;
            return JSON.parse(res.body);
        } catch (e) {
            return null;
        }
    }

    function _formatPoster(path) {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `https://image.tmdb.org/t/p/w500${path}`;
    }

    function _formatBackdrop(path) {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `https://image.tmdb.org/t/p/original${path}`;
    }

    function _formatItem(item) {
        if (!item) return null;
        const isTv = item.type === "tv";
        const id = item.id;
        const baseTitle = (item.title || item.name || "Untitled").trim();
        const poster = _formatPoster(item.poster);
        const desc = item.overview || (Array.isArray(item.genres) ? item.genres.join(", ") : "");
        const year = item.year || (item.date ? parseInt(item.date.substring(0, 4), 10) : 0);
        const score = typeof item.rating === "number" ? item.rating : 0;

        // Taruh tahun di depan judul agar langsung terbaca di kartu tanpa terpotong
        const displayTitle = year > 0 ? `(${year}) ${baseTitle}` : baseTitle;

        return new MultimediaItem({
            url: isTv ? `${MAIN_URL}/tv/${id}` : `${MAIN_URL}/movie/${id}`,
            title: displayTitle,
            posterUrl: poster,
            type: isTv ? "series" : "movie",
            description: desc,
            year: year,
            score: score
        });
    }

    async function getHome(cb) {
        try {
            const data = await _fetchJson(`${API_BASE}/home`);
            if (!data) {
                return cb({ success: false, errorCode: "SITE_OFFLINE", message: "Failed to load home page from dexter.pw" });
            }

            const results = {};

            if (Array.isArray(data.hero) && data.hero.length > 0) {
                const heroItems = data.hero.map(_formatItem).filter(Boolean);
                if (heroItems.length > 0) results["Featured / Trending"] = heroItems;
            }

            if (Array.isArray(data.shelves)) {
                for (const shelf of data.shelves) {
                    const title = shelf.title || shelf.name;
                    if (title && Array.isArray(shelf.items) && shelf.items.length > 0) {
                        const items = shelf.items.map(_formatItem).filter(Boolean);
                        if (items.length > 0) results[title] = items;
                    }
                }
            }

            cb({ success: true, data: results });
        } catch (e) {
            cb({ success: false, errorCode: "PARSE_ERROR", message: e.message || String(e) });
        }
    }

    async function search(query, cb) {
        try {
            const data = await _fetchJson(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
            if (!data || !Array.isArray(data.results)) {
                return cb({ success: true, data: [] });
            }

            const items = data.results.map(_formatItem).filter(Boolean);
            cb({ success: true, data: items });
        } catch (e) {
            cb({ success: false, errorCode: "PARSE_ERROR", message: e.message || String(e) });
        }
    }

    async function load(url, cb) {
        try {
            const tvMatch = url.match(/\/tv\/(\d+)/);
            const movieMatch = url.match(/\/movie\/(\d+)/);

            if (tvMatch) {
                const showId = tvMatch[1];
                const showData = await _fetchJson(`${API_BASE}/tv/${showId}`);
                if (!showData) {
                    return cb({ success: false, errorCode: "NOT_FOUND", message: "Show not found" });
                }

                const poster = _formatPoster(showData.poster);
                const backdrop = _formatBackdrop(showData.backdrop);
                const seasonsCount = typeof showData.seasons === "number" ? showData.seasons : 1;
                const episodes = [];

                for (let s = 1; s <= seasonsCount; s++) {
                    const sData = await _fetchJson(`${API_BASE}/tv/${showId}/season/${s}`);
                    if (sData && Array.isArray(sData.episodes)) {
                        for (const ep of sData.episodes) {
                            episodes.push(new Episode({
                                name: ep.title ? `S${ep.season}E${ep.episode} - ${ep.title}` : `Episode ${ep.episode}`,
                                season: ep.season,
                                episode: ep.episode,
                                description: ep.overview || "",
                                posterUrl: _formatPoster(ep.still) || poster,
                                url: JSON.stringify({
                                    type: "tv",
                                    id: showId,
                                    season: ep.season,
                                    episode: ep.episode
                                })
                            }));
                        }
                    }
                }

                episodes.sort((a, b) => (a.season - b.season) || (a.episode - b.episode));

                return cb({
                    success: true,
                    data: new MultimediaItem({
                        url: url,
                        title: (showData.title || "Untitled").trim(),
                        type: "series",
                        posterUrl: poster,
                        backdropUrl: backdrop,
                        description: showData.overview || "",
                        year: showData.year || 0,
                        score: showData.rating || 0,
                        genres: showData.genres || [],
                        episodes: episodes
                    })
                });
            }

            if (movieMatch) {
                const movieId = movieMatch[1];
                const movieData = await _fetchJson(`${API_BASE}/movie/${movieId}`);
                if (!movieData) {
                    return cb({ success: false, errorCode: "NOT_FOUND", message: "Movie not found" });
                }

                const poster = _formatPoster(movieData.poster);
                const backdrop = _formatBackdrop(movieData.backdrop);

                const episodes = [
                    new Episode({
                        name: "Full Movie",
                        season: 1,
                        episode: 1,
                        posterUrl: poster,
                        url: JSON.stringify({
                            type: "movie",
                            id: movieId,
                            sources: movieData.sources || []
                        })
                    })
                ];

                return cb({
                    success: true,
                    data: new MultimediaItem({
                        url: url,
                        title: (movieData.title || "Untitled").trim(),
                        type: "movie",
                        posterUrl: poster,
                        backdropUrl: backdrop,
                        description: movieData.overview || "",
                        year: movieData.year || 0,
                        score: movieData.rating || 0,
                        genres: movieData.genres || [],
                        episodes: episodes
                    })
                });
            }

            cb({ success: false, errorCode: "INVALID_URL", message: "Unsupported URL pattern" });
        } catch (e) {
            cb({ success: false, errorCode: "PARSE_ERROR", message: e.message || String(e) });
        }
    }

    async function loadStreams(dataStr, cb) {
        try {
            let info = {};
            try {
                info = typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
            } catch (e) {
                return cb({ success: true, data: [] });
            }

            let rawSources = info.sources || [];

            if (info.type === "tv") {
                const epData = await _fetchJson(`${API_BASE}/tv/${info.id}/episode/${info.season}/${info.episode}`);
                if (epData && Array.isArray(epData.sources)) {
                    rawSources = epData.sources;
                }
            } else if (!rawSources.length && info.id) {
                const mData = await _fetchJson(`${API_BASE}/movie/${info.id}`);
                if (mData && Array.isArray(mData.sources)) {
                    rawSources = mData.sources;
                }
            }

            const results = [];
            const seenUrls = new Set();

            for (const src of rawSources) {
                if (src.kind === "hls" && src.url) {
                    const serverLabel = src.label || "HLS Server";
                    const masterUrl = src.url.startsWith("http") ? src.url : `${MAIN_URL}${src.url}`;

                    try {
                        const res = await http_get(masterUrl, {
                            ...STREAM_HEADERS,
                            headers: STREAM_HEADERS
                        });

                        if (res && res.body && res.body.includes("#EXTM3U")) {
                            results.push(new StreamResult({
                                url: masterUrl,
                                source: `${serverLabel} [Auto Adaptive]`,
                                quality: "Auto",
                                headers: STREAM_HEADERS
                            }));

                            const lines = res.body.split(/\r?\n/);
                            let currInf = null;
                            for (const line of lines) {
                                const trimmed = line.trim();
                                if (trimmed.startsWith("#EXT-X-STREAM-INF")) {
                                    currInf = trimmed;
                                } else if (trimmed && !trimmed.startsWith("#") && currInf) {
                                    let subUrl = trimmed;
                                    if (!subUrl.startsWith("http")) {
                                        const lastSlash = masterUrl.lastIndexOf("/");
                                        subUrl = masterUrl.substring(0, lastSlash + 1) + subUrl;
                                    }

                                    if (!seenUrls.has(subUrl)) {
                                        seenUrls.add(subUrl);
                                        let quality = "Auto";
                                        const resMatch = currInf.match(/RESOLUTION=(\d+)x(\d+)/);
                                        if (resMatch) {
                                            const w = parseInt(resMatch[1], 10);
                                            const h = parseInt(resMatch[2], 10);
                                            if (w >= 3000 || h >= 1400) quality = "4K";
                                            else if (w >= 1900 || h >= 1000) quality = "1080p";
                                            else if (w >= 1200 || h >= 700) quality = "720p";
                                            else quality = "480p";
                                        }

                                        results.push(new StreamResult({
                                            url: subUrl,
                                            source: `${serverLabel} [${quality}]`,
                                            quality: quality !== "Auto" ? quality : undefined,
                                            headers: STREAM_HEADERS
                                        }));
                                    }
                                    currInf = null;
                                }
                            }
                        } else {
                            results.push(new StreamResult({
                                url: masterUrl,
                                source: serverLabel,
                                quality: "Auto",
                                headers: STREAM_HEADERS
                            }));
                        }
                    } catch (err) {
                        results.push(new StreamResult({
                            url: masterUrl,
                            source: serverLabel,
                            quality: "Auto",
                            headers: STREAM_HEADERS
                        }));
                    }
                }
            }

            results.sort((a, b) => {
                const rank = s => {
                    const q = (s.quality || s.source || "").toLowerCase();
                    if (q.includes("4k") || q.includes("2160")) return 1;
                    if (q.includes("1080")) return 2;
                    if (q.includes("720")) return 3;
                    if (q.includes("480")) return 4;
                    if (q.includes("auto")) return 5;
                    return 6;
                };
                return rank(a) - rank(b);
            });

            cb({ success: true, data: results });
        } catch (e) {
            cb({ success: false, errorCode: "PARSE_ERROR", message: "Failed to parse streams: " + (e.message || String(e)) });
        }
    }

    globalThis.getHome = getHome;
    globalThis.search = search;
    globalThis.load = load;
    globalThis.loadStreams = loadStreams;
})();
