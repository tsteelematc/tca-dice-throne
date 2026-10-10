import './App.css'
import { 
  HashRouter,
  Routes,
  Route, 
} from 'react-router';
import { APP_TITLE, Home } from './Home';
import { Setup } from './Setup';
import { Play } from './Play';
import { 
  getAllGamesSorted,
  getGeneralFacts, 
  getPlayerAverageDurations,
  getHeroAverageDurations,
  getHeroLeaderboard,
  getLeaderboard,
  getPlayerHeroLeaderboard,
  getPlayerHeroMatrix,
  getPreviousHeroes,
  getPreviousPlayers, 
  getGameKey,
  mergeGames,
  type GameResult,
  type Player, 
} from './GameResults';
import { useEffect, useRef, useState } from 'react';
import localforage from 'localforage';
import {
  saveGameToCloud,
  loadGamesFromCloud,
} from './tca-cloud-api';

const DEFAULT_THEME = "light";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Dev-only sample data, kept for local testing convenience (unused in prod).
/* const dummyGameResults: GameResult[] = [
    // --- Original 2 ---
    {
        winner: "Harry",
        players: [
            { name: "Harry",    hero: "Barbarian" },
            { name: "Hermione", hero: "Monk" },
        ],
        start: "2026-02-01T18:53:59.078Z",
        end:   "2026-02-01T19:27:59.078Z",
    },
    {
        winner: "Hermione",
        players: [
            { name: "Harry",    hero: "Monk" },
            { name: "Hermione", hero: "Barbarian" },
        ],
        start: "2026-01-15T22:07:59.078Z",
        end:   "2026-01-15T23:01:59.078Z",
    },
    // --- Ron joins ---
    {
        winner: "Ron",
        players: [
            { name: "Ron",      hero: "Paladin" },
            { name: "Harry",    hero: "Shadow Thief" },
        ],
        start: "2026-01-20T14:00:00.000Z",
        end:   "2026-01-20T14:38:00.000Z",
    },
    {
        winner: "Harry",
        players: [
            { name: "Harry",    hero: "Paladin" },
            { name: "Ron",      hero: "Huntress" },
        ],
        start: "2026-01-22T19:00:00.000Z",
        end:   "2026-01-22T19:52:00.000Z",
    },
    {
        winner: "Hermione",
        players: [
            { name: "Hermione", hero: "Pyromancer" },
            { name: "Ron",      hero: "Shadow Thief" },
        ],
        start: "2026-01-25T16:30:00.000Z",
        end:   "2026-01-25T17:10:00.000Z",
    },
    // --- Luna & Neville join ---
    {
        winner: "Luna",
        players: [
            { name: "Luna",     hero: "Seraph" },
            { name: "Neville",  hero: "Artificer" },
        ],
        start: "2026-02-03T20:00:00.000Z",
        end:   "2026-02-03T20:45:00.000Z",
    },
    {
        winner: "Neville",
        players: [
            { name: "Neville",  hero: "Paladin" },
            { name: "Luna",     hero: "Pyromancer" },
        ],
        start: "2026-02-04T18:15:00.000Z",
        end:   "2026-02-04T19:00:00.000Z",
    },
    {
        winner: "Ron",
        players: [
            { name: "Ron",      hero: "Barbarian" },
            { name: "Neville",  hero: "Seraph" },
        ],
        start: "2026-02-06T21:00:00.000Z",
        end:   "2026-02-06T21:33:00.000Z",
    },
    // --- Draco joins, more variety ---
    {
        winner: "Draco",
        players: [
            { name: "Draco",    hero: "Shadow Thief" },
            { name: "Harry",    hero: "Huntress" },
        ],
        start: "2026-02-10T17:00:00.000Z",
        end:   "2026-02-10T17:48:00.000Z",
    },
    {
        winner: "Harry",
        players: [
            { name: "Harry",    hero: "Barbarian" },
            { name: "Draco",    hero: "Pyromancer" },
        ],
        start: "2026-02-11T19:00:00.000Z",
        end:   "2026-02-11T19:29:00.000Z",
    },
    {
        winner: "Hermione",
        players: [
            { name: "Hermione", hero: "Artificer" },
            { name: "Draco",    hero: "Moon Elf" },
        ],
        start: "2026-02-12T20:00:00.000Z",
        end:   "2026-02-12T21:05:00.000Z",
    },
    {
        winner: "Luna",
        players: [
            { name: "Luna",     hero: "Huntress" },
            { name: "Draco",    hero: "Shadow Thief" },
        ],
        start: "2026-02-14T15:00:00.000Z",
        end:   "2026-02-14T15:41:00.000Z",
    },
    // --- More repeat combos for heatmap depth ---
    {
        winner: "Harry",
        players: [
            { name: "Harry",    hero: "Barbarian" },
            { name: "Ron",      hero: "Paladin" },
        ],
        start: "2026-02-17T18:00:00.000Z",
        end:   "2026-02-17T18:55:00.000Z",
    },
    {
        winner: "Ron",
        players: [
            { name: "Ron",      hero: "Paladin" },
            { name: "Hermione", hero: "Seraph" },
        ],
        start: "2026-02-18T19:00:00.000Z",
        end:   "2026-02-18T19:44:00.000Z",
    },
    {
        winner: "Neville",
        players: [
            { name: "Neville",  hero: "Moon Elf" },
            { name: "Luna",     hero: "Artificer" },
        ],
        start: "2026-02-20T20:30:00.000Z",
        end:   "2026-02-20T21:15:00.000Z",
    },
    {
        winner: "Draco",
        players: [
            { name: "Draco",    hero: "Barbarian" },
            { name: "Neville",  hero: "Huntress" },
        ],
        start: "2026-02-22T17:00:00.000Z",
        end:   "2026-02-22T17:36:00.000Z",
    },
    {
        winner: "Harry",
        players: [
            { name: "Harry",    hero: "Shadow Thief" },
            { name: "Luna",     hero: "Pyromancer" },
        ],
        start: "2026-02-24T20:00:00.000Z",
        end:   "2026-02-24T20:50:00.000Z",
    },
    {
        winner: "Hermione",
        players: [
            { name: "Hermione", hero: "Barbarian" },
            { name: "Ron",      hero: "Moon Elf" },
        ],
        start: "2026-02-26T19:00:00.000Z",
        end:   "2026-02-26T19:40:00.000Z",
    },
    {
        winner: "Luna",
        players: [
            { name: "Luna",     hero: "Seraph" },
            { name: "Harry",    hero: "Artificer" },
        ],
        start: "2026-03-01T18:00:00.000Z",
        end:   "2026-03-01T18:27:00.000Z",
    },
    {
        winner: "Ron",
        players: [
            { name: "Ron",      hero: "Monk" },
            { name: "Draco",    hero: "Paladin" },
        ],
        start: "2026-03-03T21:00:00.000Z",
        end:   "2026-03-03T21:58:00.000Z",
    },
    {
        winner: "Harry",
        players: [
            { name: "Harry",    hero: "Barbarian" },
            { name: "Hermione", hero: "Moon Elf" },
        ],
        start: "2026-03-05T17:30:00.000Z",
        end:   "2026-03-05T18:12:00.000Z",
    },
    {
        winner: "Neville",
        players: [
            { name: "Neville",  hero: "Shadow Thief" },
            { name: "Ron",      hero: "Artificer" },
        ],
        start: "2026-03-07T20:00:00.000Z",
        end:   "2026-03-07T20:43:00.000Z",
    },
    {
        winner: "Draco",
        players: [
            { name: "Draco",    hero: "Pyromancer" },
            { name: "Luna",     hero: "Huntress" },
        ],
        start: "2026-03-09T19:00:00.000Z",
        end:   "2026-03-09T19:31:00.000Z",
    },
    {
        winner: "Hermione",
        players: [
            { name: "Hermione", hero: "Monk" },
            { name: "Neville",  hero: "Paladin" },
        ],
        start: "2026-03-11T18:00:00.000Z",
        end:   "2026-03-11T18:49:00.000Z",
    },
    {
        winner: "Harry",
        players: [
            { name: "Harry",    hero: "Huntress" },
            { name: "Ron",      hero: "Pyromancer" },
        ],
        start: "2026-03-13T17:00:00.000Z",
        end:   "2026-03-13T17:38:00.000Z",
    },
    {
        winner: "Luna",
        players: [
            { name: "Luna",     hero: "Moon Elf" },
            { name: "Draco",    hero: "Seraph" },
        ],
        start: "2026-03-15T20:30:00.000Z",
        end:   "2026-03-15T21:18:00.000Z",
    },
    {
        winner: "Ron",
        players: [
            { name: "Ron",      hero: "Barbarian" },
            { name: "Harry",    hero: "Monk" },
        ],
        start: "2026-03-17T19:00:00.000Z",
        end:   "2026-03-17T19:52:00.000Z",
    },
    {
        winner: "Hermione",
        players: [
            { name: "Hermione", hero: "Pyromancer" },
            { name: "Luna",     hero: "Shadow Thief" },
        ],
        start: "2026-03-19T18:30:00.000Z",
        end:   "2026-03-19T19:05:00.000Z",
    },
    {
        winner: "Neville",
        players: [
            { name: "Neville",  hero: "Seraph" },
            { name: "Draco",    hero: "Artificer" },
        ],
        start: "2026-03-21T20:00:00.000Z",
        end:   "2026-03-21T20:37:00.000Z",
    },
    {
        winner: "Harry",
        players: [
            { name: "Harry",    hero: "Barbarian" },
            { name: "Neville",  hero: "Moon Elf" },
        ],
        start: "2026-03-25T18:00:00.000Z",
        end:   "2026-03-25T18:44:00.000Z",
    },
    {
        winner: "Draco",
        players: [
            { name: "Draco",    hero: "Huntress" },
            { name: "Hermione", hero: "Paladin" },
        ],
        start: "2026-03-26T17:00:00.000Z",
        end:   "2026-03-26T17:29:00.000Z",
    },
    {
        winner: "Ron",
        players: [
            { name: "Ron",      hero: "Shadow Thief" },
            { name: "Luna",     hero: "Monk" },
        ],
        start: "2026-03-27T21:00:00.000Z",
        end:   "2026-03-27T21:41:00.000Z",
    },
]; */

const App = () => {

  // console.log(dummyGameResults);
  
  //
  // React hooks, useState, useRef, useEffect...
  //
  // const [gameResults, setGameResults] = useState(dummyGameResults);
  const [gamesByEmail, setGamesByEmail] = useState<Record<string, GameResult[]>>({});

  const [title, setTitle] = useState(APP_TITLE);

  const [theme, setTheme] = useState(DEFAULT_THEME);

  const [currentPlayers, setCurrentPlayers] = useState<Player[]>([]);
  // const currentPlayersStateTuple = useState<Player[]>([]);

  const [emailInDialog, setEmailInDialog] = useState("");

  const [emailForCoudApi, setEmailForCloudApi] = useState("");

  const [friends, setFriends] = useState<string[]>([]);
  const [friendsInDialog, setFriendsInDialog] = useState<string[]>([]);
  const [friendInput, setFriendInput] = useState("");

  // null = just my games, "all" = me and every friend, otherwise the chosen emails.
  const [selection, setSelection] = useState<string[] | "all" | null>(null);

  const emailDialog = useRef<HTMLDialogElement>(null);

  const myEmail = normalizeEmail(emailForCoudApi);
  const allEmails = [
    ...(myEmail.length > 0 ? [myEmail] : []),
    ...friends.filter(f => f !== myEmail),
  ];
  const viewedEmails = selection === "all"
    ? allEmails
    : (selection ?? []).filter(e => allEmails.includes(e))
  ;
  if (viewedEmails.length === 0 && myEmail.length > 0) {
    viewedEmails.push(myEmail);
  }

  const gameResults = mergeGames(
    viewedEmails.map(e => gamesByEmail[e] ?? [])
  );

  const myGameKeys = new Set(
    (gamesByEmail[myEmail] ?? []).map(getGameKey)
  );

  const viewLabel = selection === "all"
    ? "All"
    : viewedEmails.length === 1 && viewedEmails[0] === myEmail
      ? ""
      : `${viewedEmails.length} emails`
  ;

  useEffect(
    () => {
      const loadTheme = async () => {

        const result = await localforage.getItem<string>("theme") ?? DEFAULT_THEME;

        if (!ignore) {
          setTheme(result);
        }
      }

      let ignore = false;
      loadTheme();

      return () => {
        ignore = true;
      }
    }, 
    [],
  );  

  useEffect(
    () => {
      const loadEmail = async () => {

        const result = await localforage.getItem<string>("email") ?? "";
        const savedFriends = await localforage.getItem<string[]>("friends") ?? [];
        const savedSelection = await localforage.getItem<string[] | "all">("selectedEmails");

        if (!ignore) {
          setEmailInDialog(result);
          setEmailForCloudApi(result);
          setFriends(savedFriends);
          setFriendsInDialog(savedFriends);
          setSelection(savedSelection ?? null);
        }
      }

      let ignore = false;
      loadEmail();

      return () => {
        ignore = true;
      }
    }, 
    [],
  );  

  const emailsToLoad = allEmails.join(",");

  useEffect(
    () => {
      const loadGames = async (email: string) => {
        try {
          const games = await loadGamesFromCloud(
            email,
            "tca-dice-throne-26s"
          );

          if (!ignore) {
            setGamesByEmail(
              prev => ({ ...prev, [email]: games })
            );
          }
        }
        catch (e) {
          console.error("Could not load games for", email, e);
        }
      }

      let ignore = false;

      if (emailsToLoad.length > 0) {
        emailsToLoad.split(",").forEach(loadGames);
      }

      return () => {
        ignore = true;
      }
    }, 
    [emailsToLoad],
  );  

  //
  // Calculated state and other funcs...
  //
  const addNewGameResult = async (gameResult: GameResult) => {
    // First, save the game result to the cloud...
    if (myEmail.length > 0) {
      await saveGameToCloud(
        emailForCoudApi,
        "tca-dice-throne-26s",
        gameResult.end,
        gameResult,
      );
    }

    //
    // Second, optimistically update local state...
    //
    // Assume it was correctly saved to the cloud above : - /
    //
    setGamesByEmail(
      prev => ({
        ...prev,
        [myEmail]: [...(prev[myEmail] ?? []), gameResult],
      })
    );
  }

  //
  // Copy a friend's game to my email...
  //
  const canCopyToMine = (gameResult: GameResult) => 
    myEmail.length > 0 && !myGameKeys.has(getGameKey(gameResult))
  ;

  const copyGameToMine = async (gameResult: GameResult) => {
    if (!canCopyToMine(gameResult)) {
      return;
    }

    await saveGameToCloud(
      emailForCoudApi,
      "tca-dice-throne-26s",
      gameResult.end,
      gameResult,
    );

    setGamesByEmail(
      prev => ({
        ...prev,
        [myEmail]: [...(prev[myEmail] ?? []), gameResult],
      })
    );
  }

  const saveSelection = async (value: string[] | "all" | null) => {
    setSelection(value);
    await localforage.setItem("selectedEmails", value);
  }

  const toggleEmail = (email: string) => {
    const current = selection === "all"
      ? allEmails
      : viewedEmails
    ;
    const next = current.includes(email)
      ? current.filter(e => e !== email)
      : [...current, email]
    ;
    saveSelection(next.length === 0 ? null : next);
  }

  const addFriendInDialog = () => {
    const friend = normalizeEmail(friendInput);
    if (
      friend.length > 0 
      && friend !== normalizeEmail(emailInDialog)
      && !friendsInDialog.includes(friend)
    ) {
      setFriendsInDialog([...friendsInDialog, friend]);
    }
    setFriendInput("");
  }

  //
  // Return JSX...
  //
  return (
    <div
      className='min-h-screen'
      data-theme={ theme }
    >
      <div 
        className="navbar bg-neutral text-neutral-content flex flex-row relative z-20"
      >
        <p
          className='text-xl font-bold text-nowrap'
        >
          {
            title
          }
        </p>
        <div 
          className="ml-auto flex flex-row"
        >
          <div className="dropdown dropdown-end !static">
          <div tabIndex={0} role="button" className="flex flex-row items-center cursor-pointer">
          { viewLabel.length > 0 && (
            <span className="badge badge-sm badge-warning mr-1">{ viewLabel }</span>
          ) }
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="currentColor" 
            className="size-7"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
                      </div>
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 text-base-content rounded-box z-10 !left-0 !right-0 !top-full w-full p-2 shadow flex-nowrap overflow-hidden"
                      >
                        <li>
                          <label className="flex flex-row gap-2">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={selection === "all"}
                              onChange={
                                () => saveSelection(selection === "all" ? null : "all")
                              }
                            />
                            All
                          </label>
                        </li>
                        {
                          allEmails.map(
                            e => (
                              <li key={e}>
                                <label className="flex flex-row flex-nowrap gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm shrink-0"
                                    checked={viewedEmails.includes(e)}
                                    onChange={() => toggleEmail(e)}
                                  />
                                  <span className="truncate min-w-0 flex-1">
                                    { e === myEmail ? `Me (${e})` : e }
                                  </span>
                                </label>
                              </li>
                            )
                          )
                        }
                        <li className="border-t border-base-300 mt-1 pt-1">
                          <a
                            onClick={
                              () => {
                                (document.activeElement as HTMLElement | null)?.blur();
                                setFriendsInDialog(friends);
                                emailDialog.current?.showModal();
                              }
                            }
                          >
                            Edit...
                          </a>
                        </li>
                      </ul>
                      </div>
          <label 
            className="swap swap-rotate ml-3"
          >
            {/* this hidden checkbox controls the state */}
            <input 
              type="checkbox" 
              checked={
                DEFAULT_THEME !== theme
              }
              onChange={
                async () => {
                  const result = await localforage.setItem<string>(
                    'theme',
                    theme === DEFAULT_THEME
                      ? "dark"
                      : DEFAULT_THEME,
                  );

                  setTheme(
                    result
                  );
                }
              }
            />

            {/* sun icon */}
            <svg
              className="swap-on h-7 w-7 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24">
              <path
                d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>

            {/* moon icon */}
            <svg
              className="swap-off h-7 w-7 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24">
              <path
                d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
        </div>
      </div>
      <div 
        className="p-3"
      >
        <HashRouter>
          <Routes>
            <Route 
              path='/'
              element={
                <Home
                  setTitle={setTitle}
                  generalFacts={
                    getGeneralFacts(gameResults)
                  } 
                  leaderboard={
                    getLeaderboard(gameResults)
                  }
                  heroLeaderboard={
                    getHeroLeaderboard(gameResults)
                  }
                  playerHeroLeaderboard={
                    getPlayerHeroLeaderboard(gameResults)
                  }
                  playerHeroMatrix={
                    getPlayerHeroMatrix(gameResults)
                  }
                  playerAverageDurations={
                    getPlayerAverageDurations(gameResults)
                  }
                  heroAverageDurations={
                    getHeroAverageDurations(gameResults)
                  }
                  allGames={
                    getAllGamesSorted(gameResults)
                  }
                  canCopyToMine={canCopyToMine}
                  copyGameToMine={copyGameToMine}
                />
              }
            />
            <Route 
              path='/setup'
              element={
                <Setup 
                  setTitle={setTitle}
                  previousPlayers={
                    getPreviousPlayers(gameResults)
                  }
                  previousHeroes={
                    getPreviousHeroes(gameResults)
                  }
                  setCurrentPlayers={setCurrentPlayers}
                />
              }
            />
            <Route 
              path='/play'
              element={
                <Play 
                  setTitle={setTitle}
                  addNewGameResult={
                    addNewGameResult
                  }
                  players={currentPlayers}
                />
              }
            />          
          </Routes>
        </HashRouter>
        <dialog 
          ref={emailDialog} 
          className="modal modal-bottom sm:modal-middle"
        >
          <div className="modal-box">
            <h3 className="font-bold text-lg">Email address for loading and saving game results...</h3>
            <input 
              type="text"
              placeholder="Enter email address" 
              className="input input-bordered w-full mt-3 text-lg"
              value={emailInDialog}
              onChange={
                (e) => setEmailInDialog(
                  e.target.value
                )
              }
            />

            <h3 className="font-bold text-lg mt-4">Friends' email addresses</h3>
            <ul className="mt-2">
              {
                friendsInDialog.map(
                  f => (
                    <li key={f} className="flex flex-row items-center justify-between">
                      <span className="truncate min-w-0 flex-1">{ f }</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Remove friend"
                        onClick={
                          () => setFriendsInDialog(
                            friendsInDialog.filter(x => x !== f)
                          )
                        }
                      >
                        ✕
                      </button>
                    </li>
                  )
                )
              }
            </ul>
            <div className="flex flex-row gap-2 mt-2">
              <input 
                type="text"
                placeholder="Add friend's email" 
                className="input input-bordered w-full text-lg"
                value={friendInput}
                onChange={
                  (e) => setFriendInput(e.target.value)
                }
                onKeyDown={
                  (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFriendInDialog();
                    }
                  }
                }
              />
              <button
                className="btn btn-secondary"
                onClick={addFriendInDialog}
              >
                Add
              </button>
            </div>

            <div className="modal-action">
              <form method="dialog">
                {/* if there is a button in form, it will close the modal */}
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={
                    async () => {
                      const savedEmail = await localforage.setItem(
                        "email",
                        emailInDialog,
                      );

                      // Include a friend typed but not yet added...
                      const pending = normalizeEmail(friendInput);
                      const nextFriends = (
                        pending.length > 0 && !friendsInDialog.includes(pending)
                          ? [...friendsInDialog, pending]
                          : friendsInDialog
                      ).filter(f => f !== normalizeEmail(savedEmail));
                      setFriendInput("");

                      await localforage.setItem("friends", nextFriends);
                      setFriends(nextFriends);
                      setFriendsInDialog(nextFriends);

                      if (savedEmail.length > 0) {
                        setEmailForCloudApi(savedEmail);
                      }
                    }
                  }
                >
                  Save
                </button>
              </form>
            </div>
          </div>
        </dialog>        
      </div>
    </div>
  )
}

export default App
