import { useNavigate } from "react-router";
import type { GameResult, Player } from "./GameResults";
import { useEffect, useState } from "react";

type PlayProps = {
    addNewGameResult: (g: GameResult) => void;
    setTitle: (t: string) => void;
    players: Player[];
};

const STARTING_HEALTH = 50;

export const Play: React.FC<PlayProps> = ({
    addNewGameResult,
    setTitle,
    players,
}) => {

    useEffect(
        () => setTitle("Play"),
        [],
    );

    // We'll write code here...
    const nav = useNavigate();
    const [startTimestamp] = useState(new Date().toISOString());

    const [health, setHealth] = useState<Record<string, number>>(
        () => Object.fromEntries(
            players.map(
                x => [x.name, STARTING_HEALTH]
            )
        )
    );

    const adjustHealth = (name: string, delta: number) => setHealth(
        h => ({
            ...h,
            [name]: Math.max(0, (h[name] ?? STARTING_HEALTH) + delta),
        })
    );

    const resetHealth = (name: string) => setHealth(
        h => ({
            ...h,
            [name]: STARTING_HEALTH,
        })
    );

    // Then return JSX...
    return (
        <>
            {
                players.map(
                    x => (
                        <div
                            key={x.name}
                            className="card bg-base-100 w-full shadow-lg my-2"
                        >
                            <div className="card-body p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="card-title">
                                        {`${x.name} (${x.hero})`}
                                    </h2>
                                    <button
                                        className="btn btn-ghost btn-xs"
                                        onClick={
                                            () => resetHealth(x.name)
                                        }
                                    >
                                        Reset
                                    </button>
                                </div>
                                <div className="text-5xl font-bold text-center my-2">
                                    {health[x.name] ?? STARTING_HEALTH}
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {
                                        [-5, -3, -2, -1].map(
                                            n => (
                                                <button
                                                    key={n}
                                                    className="btn btn-sm btn-outline btn-error"
                                                    onClick={
                                                        () => adjustHealth(x.name, n)
                                                    }
                                                >
                                                    {n}
                                                </button>
                                            )
                                        )
                                    }
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center mt-2">
                                    {
                                        [1, 2, 3, 5].map(
                                            n => (
                                                <button
                                                    key={n}
                                                    className="btn btn-sm btn-outline btn-success"
                                                    onClick={
                                                        () => adjustHealth(x.name, n)
                                                    }
                                                >
                                                    {`+${n}`}
                                                </button>
                                            )
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    )
                )
            }
            <div className="card bg-base-100 w-full shadow-lg my-2">
                <div className="card-body p-4 sm:p-6">
                    <h2 className="card-title">Game Over</h2>
                    <div className="flex flex-col gap-2 mt-2">
                        {
                            players.map(
                                x => (
                                    <button 
                                        key={x.name}
                                        className="btn btn-primary btn-lg w-full lg:w-64"
                                        onClick={
                                            () => {
                                                addNewGameResult({
                                                    winner: x.name,
                                                    players: players,
                                                    start: startTimestamp,
                                                    end: new Date().toISOString(),
                                                });
                                                nav(-2);
                                            }
                                        }
                                    >
                                        {
                                            `${x.name} (${x.hero}) Won`
                                        }
                                    </button>
                                )
                            )
                        }
                        <button 
                            className="btn btn-lg btn-link w-full lg:w-64"
                            onClick={
                                () => nav(-2)
                            }
                        >
                            Quit
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};