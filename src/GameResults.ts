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
    shortestGame: string;
    longestGame: string;
};

//
// Exported funcs...
//
export const getGeneralFacts = (games: GameResult[]): GeneralFacts => {

    if (games.length === 0) {
        return {
            lastPlayed: "N/A",
            totalGames: 0,
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
        x => Date.parse(x.end) - Date.parse(x.start)
    );

    // console.log(
    //     gamesLastPlayedAgoInMilliseconds
    // );

    return {
        lastPlayed: `${formatLastPlayed(
            mostRecentlyPlayedInMilliseconds
        )} ago`,
        totalGames: games.length,
        shortestGame: formatGameDuration(
            Math.min(
                ...gameDurationsInMilliseconds
            ),
         ),
        longestGame: formatGameDuration(
            Math.max(
                ...gameDurationsInMilliseconds
            ),
         ),         
    };
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
