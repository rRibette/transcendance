import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from '../config.ts';
import { useParams, useNavigate } from "react-router";
import TopBar from './TopBar';
import LifeBar from "../components/LifeBar";

type GameState =
	| "connecting"
	| "waiting_for_opponent"
	| "send_pokemon"
	| "choosing_pokemon"
	| "changing_pokemon"
	| "choosing_move"
	| "waiting_resolution"
	| "battle_over";

export interface Moves {
	name: string;
	type: string;

	power: number;
	accuracy: number;
	pp: number;
	max_pp: number;

	category: string;
	effect: string;
	flavor_text: string;
}

interface Pokemon {
	id: number;
	name: string;
	type: string[];
	hp: number;
	max_hp: number;
	attack: number;
	defense: number;
	speed: number;
	special: number;

	moves: Moves[]
}

interface EnemyPokemon {
	name: string;
	id: number;
	hp: number;
	max_hp: number
}

function GameRoom() {
	const { roomName } = useParams<{ roomName: string }>();
	const navigate = useNavigate();
	const [pokemonList, setPokemonList] = useState<Array<Pokemon>>([])
	const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
	const socketRef = useRef<WebSocket | null>(null);
	const selfid = parseInt(localStorage.getItem("id") ?? "0");
	const selfusername = localStorage.getItem("username");
	const otherusername = roomName?.split("--").find(x => x != selfusername);
	const [otherId, setOtherId] = useState<number | null>(null);

	const [gameState, setGameState] = useState<GameState>("connecting");
	const [log, setLog] = useState<string[]>([]);
	const [selectedMove, setSelectedMove] = useState<Array<Moves>>([]);
	const [team, setTeam] = useState<Array<Pokemon>>([])
	const [enemyPokemon, setEnemyPokemon] = useState<EnemyPokemon | null>(null)
	const [roomReady, setRoomReady] = useState<boolean>(false)
	let token = localStorage.getItem("access");
	let logged = false;
	if (token != null)
		logged = true;

	useEffect(() => {
		setRoomReady(false);
		const allowedusers = roomName?.split("--").filter(Boolean);
		if (!allowedusers || allowedusers.length !== 2 || allowedusers[0] === allowedusers[1] || !allowedusers.includes(selfusername ?? "")) {
			navigate("/home");
		}
	}, [roomName, selfusername, navigate]);


	useEffect(() => {
		if (!otherusername) 
			return;
		fetch(`${BACKEND_URL}/api/users/${otherusername}/`, {
			headers: { 'Accept': 'application/json' },
		})
		.then(res => res.json())
		.then(data => { 
			if (data?.id) setOtherId(data.id);
			else navigate("/home"); })
		.catch(() => {});
	}, [otherusername]);


	useEffect(() => {
		if (!otherId) 
			return;
		const allowedusers = roomName?.split("--").filter(Boolean);
		const isValidRoom = allowedusers?.length === 2 &&
		allowedusers[0] !== allowedusers[1] &&
		allowedusers.includes(selfusername ?? "");
		if (!isValidRoom) 
			return;

		const RealRoomName = selfid < otherId
		? [selfusername, otherusername].join("--")
		: [otherusername, selfusername].join("--");

		if (RealRoomName !== roomName) {
			navigate(`/gameRoom/${RealRoomName}`);
		} else {
			setRoomReady(true);
		}
	}, [roomName, selfid, otherId, otherusername, selfusername, navigate]);

	function sendMove(move: Moves) {
		if (!socketRef.current)
			return;

		socketRef.current.send(
			JSON.stringify({
				type: "move",
				move,
			})
		);

		setGameState("waiting_resolution");
	}

	function sendTeam(current_team: Array<Pokemon>, current: number) {
		if (!socketRef.current) return;

		socketRef.current.send(
			JSON.stringify({
		type: "pokemon",
		team: current_team,
		current: current,
			})
		);

		setGameState("waiting_for_opponent");
	}

	// function inTeam(pokemon: Pokemon)
	// {
	// 	for (let i = 0; i < team.length; i++)
	// 	{
	// 		if (team[i].id == pokemon.id)
	// 			return true
	// 	}
	// 	return false
	// }

	function updateTeam(current_team: Array<Pokemon>, current: number, type: string) {
		if (!socketRef.current) return;

		socketRef.current.send(
			JSON.stringify({
		type: type,
		team: current_team,
		current: current,
			})
		);

		setGameState("waiting_resolution");
	}

	function sendRandom() {
		if (!socketRef.current) return;

		setSelectedPokemon(null)
		setSelectedMove([])
		socketRef.current.send(
			JSON.stringify({
				type: "random",
			})
		);

		setGameState("waiting_for_opponent");
	}

	function addMove(move: Moves) {
		if (selectedMove.includes(move) || selectedMove.length == 4)
			return 
		setSelectedMove([...selectedMove, move])
	}

	function removeMove(toRemove: Moves) {
		let tempMoves: Array<Moves> = selectedMove.filter(
			(move) => move !== toRemove
		);

		setSelectedMove(tempMoves);
	}

	function removePokemon(toRemove: Pokemon) {
		let tempTeam: Array<Pokemon> = team.filter(
			(pokemon) => pokemon !== toRemove
		);

		setTeam(tempTeam);
	}

	function addPokemon()
	{
		if (!selectedPokemon || !team)
			return 
		const len = team.length
		let tempPoke: Pokemon = {...selectedPokemon}
		tempPoke.moves = selectedMove;
		let tempTeam: Array<Pokemon> = [...team, tempPoke]
		setTeam(tempTeam)
		if (len == 5)
			sendTeam(tempTeam, 0)
		setSelectedPokemon(null)
		setSelectedMove([])
	}

	function isSame(pokemon_1: Pokemon, pokemon_2: Pokemon)
	{
		if (pokemon_1.name != pokemon_2.name || pokemon_1.hp != pokemon_2.hp)
			return (false)
		if (pokemon_1.moves.length != pokemon_2.moves.length)
			return (false)
		for (let i = 0; i < pokemon_1.moves.length; i++)
		{
			if (pokemon_1.moves[i].pp != pokemon_2.moves[i].pp)
		return (false)
		}
		return (true)
	}

	function display()
	{
		if (gameState == "connecting" || gameState == "waiting_for_opponent" || gameState == "choosing_pokemon")
			return (false)
		return (true)
	}

	useEffect(() => {
		const token = localStorage.getItem("access");

		if (roomReady == false) {
			return ;
		}
		const socket = new WebSocket(
			"wss://" +
		window.location.host +
		"/ws/game/" +
		roomName +
		"/?token=" +
		token
		);

		socketRef.current = socket;

		socket.onopen = () => {
			setGameState("waiting_for_opponent");
		};

		socket.onmessage = (e) => {
			const data = JSON.parse(e.data);
			let msg = [""]
			if (data.message)
			{
				msg = data.message.split(";")
			}

			console.log(data)
			switch (data.type) {
				case "battle_start":
					setGameState("choosing_move");
					break;

				case "game_state":
					for (let i = 0; i < msg.length; i++){
						setLog((prev) => [...prev, msg[i]]);
					}
					console.log(data.state)
					setGameState("choosing_move");
					setTeam(data.state.your_team)
					setSelectedPokemon(data.state.current_pokemon)
					setEnemyPokemon(data.state.enemy)
					break;

				case "send_pokemon":
					for (let i = 0; i < msg.length; i++){
						setLog((prev) => [...prev, msg[i]]);
					}
					console.log(data.state)
					setGameState("send_pokemon");
					setTeam(data.state.your_team)
					setSelectedPokemon(data.state.current_pokemon)
					setEnemyPokemon(data.state.enemy)
					break;

				case "choosing_pokemon":
					setLog([])
					setTeam([])
					setSelectedPokemon(null)
					setGameState("choosing_pokemon")
					setPokemonList(data.pokemon.sort((a: Pokemon,b: Pokemon) => a.id - b.id))
					console.log(data.pokemon)
					break;
						
				case "wait":
					setGameState("waiting_resolution");
					setSelectedPokemon(data.state.current_pokemon)
					for (let i = 0; i < msg.length; i++){
						setLog((prev) => [...prev, msg[i]]);
					}
					setEnemyPokemon(data.state.enemy)
					break;

				case "turn_result":
					for (let i = 0; i < msg.length; i++){
						setLog((prev) => [...prev, msg[i]]);
					}
					console.log(data.state)
					setGameState("choosing_move");
					setTeam(data.state.your_team)
					setSelectedPokemon(data.state.current_pokemon)
					setEnemyPokemon(data.state.enemy)
					break;

				case "battle_end":
					setTeam(data.state.your_team)
					setSelectedPokemon(data.state.current_pokemon)
					setEnemyPokemon(data.state.enemy)
					setGameState("battle_over");
					for (let i = 0; i < msg.length; i++){
						setLog((prev) => [...prev, msg[i]]);
					}
					break;
					
				case "wait_beggin":
					setGameState("waiting_for_opponent")
					break;
			}
		};

		socket.onerror = console.error;

		socket.onclose = () => {
			console.log("socket closed")
			navigate("/home");
		};

		return () => socket.close();
	}, [roomName, roomReady]);
	return (
	<>
		<div className="flex flex-row bg-slate-300 justify-center">
			<TopBar logged={logged}/>
			{display() && selectedPokemon && (
				<div className="flex flex-col items-center h-screen p-25">
					<img src={`/sprites/back/${selectedPokemon.id}.png`}/>
					<LifeBar hp={selectedPokemon.hp} maxHp={selectedPokemon.max_hp} />
				</div>
			)}
			<div className="flex flex-col items-center justify-center h-dvh w-dvw gap-4 p-25">
				{/* STATUS */}
				{gameState === "waiting_for_opponent" && (
					<h1>Waiting for opponent...</h1>
				)}

				{gameState === "battle_over" && (
					<h1>Battle finished</h1>
				)}

				{/* LOG */}
				{gameState !== "choosing_pokemon" && (
				<div className="w-96 h-48 justify-center border p-2 overflow-y-auto">
					{log.map((l, i) => (
						<div className={(i % 2) ? "bg-slate-300" : "bg-slate-200"} key={i}>{l}</div>
					))}
				</div>
					)}
				{gameState === "choosing_move" && (
					<div className="flex flex-box">
						<div className="flex gap-2 flex-wrap">
							{selectedPokemon?.moves.map((move, index) => (
								<button
									key={index}
									className={`flex h-20 w-full rounded-full justify-center items-center
									text-slate-700 ${move.pp !== 0
											? "bg-blue-500 transition-all duration-300 hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
											: "bg-slate-800 text-slate-500"
									}`}
									disabled={move.pp == 0}
									onClick={() => sendMove(move)}
								>
									{move.name} {move.pp}/{move.max_pp}PP
								</button>
							))}
						</div>
						<button className="flex h-20 w-full rounded-full justify-center items-center
							text-slate-700 bg-blue-500
							transition-all duration-300
							hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
							onClick={() => setGameState("changing_pokemon")}
						>Change Pokemon
						</button>
					</div>
				)}

				{gameState === "changing_pokemon" && selectedPokemon && (
					<div className="flex flex-box">
						<div className="flex gap-2 flex-wrap">
							{team?.map((pokemon, index) => (
						(!isSame(selectedPokemon, pokemon) &&
							<button
								key={index}
								disabled={pokemon.hp == 0}
								className={`flex h-20 w-full rounded-full justify-center items-center
								text-slate-700 ${pokemon.hp !== 0
									? "bg-blue-500 transition-all duration-300 hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
									: "bg-red-500"}`}
								onClick={() => updateTeam(team, index, "changing")}
							>
								<img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}/>
								{pokemon.name} {pokemon.hp}/{pokemon.max_hp}HP
							</button>
						)
							))}
						</div>
						<button className="flex h-20 w-full rounded-full justify-center items-center
							text-slate-700 bg-blue-500
							transition-all duration-300
							hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
							onClick={() => setGameState("choosing_move")}
						>Select attack
						</button>
					</div>
				)}

				{gameState === "send_pokemon" && selectedPokemon && (
					<div className="flex gap-2 flex-wrap">
						{team?.map((pokemon, index) => (
							(!isSame(selectedPokemon, pokemon) &&
						<button
							key={index}
							disabled={pokemon.hp == 0}
							className={`flex h-20 w-full rounded-full justify-center items-center
							text-slate-700 ${pokemon.hp !== 0
							? 'bg-blue-500 transition-all duration-300 hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800'
							: 'bg-red-500'}`}
							onClick={() => updateTeam(team, index, "death")}
						>
							<img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}/>
							{pokemon.name} {pokemon.hp}/{pokemon.max_hp}HP
						</button>
							)
							))}
					</div>
				)}

				{gameState === "choosing_pokemon" && (
					<div className='flex flex-col h-full w-full'>
						{team.length > 0 ? (
							<div className="flex flex-col gap-0 w-full h-20 items-center overflow-y-none">
								<p className="flex">Your team</p>
								<div className='flex flex-row gap-2 h-30 w-full overflow justify-center'>
									{team.map((pokemon: Pokemon, index) => (
										<button 
											key={index}
											className="flex h-20 w-60 rounded-full justify-center items-center
											text-slate-700 bg-blue-500
											transition-all duration-300
											hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
											onClick={() => (removePokemon(pokemon))}
										>
											<img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}/>
											{pokemon.name}
										</button>

									))}
								</div>
							</div>
						) : (
							<div className="flex flex-col gap-0 w-full h-20 items-center overflow-y-none">
								<button className="flex h-20 w-full rounded-full justify-center items-center
										text-slate-700 bg-blue-500
										transition-all duration-300
										hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
										onClick={() => (sendRandom())}
										>Generate random team</button>
							</div>
						)}
						<div className="flex flex-row gap-2 w-full justify-start items-center pt-25 h-full">
							<div className='flex flex-col gap-2 h-full w-1/3 overflow-y-auto'>
								<p className="flex justify-center">List of pokemon</p>
								{pokemonList.map((pokemon: Pokemon) => (
									selectedPokemon !== pokemon ? (
										<button
										key={pokemon.id}
										className="flex h-20 w-full rounded-full justify-center items-center
										text-slate-700 bg-blue-500
										transition-all duration-300
										hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
										onClick={() => (setSelectedPokemon(pokemon), setSelectedMove([]))}
										>
										<img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}/>
											{pokemon.name}
										</button>
									) : (
										<button
											key={pokemon.id}
											className="flex h-20 w-full rounded-full justify-center items-center
											text-slate-700 bg-slate-500"
											onClick={() => (setSelectedPokemon(pokemon), setSelectedMove([]))}
										>
											<img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}/>
											{pokemon.name}
										</button>
									)
								))}
							</div>
							{selectedPokemon !== null && (
								<div className='flex flex-col gap-5 h-full w-1/3'>
									<div className='flex flex-col gap-2 h-full overflow-y-auto items-center'>
										<p className="flex justify-center">Allowed moves</p>
										{selectedPokemon.moves.map((moves: Moves) => (
											!selectedMove.includes(moves)	&& (
												<button
											key={moves.name}
											className="flex h-10 w-40 rounded-full justify-center items-center
											text-slate-700 bg-blue-500
											transition-all duration-300
											hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
											disabled={selectedMove.length>3}
											onClick={() => addMove(moves)}
												>
											{moves.name}
												</button>)
										))}
									</div>
									{(selectedMove.length == 4 || selectedMove.length == selectedPokemon.moves.length) && (
										<button
											className="flex h-20 w-full rounded-full justify-center items-center
											text-slate-700 bg-blue-500
											transition-all duration-300
											hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
											onClick={() => addPokemon()}
										>
											Add pokemon to team
										</button>
									)}
								</div>
							)}
							{(selectedMove?.length > 0) && (
								<div className='flex flex-col gap-2 h-full overflow-y-auto w-1/3'>
									<p className="flex justify-center">Currently selected moves</p>
									{selectedMove.map((moves: Moves) => (
										<button
											key={moves.name}
											className="flex h-20 w-full rounded-full justify-center items-center
											text-slate-700 bg-blue-500
											transition-all duration-300
											hover:bg-slate-300 hover:shadow-lg hover:scale-95 hover:text-slate-800"
											onClick={() => removeMove(moves)}
										>
											{moves.name}
										</button>)
									)}
								</div>
							)}
						</div>
					</div>
				)}
				{/* WAIT SCREEN */}
				{gameState === "waiting_resolution" && (
					<h2>Waiting for opponent...</h2>
				)}
			</div>
			{display() && enemyPokemon && (
				<div className="flex flex-col items-center h-screen p-25">
					<img src={`/sprites/front/${enemyPokemon.id}.png`}/>
					<LifeBar hp={enemyPokemon.hp} maxHp={enemyPokemon.max_hp} />
				</div>
			)}
		</div>
	</>
	);
}

export default GameRoom;