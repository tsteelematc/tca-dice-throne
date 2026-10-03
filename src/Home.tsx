import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import type { GeneralFacts, GameResult, LeaderboardEntry, PlayerHeroMatrix, PlayerHeroCell, AverageDurationEntry } from "./GameResults";
import { gameResultFromQrPayload, gameResultToQrPayload, formatRealGameDuration } from "./GameResults";
import { scanForQr, startCameraScan, stopVideoStream } from "./qr";
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
    allGames: GameResult[],
    importGameResult: (g: GameResult) => void,
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
    allGames,
    importGameResult,
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

    const rowStyle = (on: boolean): React.CSSProperties | undefined => on
        ? { backgroundColor: 'color-mix(in srgb, var(--color-warning) 25%, transparent)' }
        : undefined
    ;
    const heatmapModalRef = useRef<HTMLDialogElement>(null);

    const openHeatmapCell = (cell: PlayerHeroCell) => {
        setSelectedCell(cell);
        heatmapModalRef.current?.showModal();
    };

    //
    // QR share + scan state...
    //
    const [shareGame, setShareGame] = useState<GameResult | null>(null);
    const shareModalRef = useRef<HTMLDialogElement>(null);
    const scanModalRef = useRef<HTMLDialogElement>(null);
    const scanVideoRef = useRef<HTMLVideoElement>(null);
    const [scanStatus, setScanStatus] = useState("");
    const [scanStream, setScanStream] = useState<MediaStream | null>(null);
    // const [scanPaste, setScanPaste] = useState("");
    const [scanning, setScanning] = useState(false);
    const scanStopRef = useRef<(() => void) | null>(null);

    const openShareModal = (game: GameResult) => {
        setShareGame(game);
        shareModalRef.current?.showModal();
    };

    const openScanModal = () => {
        setScanStatus("");
        // setScanPaste("");
        scanModalRef.current?.showModal();
    };

    const closeScanModal = () => {
        stopScan();
        scanModalRef.current?.close();
    };

    const startScan = async () => {
        const video = scanVideoRef.current;
        if (!video) return;
        setScanStatus("Requesting camera access...");
        const stream = await startCameraScan(video);
        if (!stream) {
            setScanStatus("Camera unavailable — paste the QR text below instead.");
            return;
        }
        setScanStream(stream);
        setScanning(true);
        setScanStatus("Point the camera at the QR code — it will import automatically...");
        scanStopRef.current = scanForQr(
            video,
            stream,
            handleImportPayload,
        );
    };

    const stopScan = () => {
        scanStopRef.current?.();
        scanStopRef.current = null;
        stopVideoStream(scanStream);
        setScanStream(null);
        setScanning(false);
        setScanStatus("");
    };

    const handleImportPayload = (payload: string) => {
        const game = gameResultFromQrPayload(payload);
        if (!game) {
            setScanStatus("Could not read a valid game from that QR code.");
            return;
        }
        importGameResult(game);
        stopScan();
        scanModalRef.current?.close();
    };

    // const handlePasteImport = () => {
    //     if (scanPaste.trim().length === 0) return;
    //     handleImportPayload(scanPaste.trim());
    // };

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

            {hl && (
                <div className="flex justify-center my-2">
                    <button
                        className="btn btn-ghost btn-xs opacity-70"
                        title="Clear highlight"
                        onClick={() => setHl(null)}
                    >
                        Highlighting: {hl.name} ✕
                    </button>
                </div>
            )}

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
                        <button
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Scan a QR code to import a game"
                            onClick={openScanModal}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v18H3zM7 7h10v10H7z" />
                            </svg>
                        </button>
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
                                                            style={rowStyle(
                                                                hl !== null && x.players.some(
                                                                    p => (hl.kind === 'player' ? p.name : p.hero) === hl.name
                                                                )
                                                            )}
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
                                                                    <button
                                                                        className="btn btn-ghost btn-xs btn-circle"
                                                                        title="Share this game as a QR code"
                                                                        onClick={() => openShareModal(x)}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v18H3zM7 7h10v10H7z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <th style={{ verticalAlign: 'top' }}>
                                                                { x.winner }
                                                                { winner && (
                                                                    <span className="opacity-60">
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
                                                                                { l.name }
                                                                                <span className="opacity-60">
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

            <dialog ref={shareModalRef} className="modal">
                <div className="modal-box">
                    {shareGame && (
                        <>
                            <h3 className="font-bold text-xl mb-1">Share Game</h3>
                            <p className="opacity-60 mb-4 text-sm">
                                {
                                    (() => {
                                        const winner = shareGame.players.find(
                                            p => p.name === shareGame.winner
                                        );
                                        const losers = shareGame.players.filter(
                                            p => p.name !== shareGame.winner
                                        );
                                        return (
                                            <>
                                                <span className="font-semibold opacity-100 text-base-content">
                                                    { shareGame.winner }
                                                    { winner && ` (${winner.hero})` }
                                                </span>
                                                {' beat '}
                                                {
                                                    losers.map(
                                                        (l, i) => (
                                                            <span key={l.name}>
                                                                { i > 0 && ", " }
                                                                <span className="font-semibold opacity-100 text-base-content">
                                                                    { l.name }
                                                                    {` (${l.hero})`}
                                                                </span>
                                                            </span>
                                                        )
                                                    )
                                                }
                                                {' on '}
                                                <span className="font-semibold opacity-100 text-base-content">
                                                    { new Date(shareGame.end).toLocaleDateString() }
                                                </span>
                                            </>
                                        );
                                    })()
                                }
                            </p>
                            <div className="flex justify-center my-4">
                                <QRCodeSVG
                                    value={gameResultToQrPayload(shareGame)}
                                    size={220}
                                    level="L"
                                    marginSize={4}
                                    bgColor="#FFFFFF"
                                    fgColor="#000000"
                                />
                            </div>
                            <p className="opacity-60 text-sm text-center">
                                Scan this code with another device to import this game.
                            </p>
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

            <dialog ref={scanModalRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-xl mb-1">Import Game</h3>
                    <p className="opacity-60 mb-4 text-sm">
                        Scan a QR code from another device...
                    </p>
                    <div className="flex flex-col gap-3">
                        <video
                            ref={scanVideoRef}
                            className="w-full rounded-xl bg-base-200"
                            style={{ width: '100%', aspectRatio: '4 / 3' }}
                            playsInline
                            muted
                        />
                        <div className="flex gap-2">
                            <button
                                className="btn btn-primary"
                                onClick={startScan}
                                disabled={scanning}
                            >
                                Start Camera
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={stopScan}
                                disabled={!scanning}
                            >
                                Stop
                            </button>
                        </div>
                        {/*
                        <textarea
                            className="textarea w-full"
                            placeholder="...or paste the QR text here"
                            value={scanPaste}
                            onChange={e => setScanPaste(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handlePasteImport}
                        >
                            Import Pasted Game
                        </button>
                        */}
                        { scanStatus.length > 0 && (
                            <p className="opacity-80 text-sm">{scanStatus}</p>
                        ) }
                    </div>
                    <div className="modal-action">
                        <button
                            className="btn btn-ghost"
                            onClick={closeScanModal}
                        >
                            Close
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

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



        </>
    );
};