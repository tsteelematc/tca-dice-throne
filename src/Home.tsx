import { useNavigate } from "react-router";
import type { GeneralFacts, GameResult, LeaderboardEntry, PlayerHeroMatrix, PlayerHeroCell, AverageDurationEntry, WinStreakEntry, StreakRun } from "./GameResults";
import { formatRealGameDuration, MIN_STREAK_LENGTH } from "./GameResults";
import { useEffect, useRef, useState } from "react";

export const APP_TITLE = "My DT Life";

type HomeProps = {
    generalFacts: GeneralFacts,
    leaderboard: LeaderboardEntry[],
    heroLeaderboard: LeaderboardEntry[],
    playerHeroLeaderboard: LeaderboardEntry[],
    winStreaks: WinStreakEntry[],
    playerHeroMatrix: PlayerHeroMatrix,
    playerAverageDurations: AverageDurationEntry[],
    heroAverageDurations: AverageDurationEntry[],
    allGames: GameResult[],
    canCopyToMine: (g: GameResult) => boolean,
    copyGameToMine: (g: GameResult) => void,
    setTitle: (t: string) => void,
};

// Game-by-game breakdown for a single win streak: date, the streak-holder's
// own player (hero) that game, and who they beat — plus who (and when)
// ended the streak, if it has.
const renderStreakRun = (playerName: string, run: StreakRun) => (
    <>
        <p className="opacity-60 mb-2 text-sm">
            {run.length} in a row · {new Date(run.startDate).toLocaleDateString()} – {new Date(run.endDate).toLocaleDateString()}
        </p>
        <div className="overflow-x-auto mb-2">
            <table className="table table-zebra table-sm">
                <thead>
                    <tr>
                        <th>DATE</th>
                        <th>PLAYER (HERO)</th>
                        <th>BEAT</th>
                    </tr>
                </thead>
                <tbody>
                    {run.games.map((g, i) => (
                        <tr key={i}>
                            <td className="text-nowrap">
                                {new Date(g.date).toLocaleDateString()}
                            </td>
                            <td className="text-nowrap">
                                {playerName} ({g.hero})
                            </td>
                            <td>
                                {g.beat.map((b, j) => (
                                    <span key={b.name}>
                                        {j > 0 && ", "}
                                        {b.name} ({b.hero})
                                    </span>
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="bg-base-200 rounded-xl p-2 text-sm">
            <span className="opacity-60">Ended by: </span>
            <span className="font-semibold">
                {
                    run.endedBy
                        ? `${run.endedBy.name} (${run.endedBy.hero}) on ${new Date(run.endedBy.date).toLocaleDateString()}`
                        : "🔥 Still active!"
                }
            </span>
        </div>
    </>
);

export const Home: React.FC<HomeProps> = ({
    generalFacts,
    leaderboard,
    heroLeaderboard,
    playerHeroLeaderboard,
    winStreaks,
    playerHeroMatrix,
    playerAverageDurations,
    heroAverageDurations,
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

    const [hl, setHl] = useState<{ kind: 'player' | 'hero', name: string } | null>(null);

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

    const openHeatmapCell = (cell: PlayerHeroCell) => {
        setSelectedCell(cell);
        heatmapModalRef.current?.showModal();
    };

    const [selectedStreak, setSelectedStreak] = useState<WinStreakEntry | null>(null);

    const streakModalRef = useRef<HTMLDialogElement>(null);

    const openStreakDetail = (entry: WinStreakEntry) => {
        setSelectedStreak(entry);
        streakModalRef.current?.showModal();
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

            <div className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
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
            <div className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
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
            <div className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <h2
                        className="card-title text-nowrap ml-3"
                    >
                        Win Streaks
                    </h2>
                    {
                        winStreaks.length === 0
                            ? <p className="ml-3">N/A</p>
                            : (
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>ACTIVE</th>
                                            <th>LONGEST</th>
                                            <th>PLAYER</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            winStreaks.map(
                                                x => {
                                                    const hasLongest = x.longest >= MIN_STREAK_LENGTH;
                                                    const hasDetail = hasLongest || x.active >= MIN_STREAK_LENGTH;
                                                    return (
                                                        <tr
                                                            key={x.name}
                                                            style={rowStyle(hl?.kind === 'player' && hl.name === x.name)}
                                                        >
                                                            <td>
                                                                {
                                                                    x.active >= MIN_STREAK_LENGTH
                                                                        ? `🔥 ${x.active}`
                                                                        : x.active
                                                                }
                                                            </td>
                                                            <td>
                                                                { hasLongest ? x.longest : "—" }
                                                            </td>
                                                            <th>
                                                                { x.name }
                                                            </th>
                                                            <td>
                                                                {
                                                                    hasDetail && (
                                                                        <button
                                                                            className="btn btn-ghost btn-xs"
                                                                            onClick={() => openStreakDetail(x)}
                                                                        >
                                                                            Details
                                                                        </button>
                                                                    )
                                                                }
                                                            </td>
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
            <div className="card bg-base-100 w-full shadow-lg my-5">
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

            {[
                { title: "Slow Players?", label: "PLAYER", entries: playerAverageDurations },
                { title: "Slow Heroes?", label: "HERO", entries: heroAverageDurations },
            ].map(card => (
                <div key={card.title} className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
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

            <div className="card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
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
                <div className="modal-box max-w-xl">
                    {selectedStreak && (() => {
                        // When the active run is also the longest one (the
                        // player's current streak is their best ever) only
                        // show it once instead of two identical sections.
                        const sameRun = selectedStreak.activeStreak !== null
                            && selectedStreak.activeStreak === selectedStreak.longestStreak
                        ;

                        return (
                            <>
                                <h3 className="font-bold text-xl mb-4">{selectedStreak.name}</h3>
                                {selectedStreak.activeStreak && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-2">
                                            {sameRun ? "Current & Longest Streak" : "Active Streak"}
                                        </h4>
                                        {renderStreakRun(selectedStreak.name, selectedStreak.activeStreak)}
                                    </div>
                                )}
                                {selectedStreak.longestStreak && !sameRun && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-2">Longest Streak</h4>
                                        {renderStreakRun(selectedStreak.name, selectedStreak.longestStreak)}
                                    </div>
                                )}
                            </>
                        );
                    })()}
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

        </>
    );
};