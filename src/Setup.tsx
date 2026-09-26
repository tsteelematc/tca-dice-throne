import { useEffect, useState } from "react";
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

    useEffect(
        () => setTitle("Setup"),
        [],
    );

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
                    {
                        availableHeroes.map(
                            x => (
                                <label
                                    key={x.name}
                                    className="text-lg mt-2 flex items-center gap-1"
                                >
                                    <input 
                                        type="radio"
                                        name="hero-choice"
                                        className="radio radio-lg mr-2"
                                        checked={x.checked}
                                        onChange={() => {}}
                                        onClick={
                                            () => {
                                                setAvailablePlayers(
                                                    availablePlayers.map(
                                                        y => ({
                                                            ...y,
                                                            hero: y.name === choosingForPlayer
                                                                ? x.name
                                                                : y.hero
                                                            ,
                                                        })
                                                    )
                                                );
                                                setAvailableHeroes(
                                                    availableHeroes.map(
                                                        y => ({
                                                            name: y.name,
                                                            checked: y.name === x.name,
                                                        })
                                                    )
                                                );
                                                setDrawerOpen(false);
                                            }
                                        }
                                    />
                                    {x.name}
                                </label>
                            )
                        )
                    }
                </div>
            </div>
        </div>
    );
};