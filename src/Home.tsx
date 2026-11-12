import { useNavigate } from "react-router";
import type { GeneralFacts, GameResult, LeaderboardEntry, PlayerHeroMatrix, PlayerHeroCell, AverageDurationEntry, WinningStreakEntry, WinningStreakGame } from "./GameResults";
import { formatRealGameDuration } from "./GameResults";
import { useEffect, useRef, useState } from "react";

export const APP_TITLE = "My DT Life";

type HomeProps = {
    generalFacts: GeneralFacts,
    leaderboard: LeaderboardEntry[],
    heroLeaderboard: LeaderboardEntry[],
    playerHeroLeaderboard: LeaderboardEntry[],
    playerHeroMatrix: PlayerHeroMatrix,
    playerAverageDurations: AverageDurationEntry[],
    heroAverageDurations: AverageDurationEntry[],
    playerWinningStreaks: WinningStreakEntry[],
    heroWinningStreaks: WinningStreakEntry[],
    playerHeroWinningStreaks: WinningStreakEntry[],
    allGames: GameResult[],
    canCopyToMine: (g: GameResult) => boolean,
    copyGameToMine: (g: GameResult) => void,
    setTitle: (t: string) => void,
};


export const Home: React.FC<HomeProps> = ({
    generalFacts,
    leaderboard,
    heroLeaderboard,
    playerHeroLeaderboard,
    playerHeroMatrix,
    playerAverageDurations,
    heroAverageDurations,
    playerWinningStreaks,
    heroWinningStreaks,
    playerHeroWinningStreaks,
    allGames,
    canCopyToMine,
    copyGameToMine,
    setTitle,
}) => {
    
    useEffect(
        () => setTitle(APP_TITLE),
        [],
    );

    const nav = useNavigate();

    const [selectedCell, setSelectedCell] = useState<PlayerHeroCell | null>(null);
    const [funFactsNavOpen, setFunFactsNavOpen] = useState(false);

    const [hl, setHl] = useState<{ kind: 'player' | 'hero', name: string } | null>(null);
    const [selectedStreak, setSelectedStreak] = useState<{
        name: string,
        label: string,
        games: WinningStreakGame[],
        breaker: WinningStreakGame | null,
    } | null>(null);

    const toggleHighlight = (kind: 'player' | 'hero', name: string) => setHl(
        hl?.kind === kind && hl.name === name ? null : { kind, name }
    );

    const highlightChip = (kind: 'player' | 'hero') => (
        hl?.kind === kind
            ? (
                <button
                    className="btn btn-ghost btn-xs opacity-70 ml-2 self-start"
                    title="Clear highlight"
                    onClick={() => setHl(null)}
                >
                    Highlighting: {hl.name} — tap to cancel ✕
                </button>
            )
            : (
                <span className="badge badge-ghost badge-sm font-normal ml-2 self-start">
                    Tap row to highlight
                </span>
            )
    );

    const rowStyle = (on: boolean): React.CSSProperties | undefined => on
        ? { backgroundColor: 'color-mix(in srgb, var(--color-warning) 25%, transparent)' }
        : undefined
    ;
    const heatmapModalRef = useRef<HTMLDialogElement>(null);
    const streakModalRef = useRef<HTMLDialogElement>(null);
    const openHeatmapCell = (cell: PlayerHeroCell) => {
        setSelectedCell(cell);
        heatmapModalRef.current?.showModal();
    };

    const openStreakDetails = (
        name: string,
        label: string,
        games: WinningStreakGame[],
        breaker: WinningStreakGame | null,
    ) => {
        setSelectedStreak({ name, label, games, breaker });
        streakModalRef.current?.showModal();
    };

    const winningStreakCards = [
        { id: "winning-streaks", title: "Player Winning Streaks", label: "PLAYER", kind: "player" as const, entries: playerWinningStreaks },
        { title: "Hero Winning Streaks", label: "HERO", kind: "hero" as const, entries: heroWinningStreaks },
        { title: "Player + Hero Winning Streaks", label: "PLAYER (HERO)", kind: "playerHero" as const, entries: playerHeroWinningStreaks },
    ];

    const funFactsSections = [
        { id: "general-facts", label: "General Facts" },
        { id: "leaderboards", label: "Leaderboards" },
        { id: "player-hero-matrix", label: "Player × Hero Matrix" },
        { id: "winning-streaks", label: "Winning Streaks" },
        { id: "slow-players", label: "Slow Players" },
        { id: "all-games", label: "All Games" },
    ];

    const scrollToFunFactsSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setFunFactsNavOpen(false);
    };

    // Then return JSX...
    return (
        <>
            <section className="card bg-base-100 border border-base-300 shadow-xl my-2">
                <div className="card-body p-4 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <div className="badge badge-accent badge-outline badge-lg">
                                Companion App
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold">
                                Player & Hero Win Tracker
                            </h1>
                            <p className="opacity-80 max-w-2xl">
                                Log your dice battles and enjoy some fun-facts forever.
                            </p>
                        </div>

                        <button 
                            className="btn btn-primary btn-lg w-full lg:w-auto"
                            onClick={
                                () => nav('/setup')
                            }
                        >
                            Setup a Game
                        </button>
                    </div>
                </div>
            </section>

            <div id="general-facts" className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <h2 
                        className="card-title text-nowrap ml-3"
                    >
                        General Facts
                    </h2>
                    <table className="table table-zebra">
                        <tbody>
                            <tr>
                                <td>Last Played</td>
                                <th>{generalFacts.lastPlayed}</th>
                            </tr>
                            <tr>
                                <td>Total Games</td>
                                <th>{generalFacts.totalGames}</th>
                            </tr>
                            <tr>
                                <td>Average Game</td>
                                <th>{generalFacts.averageGame}</th>
                            </tr>
                            <tr>
                                <td>Shortest Game</td>
                                <th>{generalFacts.shortestGame}</th>
                            </tr>
                            <tr>
                                <td>Longest Game</td>
                                <th>{generalFacts.longestGame}</th>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>          
            <div id="leaderboards" className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <h2 
                        className="card-title text-nowrap ml-3"
                    >
                        Player Leaderboard
                    </h2>
                    {highlightChip('player')}
                    {
                        leaderboard.length === 0
                            ? <p className="ml-3">N/A</p>
                            : (
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>W</th>
                                            <th>L</th>
                                            <th>AVG</th>
                                            <th>PLAYER</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            leaderboard.map(
                                                x => (
                                                    <tr
                                                        key={x.name}
                                                        className="cursor-pointer"
                                                        style={rowStyle(hl?.kind === 'player' && hl.name === x.name)}
                                                        onClick={() => toggleHighlight('player', x.name)}
                                                    >
                                                        <td>
                                                            { x.wins }
                                                        </td>
                                                        <td>
                                                            { x.losses }
                                                        </td>
                                                        <td>
                                                            { x.avg }
                                                        </td>
                                                        <th>
                                                            { x.name }
                                                        </th>
                                                    </tr>
                                                )
                                            )
                                        }
                                    </tbody>
                                </table>
                            )
                    }
                </div>
            </div>       
            <div className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <h2 
                        className="card-title text-nowrap ml-3"
                    >
                        Hero Leaderboard
                    </h2>
                    {highlightChip('hero')}
                    {
                        heroLeaderboard.length === 0
                            ? <p className="ml-3">N/A</p>
                            : (
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>W</th>
                                            <th>L</th>
                                            <th>AVG</th>
                                            <th>HERO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            heroLeaderboard.map(
                                                x => (
                                                    <tr
                                                        key={x.name}
                                                        className="cursor-pointer"
                                                        style={rowStyle(hl?.kind === 'hero' && hl.name === x.name)}
                                                        onClick={() => toggleHighlight('hero', x.name)}
                                                    >
                                                        <td>
                                                            { x.wins }
                                                        </td>
                                                        <td>
                                                            { x.losses }
                                                        </td>
                                                        <td>
                                                            { x.avg }
                                                        </td>
                                                        <th>
                                                            { x.name }
                                                        </th>
                                                    </tr>
                                                )
                                            )
                                        }
                                    </tbody>
                                </table>
                            )
                    }
                </div>
            </div>       
            <div className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <h2 
                        className="card-title text-nowrap ml-3"
                    >
                        Player + Hero Leaderboard
                    </h2>
                    {
                        playerHeroLeaderboard.length === 0
                            ? <p className="ml-3">N/A</p>
                            : (
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>W</th>
                                            <th>L</th>
                                            <th>AVG</th>
                                            <th>PLAYER (HERO)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            playerHeroLeaderboard.map(
                                                x => (
                                                    <tr
                                                        key={x.name}
                                                        style={rowStyle(
                                                            hl?.kind === 'player'
                                                                ? x.name.startsWith(`${hl.name} (`)
                                                                : hl?.kind === 'hero' && x.name.endsWith(`(${hl.name})`)
                                                        )}
                                                    >
                                                        <td>
                                                            { x.wins }
                                                        </td>
                                                        <td>
                                                            { x.losses }
                                                        </td>
                                                        <td>
                                                            { x.avg }
                                                        </td>
                                                        <th>
                                                            { x.name }
                                                        </th>
                                                    </tr>
                                                )
                                            )
                                        }
                                    </tbody>
                                </table>
                            )
                    }
                </div>
            </div>       
            <div id="player-hero-matrix" className="card bg-base-100 w-full shadow-lg my-5">
                <div className="card-body p-2">
                    <h2 className="card-title text-nowrap ml-3">
                        Player × Hero Frequency
                    </h2>
                    <span className="badge badge-ghost badge-sm font-normal ml-2">Tap cell for details</span>
                    {playerHeroMatrix.players.length === 0 ? (
                        <p className="ml-3">N/A</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table style={{ borderCollapse: 'separate', borderSpacing: '3px' }} className="mx-auto">
                                <thead>
                                    <tr>
                                        <th></th>
                                        {playerHeroMatrix.heroes.map(hero => (
                                            <th key={hero} style={{ verticalAlign: 'bottom', padding: '0 0 4px', textAlign: 'center', ...rowStyle(hl?.kind === 'hero' && hl.name === hero) }}>
                                                <span
                                                    className="text-xs font-medium opacity-60 text-nowrap"
                                                    style={{ display: 'inline-block', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                                >
                                                    {hero}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {playerHeroMatrix.players.map(player => (
                                        <tr key={player}>
                                            <td
                                                className="text-xs font-medium text-right pr-2 text-nowrap opacity-60"
                                                style={rowStyle(hl?.kind === 'player' && hl.name === player)}
                                            >
                                                {player}
                                            </td>
                                            {playerHeroMatrix.heroes.map(hero => {
                                                const cell = playerHeroMatrix.cells.find(
                                                    c => c.player === player && c.hero === hero
                                                )!;
                                                const intensity = cell.games > 0
                                                    ? Math.round(25 + (cell.games / playerHeroMatrix.maxGames) * 70)
                                                    : 0;
                                                return (
                                                    <td
                                                        key={hero}
                                                        className="rounded border border-base-300"
                                                        style={{
                                                            width: '2.5rem',
                                                            height: '2.5rem',
                                                            minWidth: '2.5rem',
                                                            backgroundColor: cell.games > 0
                                                                ? `color-mix(in srgb, var(--color-primary) ${intensity}%, var(--color-base-200))`
                                                                : 'var(--color-base-200)',
                                                            cursor: cell.games > 0 ? 'pointer' : 'default',
                                                        }}
                                                                        onClick={() => cell.games > 0 && openHeatmapCell(cell)}
                                                    />
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {winningStreakCards.map(card => (
                <div key={card.title} id={card.id} className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                    <div className="card-body p-2">
                        <h2 className="card-title text-nowrap ml-3">
                            {card.title}
                        </h2>
                        {card.kind !== 'playerHero' && highlightChip(card.kind)}
                        {card.entries.length === 0 ? (
                            <p className="ml-3">N/A</p>
                        ) : (
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>{card.label}</th>
                                        <th>LONGEST</th>
                                        <th>CURRENT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {card.entries.map(x => {
                                        const isHighlighted = card.kind === 'player'
                                            ? hl?.kind === 'player' && hl.name === x.name
                                            : card.kind === 'hero'
                                                ? hl?.kind === 'hero' && hl.name === x.name
                                                : hl?.kind === 'player'
                                                    ? x.name.startsWith(`${hl.name} (`)
                                                    : hl?.kind === 'hero' && x.name.endsWith(`(${hl.name})`);
                                        const onRowClick = card.kind === 'player'
                                            ? () => toggleHighlight('player', x.name)
                                            : card.kind === 'hero'
                                                ? () => toggleHighlight('hero', x.name)
                                                : undefined;
                                        return (
                                            <tr
                                                key={x.name}
                                                className={onRowClick ? "cursor-pointer" : undefined}
                                                style={rowStyle(isHighlighted)}
                                                onClick={onRowClick}
                                            >
                                                <th>{x.name}</th>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        {x.longestStreak}
                                                        <button
                                                            className="btn btn-ghost btn-xs relative top-0.5 h-5 min-h-0 px-1.5 text-[10px] leading-none"
                                                            aria-label={`View longest streak details for ${x.name}`}
                                                            title="View longest streak games"
                                                            onClick={event => {
                                                                event.stopPropagation();
                                                                openStreakDetails(
                                                                    x.name,
                                                                    'Longest',
                                                                    x.longestStreakGames,
                                                                    x.longestStreakBreaker,
                                                                );
                                                            }}
                                                        >
                                                            Details
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        {x.currentStreak}
                                                        {x.currentStreak > 0 && (
                                                            <button
                                                                className="btn btn-ghost btn-xs relative top-0.5 h-5 min-h-0 px-1.5 text-[10px] leading-none"
                                                                aria-label={`View current streak details for ${x.name}`}
                                                                title="View current streak games"
                                                                onClick={event => {
                                                                    event.stopPropagation();
                                                                    openStreakDetails(
                                                                        x.name,
                                                                        'Current',
                                                                        x.currentStreakGames,
                                                                        null,
                                                                    );
                                                                }}
                                                            >
                                                                Details
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ))}

            {[
                { id: "slow-players", title: "Slow Players?", label: "PLAYER", entries: playerAverageDurations },
                { title: "Slow Heroes?", label: "HERO", entries: heroAverageDurations },
            ].map(card => (
                <div key={card.title} id={card.id} className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                    <div className="card-body p-2">
                        <h2 className="card-title text-nowrap ml-3">
                            {card.title}
                        </h2>
                        {card.entries.length === 0 ? (
                            <p className="ml-3">N/A</p>
                        ) : (
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>{card.label}</th>
                                        <th>GAMES</th>
                                        <th>AVG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {card.entries.map(x => (
                                        <tr
                                            key={x.name}
                                            style={rowStyle(hl?.kind === (card.label === 'PLAYER' ? 'player' : 'hero') && hl.name === x.name)}
                                        >
                                            <th>{x.name}</th>
                                            <td>{x.games}</td>
                                            <td>{x.avg}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ))}

            <div id="all-games" className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <div className="flex items-center gap-2">
                        <h2
                            className="card-title text-nowrap ml-3"
                        >
                            All Games
                        </h2>
                    </div>
                    {
                        allGames.length === 0
                            ? <p className="ml-3">N/A</p>
                            : (
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>DATE</th>
                                            <th>W</th>
                                            <th>L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            allGames.map(
                                                x => {
                                                    const winner = x.players.find(
                                                        p => p.name === x.winner
                                                    );
                                                    const losers = x.players.filter(
                                                        p => p.name !== x.winner
                                                    );
                                                    return (
                                                        <tr
                                                            key={x.end}
                                                        >
                                                            <td className="text-nowrap" style={{ verticalAlign: 'top' }}>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span>
                                                                        { new Date(x.end).toLocaleDateString() }
                                                                    </span>
                                                                    { formatRealGameDuration(x) && (
                                                                        <span className="text-xs opacity-60">
                                                                            { formatRealGameDuration(x) }
                                                                        </span>
                                                                    ) }
                                                                    { canCopyToMine(x) && (
                                                                        <button
                                                                            className="btn btn-ghost btn-xs"
                                                                            title="Copy this game to my games"
                                                                            onClick={() => copyGameToMine(x)}
                                                                        >
                                                                            Copy
                                                                        </button>
                                                                    ) }
                                                                </div>
                                                            </td>
                                                            <th style={{ verticalAlign: 'top' }}>
                                                                <span style={rowStyle(hl?.kind === 'player' && hl.name === x.winner)}>
                                                                    { x.winner }
                                                                </span>
                                                                { winner && (
                                                                    <span
                                                                        className="opacity-60"
                                                                        style={rowStyle(hl?.kind === 'hero' && hl.name === winner.hero)}
                                                                    >
                                                                        {' '}({ winner.hero })
                                                                    </span>
                                                                ) }
                                                            </th>
                                                            <th style={{ verticalAlign: 'top' }}>
                                                                {
                                                                    losers.map(
                                                                        (l, i) => (
                                                                            <span key={l.name}>
                                                                                { i > 0 && ", " }
                                                                                <span style={rowStyle(hl?.kind === 'player' && hl.name === l.name)}>
                                                                                    { l.name }
                                                                                </span>
                                                                                <span
                                                                                    className="opacity-60"
                                                                                    style={rowStyle(hl?.kind === 'hero' && hl.name === l.hero)}
                                                                                >
                                                                                    {' '}({ l.hero })
                                                                                </span>
                                                                            </span>
                                                                        )
                                                                    )
                                                                }
                                                            </th>
                                                        </tr>
                                                    );
                                                }
                                            )
                                        }
                                    </tbody>
                                </table>
                            )
                    }
                </div>
            </div>

            <dialog ref={heatmapModalRef} className="modal">
                <div className="modal-box">
                    {selectedCell && (
                        <>
                            <h3 className="font-bold text-xl mb-1">{selectedCell.player}</h3>
                            <p className="opacity-60 mb-4 text-sm">
                                playing as{' '}
                                <span className="font-semibold opacity-100 text-base-content">
                                    {selectedCell.hero}
                                </span>
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                <div className="bg-base-200 rounded-xl p-3 text-center">
                                    <div className="text-xs opacity-60 mb-1">Wins</div>
                                    <div className="text-lg font-bold text-primary">{selectedCell.wins}</div>
                                </div>
                                <div className="bg-base-200 rounded-xl p-3 text-center">
                                    <div className="text-xs opacity-60 mb-1">Losses</div>
                                    <div className="text-lg font-bold">{selectedCell.losses}</div>
                                </div>
                                <div className="bg-base-200 rounded-xl p-3 text-center">
                                    <div className="text-xs opacity-60 mb-1">Games</div>
                                    <div className="text-lg font-bold">{selectedCell.games}</div>
                                </div>
                                <div className="bg-base-200 rounded-xl p-3 text-center">
                                    <div className="text-xs opacity-60 mb-1">Win %</div>
                                    <div className="text-lg font-bold">
                                        {
                                            selectedCell.games > 0
                                                ? `${(100 * selectedCell.wins / selectedCell.games).toFixed(1)}%`
                                                : "0.0%"
                                        }
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-primary">Close</button>
                        </form>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            <dialog ref={streakModalRef} className="modal">
                <div className="modal-box w-[calc(100%-1rem)] max-w-3xl">
                    {selectedStreak && (
                        <>
                            <h3 className="font-bold text-xl mb-1">
                                {selectedStreak.label} streak: {selectedStreak.name}
                            </h3>
                            <p className="opacity-60 mb-4 text-sm">
                                {selectedStreak.games.length} consecutive wins
                            </p>
                            <table className="table table-xs w-full table-fixed">
                                <colgroup>
                                    <col className="w-28" />
                                    <col />
                                    <col />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Winner</th>
                                        <th>Loser</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedStreak.games.map((game, index) => (
                                        <tr key={`${game.date}-${index}`}>
                                            <td className="whitespace-nowrap">
                                                {new Date(game.date).toLocaleDateString()}
                                            </td>
                                            <td className="break-words">
                                                {game.winner.name} ({game.winner.hero})
                                            </td>
                                            <td className="break-words">
                                                {game.loser
                                                    ? `${game.loser.name} (${game.loser.hero})`
                                                    : "Unknown"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {selectedStreak.breaker && (
                                <div className="mt-4 rounded-xl border-2 border-accent/40 bg-accent/10 p-4 shadow-inner">
                                    <div className="text-xs font-bold uppercase tracking-widest text-accent">
                                        Streak broken
                                    </div>
                                    <p className="mt-1 text-lg font-bold">
                                        {selectedStreak.breaker.winner.name} ({selectedStreak.breaker.winner.hero})
                                    </p>
                                    <p className="text-sm opacity-70">
                                        Ended this run on{' '}
                                        {new Date(selectedStreak.breaker.date).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-primary">Close</button>
                        </form>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            <nav
                className="fun-facts-nav"
                aria-label="Fun facts navigation"
                onKeyDown={event => {
                    if (event.key === "Escape") {
                        setFunFactsNavOpen(false);
                    }
                }}
            >
                <div
                    id="fun-facts-nav-menu"
                    className="fun-facts-nav-menu"
                    hidden={!funFactsNavOpen}
                >
                    <div className="fun-facts-nav-heading">Jump to fun facts</div>
                    {funFactsSections.map((section, index) => (
                        <button
                            key={section.id}
                            type="button"
                            className="btn btn-sm fun-facts-nav-item"
                            onClick={() => scrollToFunFactsSection(section.id)}
                        >
                            <span className="badge badge-sm fun-facts-nav-number">
                                {index + 1}
                            </span>
                            {section.label}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="btn btn-primary btn-circle shadow-lg"
                    aria-label={funFactsNavOpen ? "Close fun facts navigation" : "Open fun facts navigation"}
                    aria-expanded={funFactsNavOpen}
                    aria-controls="fun-facts-nav-menu"
                    title="Fun facts navigation"
                    onClick={() => setFunFactsNavOpen(open => !open)}
                >
                    {funFactsNavOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5" />
                        </svg>
                    )}
                </button>
            </nav>
        </>
    );
};