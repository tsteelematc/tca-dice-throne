import { useNavigate } from "react-router";
import type { GeneralFacts, GameResult, LeaderboardEntry, PlayerHeroMatrix, PlayerHeroCell, AverageDurationEntry, WinningStreakEntry, LosingStreakEntry, WinningStreakGame } from "./GameResults";
import { formatRealGameDuration } from "./GameResults";
import { useEffect, useRef, useState } from "react";
import localforage from "localforage";

export const APP_TITLE = "My DT Life";

const FUN_FACTS = [
    { id: "general-facts", label: "General Facts" },
    { id: "player-leaderboard", label: "Player Leaderboard" },
    { id: "hero-leaderboard", label: "Hero Leaderboard" },
    { id: "player-hero-leaderboard", label: "Player + Hero Leaderboard" },
    { id: "player-hero-matrix", label: "Player × Hero Frequency" },
    { id: "player-winning-streaks", label: "Player Winning Streaks" },
    { id: "hero-winning-streaks", label: "Hero Winning Streaks" },
    { id: "player-hero-winning-streaks", label: "Player + Hero Winning Streaks" },
    { id: "player-losing-streaks", label: "Player Losing Streaks" },
    { id: "hero-losing-streaks", label: "Hero Losing Streaks" },
    { id: "player-hero-losing-streaks", label: "Player + Hero Losing Streaks" },
    { id: "slow-players", label: "Slow Players?" },
    { id: "slow-heroes", label: "Slow Heroes?" },
    { id: "all-games", label: "All Games" },
] as const;

type FunFactId = typeof FUN_FACTS[number]["id"];

const normalizeFunFactIds = (stored: unknown, defaults: FunFactId[]): FunFactId[] => {
    const validIds = new Set<string>(FUN_FACTS.map(fact => fact.id));
    const savedIds = Array.isArray(stored)
        ? stored.filter((id): id is FunFactId => typeof id === "string" && validIds.has(id))
        : [];
    return [
        ...new Set(savedIds),
        ...defaults.filter(id => !savedIds.includes(id)),
    ];
};

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
    playerLosingStreaks: LosingStreakEntry[],
    heroLosingStreaks: LosingStreakEntry[],
    playerHeroLosingStreaks: LosingStreakEntry[],
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
    playerLosingStreaks,
    heroLosingStreaks,
    playerHeroLosingStreaks,
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
    const [hiddenFunFacts, setHiddenFunFacts] = useState<FunFactId[]>([]);
    const [funFactsOrder, setFunFactsOrder] = useState<FunFactId[]>(
        FUN_FACTS.map(fact => fact.id)
    );
    const [funFactsLoaded, setFunFactsLoaded] = useState(false);
    const [restoredFunFact, setRestoredFunFact] = useState<FunFactId | null>(null);

    const [hl, setHl] = useState<{ kind: 'player' | 'hero', name: string } | null>(null);
    const [selectedStreak, setSelectedStreak] = useState<{
        name: string,
        label: string,
        games: WinningStreakGame[],
        breaker: WinningStreakGame | null,
        outcome: "wins" | "losses",
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
        outcome: "wins" | "losses",
    ) => {
        setSelectedStreak({ name, label, games, breaker, outcome });
        streakModalRef.current?.showModal();
    };

    const streakCards = [
        { id: "player-winning-streaks", title: "Player Winning Streaks", label: "PLAYER", kind: "player" as const, entries: playerWinningStreaks, outcome: "wins" as const },
        { id: "hero-winning-streaks", title: "Hero Winning Streaks", label: "HERO", kind: "hero" as const, entries: heroWinningStreaks, outcome: "wins" as const },
        { id: "player-hero-winning-streaks", title: "Player + Hero Winning Streaks", label: "PLAYER (HERO)", kind: "playerHero" as const, entries: playerHeroWinningStreaks, outcome: "wins" as const },
        { id: "player-losing-streaks", title: "Player Losing Streaks", label: "PLAYER", kind: "player" as const, entries: playerLosingStreaks, outcome: "losses" as const },
        { id: "hero-losing-streaks", title: "Hero Losing Streaks", label: "HERO", kind: "hero" as const, entries: heroLosingStreaks, outcome: "losses" as const },
        { id: "player-hero-losing-streaks", title: "Player + Hero Losing Streaks", label: "PLAYER (HERO)", kind: "playerHero" as const, entries: playerHeroLosingStreaks, outcome: "losses" as const },
    ] as const;

    useEffect(() => {
        let ignore = false;
        const loadFunFactPreferences = async () => {
            try {
                const [savedHidden, savedOrder] = await Promise.all([
                    localforage.getItem<unknown>("hiddenFunFacts"),
                    localforage.getItem<unknown>("funFactsOrder"),
                ]);
                if (!ignore) {
                    setHiddenFunFacts(normalizeFunFactIds(savedHidden, []));
                    setFunFactsOrder(normalizeFunFactIds(
                        savedOrder,
                        FUN_FACTS.map(fact => fact.id),
                    ));
                }
            } catch (error) {
                console.error("Failed to load fun fact preferences.", error);
            } finally {
                if (!ignore) {
                    setFunFactsLoaded(true);
                }
            }
        };
        void loadFunFactPreferences();
        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        if (!funFactsLoaded) return;
        void Promise.all([
            localforage.setItem("hiddenFunFacts", hiddenFunFacts),
            localforage.setItem("funFactsOrder", funFactsOrder),
        ]).catch(error => {
            console.error("Failed to save fun fact preferences.", error);
        });
    }, [funFactsLoaded, hiddenFunFacts, funFactsOrder]);

    const scrollToFunFactsSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setFunFactsNavOpen(false);
    };

    useEffect(() => {
        if (!restoredFunFact || hiddenFunFacts.includes(restoredFunFact)) return;
        document.getElementById(restoredFunFact)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setFunFactsNavOpen(false);
        setRestoredFunFact(null);
    }, [restoredFunFact, hiddenFunFacts]);

    const hideFunFact = (id: FunFactId) => {
        setHiddenFunFacts(current => current.includes(id) ? current : [...current, id]);
    };

    const showFunFact = (id: FunFactId) => {
        setHiddenFunFacts(current => current.filter(hiddenId => hiddenId !== id));
        setRestoredFunFact(id);
    };

    const moveFunFact = (id: FunFactId, delta: -1 | 1) => {
        setFunFactsOrder(current => {
            const visibleIds = current.filter(factId => !hiddenFunFacts.includes(factId));
            const index = visibleIds.indexOf(id);
            const nextIndex = index + delta;
            if (index < 0 || nextIndex < 0 || nextIndex >= visibleIds.length) return current;
            [visibleIds[index], visibleIds[nextIndex]] = [visibleIds[nextIndex], visibleIds[index]];
            let visibleIndex = 0;
            return current.map(factId => hiddenFunFacts.includes(factId)
                ? factId
                : visibleIds[visibleIndex++]
            );
        });
    };

    const orderedFunFacts = funFactsOrder
        .map(id => FUN_FACTS.find(fact => fact.id === id))
        .filter((fact): fact is typeof FUN_FACTS[number] => fact !== undefined);
    const visibleFunFacts = orderedFunFacts.filter(fact => !hiddenFunFacts.includes(fact.id));
    const hiddenFunFactItems = orderedFunFacts.filter(fact => hiddenFunFacts.includes(fact.id));

    const hideFunFactButton = (id: FunFactId, label: string) => (
        <button
            type="button"
            className="btn btn-ghost btn-xs fun-fact-hide"
            aria-label={`Hide ${label}`}
            title={`Hide ${label}`}
            onClick={() => hideFunFact(id)}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.7 10.7 0 0112 5c5.2 0 9 4.5 10 7-.4 1.1-1.3 2.5-2.7 3.7M6.2 6.2C3.9 7.7 2.5 10 2 12c1 2.5 4.8 7 10 7 1.4 0 2.7-.3 3.8-.9" />
            </svg>
        </button>
    );

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

            <div className="fun-facts-content">
            <div id="general-facts" style={{ order: funFactsOrder.indexOf("general-facts") }} hidden={hiddenFunFacts.includes("general-facts")} className="card fun-fact-card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="card-title text-nowrap ml-3">General Facts</h2>
                        {hideFunFactButton("general-facts", "General Facts")}
                    </div>
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
            <div id="player-leaderboard" style={{ order: funFactsOrder.indexOf("player-leaderboard") }} hidden={hiddenFunFacts.includes("player-leaderboard")} className="card fun-fact-card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="card-title text-nowrap ml-3">Player Leaderboard</h2>
                        {hideFunFactButton("player-leaderboard", "Player Leaderboard")}
                    </div>
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
            <div id="hero-leaderboard" style={{ order: funFactsOrder.indexOf("hero-leaderboard") }} hidden={hiddenFunFacts.includes("hero-leaderboard")} className="card fun-fact-card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="card-title text-nowrap ml-3">Hero Leaderboard</h2>
                        {hideFunFactButton("hero-leaderboard", "Hero Leaderboard")}
                    </div>
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
            <div id="player-hero-leaderboard" style={{ order: funFactsOrder.indexOf("player-hero-leaderboard") }} hidden={hiddenFunFacts.includes("player-hero-leaderboard")} className="card fun-fact-card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="card-title text-nowrap ml-3">Player + Hero Leaderboard</h2>
                        {hideFunFactButton("player-hero-leaderboard", "Player + Hero Leaderboard")}
                    </div>
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
            <div id="player-hero-matrix" style={{ order: funFactsOrder.indexOf("player-hero-matrix") }} hidden={hiddenFunFacts.includes("player-hero-matrix")} className="card fun-fact-card bg-base-100 w-full shadow-lg my-5">
                <div className="card-body p-2">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="card-title text-nowrap ml-3">Player × Hero Frequency</h2>
                        {hideFunFactButton("player-hero-matrix", "Player × Hero Frequency")}
                    </div>
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

            {streakCards.map(card => (
                <div key={card.title} id={card.id} style={{ order: funFactsOrder.indexOf(card.id) }} hidden={hiddenFunFacts.includes(card.id)} className="card fun-fact-card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                    <div className="card-body p-2">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="card-title text-nowrap ml-3">{card.title}</h2>
                            {hideFunFactButton(card.id, card.title)}
                        </div>
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
                                                                    card.outcome,
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
                                                                        card.outcome,
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

            {([
                { id: "slow-players", title: "Slow Players?", label: "PLAYER", entries: playerAverageDurations },
                { id: "slow-heroes", title: "Slow Heroes?", label: "HERO", entries: heroAverageDurations },
            ] as const).map(card => (
                <div key={card.title} id={card.id} style={{ order: funFactsOrder.indexOf(card.id) }} hidden={hiddenFunFacts.includes(card.id)} className="card fun-fact-card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                    <div className="card-body p-2">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="card-title text-nowrap ml-3">{card.title}</h2>
                            {hideFunFactButton(card.id, card.title)}
                        </div>
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

            <div id="all-games" style={{ order: funFactsOrder.indexOf("all-games") }} hidden={hiddenFunFacts.includes("all-games")} className="card fun-fact-card bg-base-100 w-full shadow-lg my-5 overflow-x-scroll">
                <div className="card-body p-2">
                    <div className="flex items-center justify-between gap-2">
                        <h2
                            className="card-title text-nowrap ml-3"
                        >
                            All Games
                        </h2>
                        {hideFunFactButton("all-games", "All Games")}
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
                                {selectedStreak.games.length} consecutive {selectedStreak.outcome}
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
                                        Beat {selectedStreak.breaker.loser
                                            ? `${selectedStreak.breaker.loser.name} (${selectedStreak.breaker.loser.hero})`
                                            : "Unknown"} on{' '}
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
                    <div className="fun-facts-nav-heading">Fun facts</div>
                    {visibleFunFacts.map((fact, index) => (
                        <div key={fact.id} className="fun-facts-nav-row">
                            <button
                                type="button"
                                className="btn btn-sm fun-facts-nav-item"
                                onClick={() => scrollToFunFactsSection(fact.id)}
                            >
                                <span className="badge badge-sm fun-facts-nav-number">{index + 1}</span>
                                {fact.label}
                            </button>
                            <div className="fun-facts-nav-reorder">
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    aria-label={`Move ${fact.label} up`}
                                    title="Move up"
                                    disabled={index === 0}
                                    onClick={() => moveFunFact(fact.id, -1)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 15 7-7 7 7" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs"
                                    aria-label={`Move ${fact.label} down`}
                                    title="Move down"
                                    disabled={index === visibleFunFacts.length - 1}
                                    onClick={() => moveFunFact(fact.id, 1)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {hiddenFunFactItems.length > 0 && (
                        <>
                            <div className="fun-facts-nav-heading fun-facts-hidden-heading">Hidden · tap eye to show</div>
                            {hiddenFunFactItems.map(fact => (
                                <button
                                    key={fact.id}
                                    type="button"
                                    className="btn btn-sm fun-facts-nav-item fun-facts-hidden-item"
                                    aria-label={`Show ${fact.label}`}
                                    title={`Show ${fact.label}`}
                                    onClick={() => showFunFact(fact.id)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7Z" />
                                        <circle cx="12" cy="12" r="2.5" />
                                    </svg>
                                    {fact.label}
                                </button>
                            ))}
                        </>
                    )}
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