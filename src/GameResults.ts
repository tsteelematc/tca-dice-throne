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

// Games shorter than this are assumed to be data entry errors.
export const MIN_REAL_GAME_MINUTES = 10;
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

export const getAllGamesSorted = (
    games: GameResult[]
): GameResult[] => [...games].sort(
    (a, b) => Date.parse(b.end) - Date.parse(a.end)
);

//
// QR share/import helpers...
//
// Encode a game as a compact, pipe-delimited string so the QR code
// stays low-version (less dense) and easier for a camera to decode.
// Format: winner|start|end|name~hero,name~hero,...
export const gameResultToQrPayload = (
    game: GameResult
): string => {
    const players = game.players.map(
        p => `${p.name}~${p.hero}`
    ).join(",");
    return [
        game.winner,
        game.start,
        game.end,
        players,
    ].join("|");
};

export const gameResultFromQrPayload = (
    payload: string
): GameResult | null => {
    try {
        const parts = payload.split("|");
        if (parts.length !== 4) {
            return null;
        }
        const [winner, start, end, playersStr] = parts;
        const players = playersStr.split(",").map(
            pair => {
                const [name, hero] = pair.split("~");
                return { name, hero };
            }
        );
        if (
            typeof winner === "string"
            && Array.isArray(players)
            && typeof start === "string"
            && typeof end === "string"
        ) {
            return {
                winner,
                players,
                start,
                end,
            } as GameResult;
        }
        return null;
    } catch {
        return null;
    }
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
