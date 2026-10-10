import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { Player } from "./GameResults";

type SetupProps = {
    setTitle: (t: string) => void;
    previousPlayers: string[];
    previousHeroes: string[];
    setCurrentPlayers: (players: Player[]) => void;
};

export const Setup: React.FC<SetupProps> = ({
    setTitle,
    previousPlayers,
    previousHeroes,
    setCurrentPlayers,
}) => {

    //
    // React hooks...
    //
    // . local state
    // . effects
    // . navigation
    //
    const [availablePlayers, setAvailablePlayers] = useState(
        previousPlayers.map(
            x => ({
                name: x,
                hero: "",
                checked: false,
            })
        )
    );

    const [availableHeroes, setAvailableHeroes] = useState(
        previousHeroes.map(
            x => ({
                name: x,
                checked: false,
            })
        )
    );

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [choosingForPlayer, setChoosingForPlayer] = useState("");
    const [newHeroName, setNewHeroName] = useState("");

    const [skippedHeroes, setSkippedHeroes] = useState<string[]>([]);
    const [extraSpinNames, setExtraSpinNames] = useState("");
    const [spinning, setSpinning] = useState(false);
    const [spinDisplay, setSpinDisplay] = useState("");
    const [spinWinner, setSpinWinner] = useState("");
    const spinTimer = useRef<number | undefined>(undefined);

    useEffect(
        () => setTitle("Setup"),
        [],
    );

    useEffect(
        () => () => window.clearTimeout(spinTimer.current),
        [],
    );

    // Dedupe only at spin time so the input text is never rewritten while typing
    const spinPool = (() => {
        const seen = new Set<string>();
        return [
            ...availableHeroes
                .map(x => x.name)
                .filter(x => !skippedHeroes.includes(x)),
            ...extraSpinNames.split(",").map(x => x.trim()),
        ].filter(x => {
            const key = x.toLowerCase();
            if (x.length === 0 || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    })();

    const selectHero = (heroName: string) => {
        setAvailablePlayers(
            availablePlayers.map(
                y => ({
                    ...y,
                    hero: y.name === choosingForPlayer
                        ? heroName
                        : y.hero
                    ,
                })
            )
        );
        const heroes = availableHeroes.some(y => y.name === heroName)
            ? availableHeroes
            : [...availableHeroes, { name: heroName, checked: false }].sort(
                (a, b) => a.name.localeCompare(b.name)
            )
        ;
        setAvailableHeroes(
            heroes.map(
                y => ({
                    name: y.name,
                    checked: y.name === heroName,
                })
            )
        );
        setDrawerOpen(false);
        setSpinWinner("");
        setSpinDisplay("");
    };

    const spin = () => {
        if (spinPool.length === 0) return;
        const winner = spinPool[Math.floor(Math.random() * spinPool.length)];
        const totalTicks = 30 + Math.floor(Math.random() * 10);
        let tick = 0;
        setSpinning(true);
        setSpinWinner("");

        const step = () => {
            tick++;
            const isLast = tick >= totalTicks;
            setSpinDisplay(
                isLast
                    ? winner
                    : spinPool[Math.floor(Math.random() * spinPool.length)]
            );
            if (isLast) {
                setSpinning(false);
                setSpinWinner(winner);
                return;
            }
            // Delay grows each tick for the dramatic slow down
            const delay = 50 + Math.pow(tick / totalTicks, 3) * 600;
            spinTimer.current = window.setTimeout(step, delay);
        };
        step();
    };

    // Dupe state : - (
    //const [dupePlayerName, setDupePlayerName] = useState(false);

    // We'll write code here...
    const nav = useNavigate();

    const [newPlayerName, setNewPlayerName] = useState("");

    //
    // Derived or calculated state or other code...
    //
    const dupePlayerName = availablePlayers.some(
        x => x.name === newPlayerName
    );

    const dupeHeroName = availableHeroes.some(
        x => x.name === newHeroName
    );

    const twoPlayersChosen = availablePlayers.filter(
            x => x.checked && x.hero.length > 0
    ).length === 2;

    //
    // Then return JSX...
    //
    return (
        <div className="drawer drawer-end">
            <input 
                id="hero-drawer" 
                type="checkbox" 
                className="drawer-toggle" 
                checked={drawerOpen}
                onChange={() => setDrawerOpen(!drawerOpen)}
            />
            <div className="drawer-content">
            <>
            <button 
                className="btn btn-primary btn-lg w-full lg:w-64"
                onClick={
                    () => {
                        setCurrentPlayers(
                            availablePlayers
                                .filter(
                                    x => x.checked
                                )
                                .map(
                                    x => ({
                                        name: x.name,
                                        hero: x.hero,
                                    })
                                )
                        );
                        nav('/play');
                    }
                }
                disabled={
                    !twoPlayersChosen
                }
            >
                {
                    !twoPlayersChosen
                        ? 'Choose 2 Players'
                        : 'Start Game'
                }
            </button>
            <button 
                className="btn btn-lg btn-link mb-3 w-full lg:w-64"
                onClick={
                    () => nav(-1)
                }
            >
                Cancel
            </button>
            <div className="card bg-base-100 w-full shadow-lg my-2">
                <div className="card-body p-4 sm:p-6">
                    <h2 className="card-title">Add Player</h2>
                    <div className="join w-full mt-2">
                        <input 
                            type="text"
                            className={`input input-lg join-item ${dupePlayerName ? 'input-error' : ''}`} 
                            placeholder="New Player Name" 
                            value={newPlayerName}
                            onChange={
                                (e) => setNewPlayerName(
                                    e.target.value
                                )
                            }
                        />
                        <button 
                            className="btn btn-lg btn-primary join-item rounded-r-full"
                            onClick={
                                () => {
                                    setAvailablePlayers(
                                        [
                                            ...availablePlayers,
                                            {
                                                name: newPlayerName,
                                                hero: "",
                                                checked: true,
                                            },
                                        ].sort(
                                            (a, b) => a.name.localeCompare(b.name)
                                        )
                                    );

                                    setChoosingForPlayer(newPlayerName);
                                    setAvailableHeroes(
                                        availableHeroes.map(
                                            f => ({
                                                name: f.name,
                                                checked: false,
                                            })
                                        )
                                    );
                                    setDrawerOpen(true);

                                    setNewPlayerName(
                                        ""
                                    );
                                }
                            }
                            disabled={
                                newPlayerName.length === 0 || dupePlayerName
                            }
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
            <div className="card bg-base-100 w-full shadow-lg my-2">
                <div className="card-body p-4 sm:p-6">
                    <h2 className="card-title">Choose 2 Players</h2>
                    <span className="badge badge-ghost badge-sm font-normal ml-0">And their Heroes</span>
                    <div className="mt-2">
                        {
                            availablePlayers.map(
                                x => (
                                    <label
                                        key={x.name}
                                        className="text-lg mt-2 flex items-center gap-1"
                                    >
                                        <input 
                                            type="checkbox"
                                            className="checkbox mr-2"
                                            checked={x.checked} 
                                            onChange={
                                                () => {
                                                    if (!x.checked) {
                                                        setChoosingForPlayer(x.name);
                                                        setAvailableHeroes(
                                                            availableHeroes.map(
                                                                f => ({
                                                                    name: f.name,
                                                                    checked: f.name === x.hero,
                                                                })
                                                            )
                                                        );
                                                        setDrawerOpen(true);
                                                    }
                                                    setAvailablePlayers(
                                                        availablePlayers.map(
                                                            y => ({
                                                                name: y.name,
                                                                hero: y.name === x.name && x.checked
                                                                    ? ""
                                                                    : y.hero,
                                                                checked: y.name === x.name
                                                                    ? !y.checked
                                                                    : y.checked
                                                                ,
                                                            })
                                                        )
                                                    );
                                                }
                                            }
                                        />
                                        {`${x.name} `}
                                        {
                                            x.hero.length > 0
                                                ? (
                                                    <>
                                                    (<a
                                                        className="link link-primary"
                                                        onClick={
                                                            (e) => {
                                                                e.preventDefault();
                                                                setChoosingForPlayer(x.name);
                                                                setAvailableHeroes(
                                                                    availableHeroes.map(
                                                                        f => ({
                                                                            name: f.name,
                                                                            checked: f.name === x.hero,
                                                                        })
                                                                    )
                                                                );
                                                                setDrawerOpen(true);
                                                            }
                                                        }
                                                    >
                                                        {x.hero}
                                                    </a>)
                                                    </>
                                                )
                                                : "(None)"
                                        }
                                    </label>
                                )
                            )
                        }
                    </div>
                </div>
            </div>
        </>
            </div>
            <div className="drawer-side">
                <label className="drawer-overlay" onClick={() => setDrawerOpen(false)}></label>
                <div className="menu bg-base-200 text-base-content min-h-full w-80 p-4">
                    <h2 className="text-lg font-bold mb-4">
                        Choose Hero for {choosingForPlayer}
                    </h2>
                    <div className="join w-full mb-4">
                        <input 
                            type="text"
                            className={`input input-lg input join-item ${dupeHeroName ? 'input-error' : ''}`}
                            placeholder="New Hero Name"
                            value={newHeroName}
                            onChange={
                                (e) => setNewHeroName(e.target.value)
                            }
                        />
                        <button 
                            className="btn btn-lg btn-primary join-item rounded-r-full"
                            onClick={
                                () => {
                                    setAvailableHeroes(
                                        [
                                            ...availableHeroes,
                                            {
                                                name: newHeroName,
                                                checked: false,
                                            },
                                        ].sort(
                                            (a, b) => a.name.localeCompare(b.name)
                                        )
                                    );
                                    setNewHeroName("");
                                }
                            }
                            disabled={
                                newHeroName.length === 0 || dupeHeroName
                            }
                        >
                            Add
                        </button>
                    </div>
                    <details className="group card bg-base-100 shadow mb-4">
                        <summary className="cursor-pointer select-none p-3 font-bold list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
                            <span>Spin for a Hero ↻</span>
                            <span className="text-base-content/60 text-xl leading-none">
                                <span className="group-open:hidden">+</span>
                                <span className="hidden group-open:inline">−</span>
                            </span>
                        </summary>
                        <div className="card-body p-3 pt-0 gap-2">
                            <input
                                type="text"
                                className="input input-sm w-full"
                                placeholder="Extra fighters, comma separated"
                                value={extraSpinNames}
                                onChange={(e) => setExtraSpinNames(e.target.value)}
                                disabled={spinning}
                            />
                            <div
                                className={`text-center text-2xl font-bold py-4 min-h-16 rounded bg-base-200 ${spinWinner ? 'text-success' : ''}`}
                            >
                                {spinDisplay || "?"}
                            </div>
                            {
                                spinWinner ? (
                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-success flex-1"
                                            onClick={() => selectHero(spinWinner)}
                                        >
                                            Use
                                        </button>
                                        <button
                                            className="btn flex-[2]"
                                            onClick={spin}
                                        >
                                            Spin ({spinPool.length}) Again
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        onClick={spin}
                                        disabled={spinning || spinPool.length === 0}
                                    >
                                        {spinning ? "Spinning..." : `Spin (${spinPool.length})`}
                                    </button>
                                )
                            }
                        </div>
                    </details>
                    {
                        availableHeroes.map(
                            x => (
                                <div
                                    key={x.name}
                                    className="text-lg mt-2 flex items-center gap-1"
                                >
                                    <label className="flex items-center flex-1">
                                        <input 
                                            type="radio"
                                            name="hero-choice"
                                            className="radio radio-lg mr-2"
                                            checked={x.checked}
                                            onChange={() => {}}
                                            onClick={() => selectHero(x.name)}
                                        />
                                        {x.name}
                                    </label>
                                    <button
                                        className="btn btn-ghost btn-xs btn-circle text-base-content/60"
                                        title={
                                            skippedHeroes.includes(x.name)
                                                ? "Not in spin (click to include)"
                                                : "In spin (click to exclude)"
                                        }
                                        disabled={spinning}
                                        onClick={
                                            () => setSkippedHeroes(
                                                skippedHeroes.includes(x.name)
                                                    ? skippedHeroes.filter(y => y !== x.name)
                                                    : [...skippedHeroes, x.name]
                                            )
                                        }
                                    >
                                        {skippedHeroes.includes(x.name) ? "✕" : "↻"}
                                    </button>
                                </div>
                            )
                        )
                    }
                </div>
            </div>
        </div>
    );
};