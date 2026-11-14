import { durationFormatter } from 'human-readable';

//
// Exported type definitions...
//
export type Player = {
    name: string,
    hero: string,
};

export type GameResult = {
    winner: string;
    players: Player[];

    start: string;
    end: string;
};

export type LeaderboardEntry = {
    wins: number;
    losses: number;
    avg: string;
    name: string;
};

export type GeneralFacts = {
    lastPlayed: string;
    totalGames: number;
    averageGame: string;
    shortestGame: string;
    longestGame: string;
};

export type AverageDurationEntry = {
    name: string;
    games: number;
    avg: string;
};

// A run of consecutive wins is only shown to the user as a "streak" once it
// reaches this length — a single win isn't a streak yet.
export const MIN_STREAK_LENGTH = 2;

export type StreakGameWin = {
    date: string;
    hero: string;
    beat: { name: string; hero: string }[];
};

export type StreakRun = {
    length: number;
    startDate: string;
    endDate: string;
    games: StreakGameWin[];
    isActive: boolean;
    endedBy: {
        name: string;
        hero: string;
        date: string;
    } | null;
};

export type WinStreakEntry = {
    name: string;
    active: number;
    longest: number;
    activeStreak: StreakRun | null;
    longestStreak: StreakRun | null;
};

// Games shorter than this are assumed to be data entry errors.
export const MIN_REAL_GAME_MINUTES = 0;
const MIN_REAL_GAME_MS = MIN_REAL_GAME_MINUTES * 60 * 1000;

const getGameDurationMs = (game: GameResult): number =>
    Date.parse(game.end) - Date.parse(game.start);

export const formatRealGameDuration = (
    game: GameResult
): string | null => {
    const ms = getGameDurationMs(game);
    return ms >= MIN_REAL_GAME_MS ? formatGameDuration(ms) : null;
};

//
// Exported funcs...
//
export const getGeneralFacts = (games: GameResult[]): GeneralFacts => {

    if (games.length === 0) {
        return {
            lastPlayed: "N/A",
            totalGames: 0,
            averageGame: "N/A",
            shortestGame: "N/A",
            longestGame: "N/A",
        };
    }

    const now = Date.now();

    const gamesLastPlayedAgoInMilliseconds = games.map(
        x => now - Date.parse(x.end)
    );

    const mostRecentlyPlayedInMilliseconds = Math.min(
        ...gamesLastPlayedAgoInMilliseconds
    );

    const gameDurationsInMilliseconds = games.map(
        getGameDurationMs
    ).filter(
        x => x >= MIN_REAL_GAME_MS
    );

    const hasRealGames = gameDurationsInMilliseconds.length > 0;

    // console.log(
    //     gamesLastPlayedAgoInMilliseconds
    // );

    return {
        lastPlayed: `${formatLastPlayed(
            mostRecentlyPlayedInMilliseconds
        )} ago`,
        totalGames: games.length,
        averageGame: hasRealGames
            ? formatGameDuration(
                gameDurationsInMilliseconds.reduce((a, b) => a + b, 0)
                    / gameDurationsInMilliseconds.length
            )
            : "N/A",
        shortestGame: hasRealGames
            ? formatGameDuration(Math.min(...gameDurationsInMilliseconds))
            : "N/A",
        longestGame: hasRealGames
            ? formatGameDuration(Math.max(...gameDurationsInMilliseconds))
            : "N/A",
    };
};

const getAverageDurations = (
    games: GameResult[],
    getKey: (p: Player) => string
): AverageDurationEntry[] => {
    const totals = new Map<string, { total: number, count: number }>();

    games.filter(
        g => getGameDurationMs(g) >= MIN_REAL_GAME_MS
    ).forEach(
        g => {
            const ms = getGameDurationMs(g);
            new Set(g.players.map(getKey)).forEach(
                key => {
                    const t = totals.get(key) ?? { total: 0, count: 0 };
                    totals.set(key, { total: t.total + ms, count: t.count + 1 });
                }
            );
        }
    );

    return [...totals.entries()].map(
        ([name, t]) => ({ name, games: t.count, avgMs: t.total / t.count })
    ).sort(
        (a, b) => b.avgMs - a.avgMs
    ).map(
        x => ({ name: x.name, games: x.games, avg: formatGameDuration(x.avgMs) })
    );
};

export const getPlayerAverageDurations = (
    games: GameResult[]
): AverageDurationEntry[] => getAverageDurations(games, p => p.name);

export const getHeroAverageDurations = (
    games: GameResult[]
): AverageDurationEntry[] => getAverageDurations(games, p => p.hero);

export const getAllGamesSorted = (
    games: GameResult[]
): GameResult[] => [...games].sort(
    (a, b) => Date.parse(b.end) - Date.parse(a.end)
);

//
// Combining games from multiple emails...
//
export const getGameKey = (
    game: GameResult
): string => [
    game.end,
    game.winner,
    game.players
        .map(p => `${p.name}~${p.hero}`)
        .sort()
        .join(","),
].join("|");

// Merge games from several emails, dropping duplicates (the same game
// stored under more than one email).
export const mergeGames = (
    gamesLists: GameResult[][]
): GameResult[] => {
    const seen = new Set<string>();
    const merged: GameResult[] = [];
    for (const game of gamesLists.flat()) {
        const key = getGameKey(game);
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(game);
        }
    }
    return merged;
};

export const getLeaderboard = (
    games: GameResult[]
): LeaderboardEntry[] => getPreviousPlayers(games)
    .map(
        x => ({
            ...getLeaderboardEntry(
                games,
                x,
            )
        })
    )
    .sort(
        (a, b) => a.avg == b.avg
            ? a.wins == 0 && b.wins == 0
                ? (a.wins + a.losses) - (b.wins + b.losses)
                : (b.wins + b.losses) - (a.wins + a.losses)
            : Number.parseFloat(b.avg) - Number.parseFloat(a.avg)
    )
;

export const getPreviousPlayers = (
    games: GameResult[]
) => games 
    .flatMap(
        x => x.players
    )
    .map(
        x => x.name
    )
    .filter(
        (x, i, a) => i == a.findIndex(
            y => y == x
        )
    )
    .sort(
        (a, b) => a.localeCompare(b)
    )
;

export const getWinStreaks = (
    games: GameResult[]
): WinStreakEntry[] => {
    const chronological = [...games].sort(
        (a, b) => Date.parse(a.end) - Date.parse(b.end)
    );

    return getPreviousPlayers(games)
        .map(
            player => getPlayerStreakEntry(chronological, player)
        )
        .sort(
            (a, b) => b.longest - a.longest
                || b.active - a.active
                || a.name.localeCompare(b.name)
        )
    ;
};

export const getHeroLeaderboard = (
    games: GameResult[]
): LeaderboardEntry[] => getPreviousHeroes(games)
    .map(
        x => ({
            ...getHeroLeaderboardEntry(
                games,
                x,
            )
        })
    )
    .sort(
        (a, b) => a.avg == b.avg
            ? a.wins == 0 && b.wins == 0
                ? (a.wins + a.losses) - (b.wins + b.losses)
                : (b.wins + b.losses) - (a.wins + a.losses)
            : Number.parseFloat(b.avg) - Number.parseFloat(a.avg)
    )
;

export const getPreviousHeroes = (
    games: GameResult[]
) => games 
    .flatMap(
        x => x.players
    )
    .map(
        x => x.hero
    )
    .filter(
        (x, i, a) => i == a.findIndex(
            y => y == x
        )
    )
    .sort(
        (a, b) => a.localeCompare(b)
    )
;

export type PlayerHeroCell = {
    player: string;
    hero: string;
    wins: number;
    losses: number;
    games: number;
};

export type PlayerHeroMatrix = {
    players: string[];
    heroes: string[];
    cells: PlayerHeroCell[];
    maxGames: number;
};

export const getPlayerHeroLeaderboard = (
    games: GameResult[]
): LeaderboardEntry[] => {
    const combos = games
        .flatMap(x => x.players)
        .map(x => ({ name: x.name, hero: x.hero }))
        .filter(
            (x, i, a) => i == a.findIndex(
                y => y.name == x.name && y.hero == x.hero
            )
        )
    ;

    return combos
        .map(
            ({ name, hero }) => {
                const matching = games.filter(
                    g => g.players.some(
                        p => p.name === name && p.hero === hero
                    )
                );
                const wins = matching.filter(
                    g => g.winner === name
                ).length;
                const totalGames = matching.length;
                const avg = totalGames > 0
                    ? wins / totalGames
                    : 0
                ;

                return {
                    wins,
                    losses: totalGames - wins,
                    avg: `${avg.toFixed(3)}`,
                    name: `${name} (${hero})`,
                };
            }
        )
        .sort(
            (a, b) => a.avg == b.avg
                ? a.wins == 0 && b.wins == 0
                    ? (a.wins + a.losses) - (b.wins + b.losses)
                    : (b.wins + b.losses) - (a.wins + a.losses)
                : Number.parseFloat(b.avg) - Number.parseFloat(a.avg)
        )
    ;
};

export const getPlayerHeroMatrix = (games: GameResult[]): PlayerHeroMatrix => {
    const allPlayers = getPreviousPlayers(games);
    const allHeroes = getPreviousHeroes(games);

    const cells: PlayerHeroCell[] = allPlayers.flatMap(player =>
        allHeroes.map(hero => {
            const matching = games.filter(g =>
                g.players.some(p => p.name === player && p.hero === hero)
            );
            const wins = matching.filter(g => g.winner === player).length;
            return { player, hero, wins, losses: matching.length - wins, games: matching.length };
        })
    );

    const maxGames = Math.max(...cells.map(c => c.games), 1);

    return {
        players: [...allPlayers].sort((a, b) => a.localeCompare(b)),
        heroes: [...allHeroes].sort((a, b) => a.localeCompare(b)),
        cells,
        maxGames,
    };
};

//
// Helper funcs...
//

// Walks a single player's games in chronological order, splitting them into
// runs of consecutive wins. Each run records the per-game detail (date,
// hero used, opponents beaten) so the UI can show a game-by-game table. The
// longest run (most recent, on ties) becomes `longestStreak`; a run still in
// progress (the player's most recent game was a win) becomes `activeStreak`
// with `isActive: true` and `endedBy: null`. `activeStreak` and
// `longestStreak` may point at the very same run when the current streak is
// also the player's best ever.
const getPlayerStreakEntry = (
    chronologicalGames: GameResult[],
    player: string,
): WinStreakEntry => {

    const playerGames = chronologicalGames.filter(
        x => x.players.some(p => p.name === player)
    );

    const runs: StreakRun[] = [];
    let current: Omit<StreakRun, 'isActive' | 'endedBy'> | null = null;

    playerGames.forEach(
        (game, i) => {
            if (game.winner === player) {
                const hero = game.players.find(p => p.name === player)!.hero;
                const win: StreakGameWin = {
                    date: game.end,
                    hero,
                    beat: game.players
                        .filter(p => p.name !== player)
                        .map(p => ({ name: p.name, hero: p.hero })),
                };

                current = current === null
                    ? { length: 1, startDate: game.end, endDate: game.end, games: [win] }
                    : {
                        ...current,
                        length: current.length + 1,
                        endDate: game.end,
                        games: [...current.games, win],
                    }
                ;

                if (i === playerGames.length - 1) {
                    runs.push({ ...current, isActive: true, endedBy: null });
                }
            } else if (current !== null) {
                const winnerHero = game.players.find(
                    p => p.name === game.winner
                )?.hero ?? "?";

                runs.push({
                    ...current,
                    isActive: false,
                    endedBy: { name: game.winner, hero: winnerHero, date: game.end },
                });
                current = null;
            }
        }
    );

    const longestStreak = runs.reduce<StreakRun | null>(
        (best, run) => !best || run.length >= best.length ? run : best,
        null
    );

    const activeStreak = runs.find(run => run.isActive) ?? null;

    return {
        name: player,
        active: activeStreak?.length ?? 0,
        longest: longestStreak?.length ?? 0,
        activeStreak,
        longestStreak,
    };
};

const getHeroLeaderboardEntry = (
    games: GameResult[],
    hero: string,
): LeaderboardEntry => {

    const countOfWins = games.filter(
        x => x.players.some(
            y => y.hero == hero && y.name == x.winner
        )
    ).length;

    const totalGames = games.filter(
        x => x.players.some(
            y => y.hero == hero
        )
    ).length;

    const avg = totalGames > 0
        ? countOfWins / totalGames
        : 0
    ;

    return {
        wins: countOfWins,
        losses: totalGames - countOfWins,
        avg: `${avg.toFixed(3)}`,
        name: hero,
    };
};

//
const formatGameDuration = durationFormatter<string>();

const formatLastPlayed = durationFormatter<string>(
    {
        allowMultiples: [
            "y",
            "mo",
            "d",
        ],
    }
);

const getLeaderboardEntry = (
    games: GameResult[],
    player: string,
): LeaderboardEntry => {

    const countOfWins = games.filter(
        x => x.winner == player
    ).length;

    const totalGames = games.filter(
        x => x.players.some(
            y => y.name == player
        )
    ).length;

    const avg = totalGames > 0
        ? countOfWins / totalGames
        : 0
    ;

    return {
        wins: countOfWins,
        losses: totalGames - countOfWins,
        avg: `${avg.toFixed(3)}`,
        name: player

    };
};
