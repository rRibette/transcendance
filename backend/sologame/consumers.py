import json
import os
import copy
from channels.generic.websocket import AsyncWebsocketConsumer
from game.models import Pokemon, Move
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from random import choice, randint, sample

ROOMS = {}
User = get_user_model()
temp = Pokemon.objects.prefetch_related("moves")

@database_sync_to_async
def get_user_from_token(token):
	access = AccessToken(token)  # Verifies signature and expiration
	return User.objects.get(id=access["user_id"])

pokemon = [
	{
		"id": p.id,
		"name": p.name,
		"type": p.type,
		"hp": p.hp,
		"max_hp": p.max_hp,
		"attack": p.attack,
		"defense": p.defense,
		"speed": p.speed,
		"special": p.special,
		"attack_modifier": 0,
		"defense_modifier": 0,
		"speed_modifier": 0,
		"evasiveness_modifier": 0,
		"accuracy_modifier": 0,
		"special_modifier": 0,
		"is_stunned": False,
		"status": None,
		"moves": list(p.moves.values(
				"name",
				"type",
				"power",
				"accuracy",
				"pp",
				"max_pp",
				"category",
				"effect",
				"flavor_text",
			)),
	}
	for p in temp
]
class SoloGameConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		query = parse_qs(self.scope["query_string"].decode())
		token = query.get("token", [None])[0]

		if token is None:
			await self.close()
			return

		try:
			self.user = await get_user_from_token(token)
		except (TokenError, User.DoesNotExist):
			await self.close()
			return

		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
		self.username = self.user.username

		await self.accept()

		if self.room_name not in ROOMS:
			ROOMS[self.room_name] = {
				"players": {},
				"teams": {},
				"moves": {},
			}

		ROOMS[self.room_name]["players"][self.username] = self.channel_name
		ROOMS[self.room_name]["players"]["AI"] = None

		await self.send(json.dumps({
			"type": "choosing_pokemon",
			"pokemon": pokemon,
		}))


	async def receive(self, text_data):
		data = json.loads(text_data)
		room = ROOMS[self.room_name]

		if data["type"] == "pokemon":
			room["teams"][self.username] = {
				"team": data["team"],
				"current": data["current"],
			}

			room["teams"]["AI"] = {
				"team": self.generate_team(),
				"current": 0,
			}

			await self.send_start()

		elif data["type"] == "move":
			room["moves"][self.username] = data["move"]
			room["moves"]["AI"] = self.choose_ai_move()

			await self.resolve_turn()

		elif data["type"] == "changing":
			room["teams"][self.username] = {
				"team": data["team"],
				"current": data["current"],
			}

			room["moves"][self.username] = {"name": "change"}
			room["moves"]["AI"] = self.choose_ai_move()

			await self.resolve_turn()

		elif data["type"] == "death":
			room["teams"][self.username] = {
				"team": data["team"],
				"current": data["current"],
			}
			await self.send_switch(self.username)
		
		elif data["type"] == "random":
			room["teams"][self.username] = {
				"team": self.generate_team(),
				"current": 0
			}
			room["teams"]["AI"] = {
				"team": self.generate_team(),
				"current": 0,
			}

			await self.send_start()

	async def disconnect(self, code):
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
		room = ROOMS.get(self.room_name)
		if room:
			room["players"] = {}
			room["teams"] = {}
			room["moves"] = {}
			if not room["players"]:
				del ROOMS[self.room_name]


	def generate_team(self):
		team = []

		for p in sample(pokemon, 6):
			pokemon_copy = copy.deepcopy(p)

			available_moves = pokemon_copy["moves"]

			if len(available_moves) >= 4:
				pokemon_copy["moves"] = sample(available_moves, 4)
			else:
				pokemon_copy["moves"] = available_moves

				while len(pokemon_copy["moves"]) < 4:
					pokemon_copy["moves"].append({
						"name": None,
						"type": None,
						"power": 0,
						"accuracy": 0,
						"pp": 0,
						"max_pp": 0,
						"category": None,
						"effect": {},
						"flavor_text": ""
					})

			team.append(pokemon_copy)

		return team



	def choose_ai_move(self):
		room = ROOMS[self.room_name]
		ai_team = room["teams"]["AI"]
		player = room["players"]
		player_name = next(name for name in player if name != "AI")
		ai_pokemon = ai_team["team"][ai_team["current"]]
		enemy = room["teams"][player_name]["team"][room["teams"][player_name]["current"]]
		best_move = None
		best_score = -1
		for move in ai_pokemon["moves"]:
			if move["pp"] == 0:
				continue
			score = 0
			if move.get("power"):
				score = ( move["power"] * self.get_affinity(move, enemy) * (move.get("accuracy", 100) / 100) )
			if score > best_score:
				best_score = score
				best_move = move
		if best_move is None:
			for move in ai_pokemon["moves"]:
				if (move["pp"] != 0):
					best_move = move
		
		if best_move is None:
			return ai_pokemon["moves"][0]

		return best_move


	def choose_ai_switch(self):
		room = ROOMS[self.room_name]

		ai_team = room["teams"]["AI"]["team"]
		current = room["teams"]["AI"]["current"]

		available = [
			i for i, pokemon in enumerate(ai_team)
			if pokemon["hp"] > 0 and i != current
		]

		if available:
			return choice(available)

		return current


	async def send_switch(self, username):
		room = ROOMS[self.room_name]
		usernames = list(room["players"].keys())
		p1, p2 = usernames[0], usernames[1]
		p1_team = room["teams"][p1]
		p2_team = room["teams"][p2]

		p1_current = p1_team["team"][p1_team["current"]]
		p2_current = p2_team["team"][p2_team["current"]]
		if username == p1:
			msg_1, msg_2 = f"go {p1_current["name"]}!", f"{username} sent {p1_current["name"]}"
		else:
			msg_2, msg_1 = f"go {p2_current["name"]}!", f"{username} sent {p2_current["name"]}"
				
		room["moves"] = {}
		await self.channel_layer.send(
			room["players"][p1],
			{
				"type": "turn_result",
				"state": {
					"your_team": p1_team["team"],
					"current_pokemon": p1_current,
					"enemy": {
						"status": p2_current["status"],
						"name": p2_current["name"],
						"id": p2_current["id"],
						"hp": p2_current["hp"],
						"max_hp": p2_current["max_hp"]
					}
				},
				"message": msg_1
			}
		)


	def hit(self, attacking, move, defending):
		accuracy = move["accuracy"]
		if (attacking["accuracy_modifier"] < 0):
			accuracy /= (1 + (0.5 * abs(attacking["accuracy_modifier"])))
		if (defending["evasiveness_modifier"] > 0):
			accuracy /= (1 + (0.5 * defending["evasiveness_modifier"]))
		if (randint(1, 100) <= accuracy):
			return (True)
		return (False)


	def change_modifier(self, attacking, move, defending):
		modifier_name = f"{move["effect"]["stat"]}_modifier"
		modifier = move["effect"]["stages"]
		multi = self.get_affinity(move, defending)
		affinity_msg = ""
		if (multi > 1):
			affinity_msg = ";it is very effective"
		elif (multi < 1):
			affinity_msg = ";it is not very effective"
		elif (multi == 0):
			affinity_msg = ";but it failed"
		if (modifier < 0):
			defending[modifier_name] += modifier
			msg = f"{attacking["name"]} used {move["name"]}{affinity_msg};{defending["name"]}'s {move["effect"]["stat"]} "
			if (defending[modifier_name] < -6):
				defending[modifier_name] = -6
				return (msg + "cannot go lower", f"enemy " + msg + "cannot go lower")
			elif (modifier == -1):
				return (msg + "fell", f"enemy " + msg + "fell")
			else:
				return (msg + "fell sharply", f"enemy " + msg + "fell sharply")
		msg = f"{attacking["name"]} used {move["name"]};{attacking["name"]}'s {move["effect"]["stat"]} "
		attacking[modifier_name] += modifier
		if (attacking[modifier_name] > 6):
			attacking[modifier_name] = 6
			return (msg + "is already maxed", f"enemy " + msg + "is already maxed")
		elif (modifier == 1):
			return (msg + "rose", f"enemy " + msg + "rose")
		else:
			return (msg + "rose sharply", f"enemy " + msg + "rose sharply")


	def get_affinity(self, move, defending):
		if (("type" not in move) or (not move["power"])):
			return 1
		type_table = {"normal": {"normal": 1, "fire": 1, "water": 1, "grass": 1, "electric": 1, "ice": 1, "fighting": 1, "poison": 1, "ground": 1, "flying": 1, "psychic": 1, "bug": 1, "rock": 0.5, "ghost": 0, "dragon": 1},
				"fire": {"normal": 1, "fire": 0.5, "water": 0.5, "grass": 2, "electric": 1, "ice": 2, "fighting": 1, "poison": 1, "ground": 1, "flying": 1, "psychic": 1, "bug": 2, "rock": 0.5, "ghost": 1, "dragon": 0.5},
				"water": {"normal": 1, "fire": 2, "water": 0.5, "grass": 0.5, "electric": 1, "ice": 1, "fighting": 1, "poison": 1, "ground": 2, "flying": 1, "psychic": 1, "bug": 1, "rock": 2, "ghost": 1, "dragon": 0.5},
				"grass": {"normal": 1, "fire": 0.5, "water": 2, "grass": 0.5, "electric": 1, "ice": 1, "fighting": 1, "poison": 0.5, "ground": 2, "flying": 0.5, "psychic": 1, "bug": 0.5, "rock": 2, "ghost": 1, "dragon": 0.5},
				"electric": {"normal": 1, "fire": 1, "water": 2, "grass": 0.5, "electric": 0.5, "ice": 1, "fighting": 1, "poison": 1, "ground": 0, "flying": 2, "psychic": 1, "bug": 1, "rock": 1, "ghost": 1, "dragon": 0.5},
				"ice": {"normal": 1, "fire": 1, "water": 0.5, "grass": 2, "electric": 1, "ice": 0.5, "fighting": 1, "poison": 1, "ground": 2, "flying": 2, "psychic": 1, "bug": 1, "rock": 1, "ghost": 1, "dragon": 2},
				"fighting": {"normal": 2, "fire": 1, "water": 1, "grass": 1, "electric": 1, "ice": 2, "fighting": 1, "poison": 0.5, "ground": 1, "flying": 0.5, "psychic": 0.5, "bug": 0.5, "rock": 2, "ghost": 0, "dragon": 1},
				"poison": {"normal": 1, "fire": 1, "water": 1, "grass": 2, "electric": 1, "ice": 1, "fighting": 1, "poison": 0.5, "ground": 0.5, "flying": 1, "psychic": 1, "bug": 2, "rock": 0.5, "ghost": 0.5, "dragon": 1},
				"ground": {"normal": 1, "fire": 2, "water": 1, "grass": 0.5, "electric": 2, "ice": 1, "fighting": 1, "poison": 2, "ground": 1, "flying": 0, "psychic": 1, "bug": 0.5, "rock": 2, "ghost": 1, "dragon": 1},
				"flying": {"normal": 1, "fire": 1, "water": 1, "grass": 2, "electric": 1, "ice": 1, "fighting": 2, "poison": 1, "ground": 1, "flying": 1, "psychic": 1, "bug": 2, "rock": 0.5, "ghost": 1, "dragon": 1},
				"psychic": {"normal": 1, "fire": 1, "water": 1, "grass": 1, "electric": 1, "ice": 1, "fighting": 2, "poison": 2, "ground": 1, "flying": 1, "psychic": 0.5, "bug": 1, "rock": 1, "ghost": 1, "dragon": 1},
				"bug": {"normal": 1, "fire": 0.5, "water": 1, "grass": 2, "electric": 1, "ice": 1, "fighting": 0.5, "poison": 2, "ground": 1, "flying": 0.5, "psychic": 2, "bug": 1, "rock": 1, "ghost": 0.5, "dragon": 1},
				"rock": {"normal": 1, "fire": 2, "water": 1, "grass": 1, "electric": 1, "ice": 2, "fighting": 0.5, "poison": 1, "ground": 0.5, "flying": 2, "psychic": 1, "bug": 2, "rock": 1, "ghost": 1, "dragon": 1},
				"ghost": {"normal": 0, "fire": 1, "water": 1, "grass": 1, "electric": 1, "ice": 1, "fighting": 1, "poison": 1, "ground": 1, "flying": 1, "psychic": 0, "bug": 1, "rock": 1, "ghost": 0, "dragon": 1},
				"dragon": {"normal": 1, "fire": 1, "water": 1, "grass": 1, "electric": 1, "ice": 1, "fighting": 1, "poison": 1, "ground": 1, "flying": 1, "psychic": 1, "bug": 1, "rock": 1, "ghost": 1, "dragon": 2}
		}
		multiplier = 1
		for type in defending["type"]:
			multiplier *= type_table[move["type"]][type]
		return multiplier


	def calculate_damage(self, attacking, move, defending):
		power = move["power"] 
		if (not move["power"]):
			power = 1
		attack = attacking["attack"]
		if (attacking["attack_modifier"] > 0):
			attack = attack * (1 + 0.5 * attacking["attack_modifier"])
		elif (attacking["attack_modifier"] < 0):
			attack = attack / (1 + 0.5 * abs(attacking["attack_modifier"]))
		defense = defending["defense"]
		if (defending["defense_modifier"] > 0):
			defense = defense * (1 + 0.5 * defending["defense_modifier"])
		elif (defending["defense_modifier"] < 0):
			defense = defense / (1 + 0.5 * abs(defending["defense_modifier"]))
		defending["hp"] = max(0, defending["hp"] - (self.get_affinity(move, defending) * power * attack / defense))


	def calculate_special_damage(self, attacking, move, defending):
		power = move["power"] 
		if (not move["power"]):
			power = 1
		special_atk = attacking["special"]
		if (attacking["special_modifier"] > 0):
			special_atk = special_atk * (1 + 0.5 * attacking["special_modifier"])
		elif (attacking["special_modifier"] < 0):
			special_atk = special_atk / (1 + 0.5 * abs(attacking["special_modifier"]))
		special_def = defending["special"]
		if (defending["special_modifier"] > 0):
			special_def = special_def * (1 + 0.5 * defending["special_modifier"])
		elif (defending["special_modifier"] < 0):
			special_def = special_def / (1 + 0.5 * abs(defending["special_modifier"]))
		defending["hp"] = max(0, defending["hp"] - (self.get_affinity(move, defending) * power * special_atk / special_def))


	def pokecopy(self, attacking, defending):
		attacking["id"] = defending["id"]
		attacking["type"] = copy.copy(defending["type"])
		attacking["moves"] = copy.copy(defending["moves"])
		attacking["attack"] = defending["attack"]
		attacking["defense"] = defending["defense"]
		attacking["special"] = defending["special"]
		attacking["speed"] = defending["speed"]
		attacking["attack_modifier"] = defending["attack_modifier"]
		attacking["defense_modifier"] = defending["defense_modifier"]
		attacking["speed_modifier"] = defending["speed_modifier"]
		attacking["special_modifier"] = defending["special_modifier"]
		attacking["accuracy_modifier"] = defending["accuracy_modifier"]
		attacking["evasiveness_modifier"] = defending["evasiveness_modifier"]


	def resolve_attack(self, attacking, move, defending, user):
		base_msg = f"{attacking["name"]} used {move["name"]}"
		multi = self.get_affinity(move, defending)
		affinity_msg = ""
		if (multi > 1):
			affinity_msg = ";it is very effective"
		elif (multi < 1):
			affinity_msg = ";it is not very effective"
		elif (multi == 0):
			affinity_msg = ";but it failed"
		if ('category' in move):
			if (attacking["hp"] != 0):
				if (attacking["status"] == "sleep"):
					if (randint(1, 100) <= 25):
						attacking["status"] = None
						return (f"{attacking["name"]} woke up", f"enemy {attacking["name"]} woke up")
					else:
						return (f"{attacking["name"]} is deep asleep", f"enemy {attacking["name"]} is deep asleep")
				elif (attacking["status"] == "freeze"):
					return (f"{attacking["name"]} is frozen", f"enemy {attacking["name"]} is frozen")
				elif (attacking["is_stunned"]):
					return (f"{attacking["name"]} flinched", f"enemy {attacking["name"]} flinched")
				elif (attacking["status"] == "paralysis" and randint(1, 100) <= 25):
					return (f"{attacking["name"]} is paralyzed", f"enemy {attacking["name"]} is paralyzed")
				elif (attacking["status"] == "confused"):
					if (randint(1, 100) <= 25):
						return (f"{attacking["name"]} is no longer confused", f"enemy {attacking["name"]} is no longer confused")
					if (randint(1, 100) <= 50):
						attack = attacking["attack"]
						if (attacking["attack_modifier"] > 0):
							attack = attack * (1 + 0.5 * attacking["attack_modifier"])
						elif (attacking["attack_modifier"] < 0):
							attack = attack / (1 + 0.5 * abs(attacking["attack_modifier"]))
						defense = attacking["defense"]
						if (attacking["defense_modifier"] > 0):
							defense = defense * (1 + 0.5 * attacking["defense_modifier"])
						elif (attacking["defense_modifier"] < 0):
							defense = defense / (1 + 0.5 * abs(attacking["defense_modifier"]))
						attacking["hp"] = max(0, attacking["hp"] - (40 * attack / defense))
						return (f"{attacking["name"]} hurt himself in his confusion", f"enemy {attacking["name"]} hurt himself in his confusion")
				if (move["accuracy"] and self.hit(attacking, move, defending)):
					if (move["category"] == "physical"):
						self.calculate_damage(attacking, move, defending)
					elif (move["category"] == "special"):
						self.calculate_special_damage(attacking, move, defending)
					if ("probability" in move["effect"] and randint(1, 100) <= (move["effect"]["probability"] * 100)):
						if ("stat" in move["effect"]):
							return (self.change_modifier(attacking, move, defending))
						else:
							if (move["effect"]["statusCondition"] == "flinch"):
								defending["is_stunned"] = True
							else:
								defending["status"] = move["effect"]["statusCondition"]
								return (base_msg + f"{affinity_msg}" + f"; enemy {defending["name"]} is {move["effect"]["statusCondition"]}", f"enemy " + base_msg + f"{affinity_msg}" + f";{defending["name"]} is {move["effect"]["statusCondition"]}")
					elif (move["category"] == "status"):
						if ("stat" in move["effect"]):
							return (self.change_modifier(attacking, move, defending))
						elif ("statusCondition" not in move["effect"]):
							return (base_msg + f"{affinity_msg}", f"enemy " + base_msg + f"{affinity_msg}")
						return (base_msg + f"{affinity_msg}" + f"; enemy {defending["name"]} is {move["effect"]["statusCondition"]}", f"enemy " + base_msg + f"{affinity_msg}" + f";{defending["name"]} is {move["effect"]["statusCondition"]}")
					return (base_msg + f"{affinity_msg}", f"enemy " + base_msg + f"{affinity_msg}")
				elif (move["name"] == "transform"):
					self.pokecopy(attacking, defending)
					return (base_msg + f";{attacking["name"]} transformed into {defending["name"]}", "enemy " + base_msg + f";enemy {attacking["name"]} transformed into {defending["name"]}")
				elif ((not move["accuracy"]) and ("stat" in move["effect"])):
					return (self.change_modifier(attacking, move, defending))
				else:
					return (base_msg + " and missed", f"enemy " + base_msg + " and missed")
			else:
				return ("", "")
		return (f"go {attacking["name"]}", f"{user} sent out {attacking["name"]}")


	def get_order(self, first, second):
		speed_first = first["speed"]
		speed_second = second["speed"]
		if (first["speed_modifier"] > 1):
			speed_first *= (1 + (0.5 * first["speed_modifier"]))
		elif (first["speed_modifier"] < 0):
			speed_first /= (1 + (0.5 * abs(first["speed_modifier"])))
		if (first["status"] == "paralysis"):
			speed_first /= 4
		if (second["speed_modifier"] > 1):
			speed_second *= (1 + (0.5 * second["speed_modifier"]))
		elif (second["speed_modifier"] < 0):
			speed_second /= (1 + (0.5 * abs(second["speed_modifier"])))
		if (second["status"] == "paralysis"):
			speed_second /= 4
		if (speed_first > speed_second):
			return True
		return False

	async def resolve_turn(self):
		room = ROOMS[self.room_name]
		usernames = list(room["players"].keys())
		p1, p2 = usernames[0], usernames[1]

		m1, m2 = room["moves"][p1], room["moves"][p2]

		p1_team = room["teams"][p1]
		p2_team = room["teams"][p2]

		p1_current = p1_team["team"][p1_team["current"]]
		p2_current = p2_team["team"][p2_team["current"]]

		order = self.get_order(p1_current, p2_current)

		if (order):
			msg_status_p1 = f"{p1_current["name"]} took damage from {p1_current["status"]}"
			msg_status_p2 = f"{p2_current["name"]} took damage from {p2_current["status"]}"
			result_msg_1 , result_msg_2 = self.resolve_attack(p1_current, m1, p2_current, p1)
			if (p1_current["status"] == "burn" or p1_current["status"] == "poison" or p1_current["status"] == "badly poison"):
				p1_current["hp"] -= p1_current["max_hp"] / 16
				result_msg_1 += ";" + msg_status_p1
				result_msg_2 += ";enemy " + msg_status_p1
			msg_2 , msg_1 = self.resolve_attack(p2_current, m2, p1_current, p2)
			if (len(msg_2) > 1):
				result_msg_2 += ";" + msg_2
			if (len(msg_1) > 1):
				result_msg_1 += ";" + msg_1
			if (p2_current["status"] == "burn" or p2_current["status"] == "poison" or p2_current["status"] == "badly poison"):
				p2_current["hp"] -= p2_current["max_hp"] / 16
				result_msg_1 += ";enemy " + msg_status_p2
				result_msg_2 += ";" + msg_status_p2
		else:
			result_msg_2 , result_msg_1 = self.resolve_attack(p2_current, m2, p1_current, p2)
			if (p2_current["status"] == "burn" or p2_current["status"] == "poison" or p2_current["status"] == "badly poison"):
				p2_current["hp"] -= p2_current["max_hp"] / 16
				result_msg_1 += ";enemy " + msg_status_p2
				result_msg_2 += ";" + msg_status_p2
			msg_1 , msg_2 = self.resolve_attack(p1_current, m1, p2_current, p1)
			if (len(msg_2) > 1):
				result_msg_2 += ";" + msg_2
			if (len(msg_1) > 1):
				result_msg_1 += ";" + msg_1
			if (p1_current["status"] == "burn" or p1_current["status"] == "poison" or p1_current["status"] == "badly poison"):
				p1_current["hp"] -= p1_current["max_hp"] / 16
				result_msg_1 += ";" + msg_status_p1
				result_msg_2 += ";enemy " + msg_status_p1


		p1_current["is_stunned"] = False
		p2_current["is_stunned"] = False
		for move in p1_current["moves"]:
			if move["name"] == m1["name"]:
				move["pp"] = max(0, move["pp"] - 1)
				
		for move in p2_current["moves"]:
			if move["name"] == m2["name"]:
				move["pp"] = max(0, move["pp"] - 1)

		if (p1_current["hp"] == 0):
			result_msg_1 += ";" + f"{p1_current["name"]} fainted"
			result_msg_2 += ";" + f"enemy {p1_current["name"]} fainted"
		if (p2_current["hp"] == 0):
			result_msg_1 += ";" + f"enemy {p2_current["name"]} fainted"
			result_msg_2 += ";" + f"{p2_current["name"]} fainted"
		

		if (await self.check_end(p1_team, p2_team, result_msg_1)):
			return

		await self.send_result_turn(result_msg_1, result_msg_2)


	async def check_end(self, p1_team, p2_team, msg_1):
		is_dead_1 = 0
		room = ROOMS[self.room_name]
		usernames = list(room["players"].keys())
		p1, p2 = usernames[0], usernames[1]
		message = [f"{p2} won", f"{p1} won", "draw"]
		p1_current = p1_team["team"][p1_team["current"]]
		p2_current = p2_team["team"][p2_team["current"]]
		for pokemon in p1_team["team"]:
			if (pokemon["hp"] == 0):
				is_dead_1 += 1
			else:
				break
		is_dead_2 = 0
		for pokemon in p2_team["team"]:
			if (pokemon["hp"] == 0):
				is_dead_2 += 1
			else:
				break

		msg_1 += ";" + message[(is_dead_1 == 6) + ((is_dead_2 == 6) * 2) - 1]
		if (is_dead_1 == 6 or is_dead_2 == 6):
			await self.channel_layer.send(
				room["players"][p1],
				{
					"type": "battle_end",
					"state": {
						"your_team": p1_team["team"],
						"current_pokemon": p1_current,
						"enemy": {
							"status": p2_current["status"],
							"name": p2_current["name"],
							"id": p2_current["id"],
							"hp": p2_current["hp"],
							"max_hp": p2_current["max_hp"]
						}
					},
					"message": msg_1
				}
			)
			room["teams"].pop(self.username, None)
			room["moves"].pop(self.username, None)
			return 1
		return 0



	async def send_result_turn(self, result_msg_1, result_msg_2):
		room = ROOMS[self.room_name]
		usernames = list(room["players"].keys())
		p1, p2 = usernames[0], usernames[1]
		p1_team = room["teams"][p1]
		p2_team = room["teams"][p2]

		p1_current = p1_team["team"][p1_team["current"]]
		p2_current = p2_team["team"][p2_team["current"]]

		room["moves"] = {}
		if (p1_current["hp"] == 0):
			await self.channel_layer.send(
				room["players"][p1],
				{
					"type": "send_pokemon",
					"state": {
						"your_team": p1_team["team"],
						"current_pokemon": p1_current,
						"enemy": {
							"status": p2_current["status"],
							"name": p2_current["name"],
							"id": p2_current["id"],
							"hp": p2_current["hp"],
							"max_hp": p2_current["max_hp"]
						}
					},
					"message": result_msg_1
				}
			)

		elif (p2_current["hp"] == 0):
			room["teams"]["AI"]["current"] = self.choose_ai_switch()
			p2_current = room["teams"]["AI"]["team"][room["teams"]["AI"]["current"]]
			result_msg_1 += f";AI sent {p2_current["name"]}"
			await self.channel_layer.send(
				room["players"][p1],
				{
					"type": "turn_result",
					"state": {
						"your_team": p1_team["team"],
						"current_pokemon": p1_current,
						"enemy": {
							"status": p2_current["status"],
							"name": p2_current["name"],
							"id": p2_current["id"],
							"hp": p2_current["hp"],
							"max_hp": p2_current["max_hp"]
						}
					},
					"message": result_msg_1
				}
			)
		else:
			await self.channel_layer.send(
				room["players"][p1],
				{
					"type": "turn_result",
					"state": {
						"your_team": p1_team["team"],
						"current_pokemon": p1_current,
						"enemy": {
							"status": p2_current["status"],
							"name": p2_current["name"],
							"id": p2_current["id"],
							"hp": p2_current["hp"],
							"max_hp": p2_current["max_hp"]
						}
					},
					"message": result_msg_1
				}
			)


	async def send_start(self):
		room = ROOMS[self.room_name]

		usernames = list(room["players"].keys())

		p1, p2 = usernames[0], usernames[1]

		p1_team = room["teams"][p1]
		p2_team = room["teams"][p2]

		p1_current = p1_team["team"][p1_team["current"]]
		ai_current = p2_team["team"][p2_team["current"]]

		message = f"go {p1_current["name"]}!;{p2} send {ai_current["name"]}"
		await self.channel_layer.send(
			room["players"][p1],
			{
			"type": "game_state",
			"state": {
				"your_team": p1_team["team"],
				"current_pokemon": p1_current,
				"enemy": {
					"status": ai_current["status"],
					"name": ai_current["name"],
					"id": ai_current["id"],
					"hp": ai_current["hp"],
					"max_hp": ai_current["max_hp"]
				}
			},
			"message": message
		})

	async def battle_start(self, event):
		await self.send(json.dumps({
			"type": "battle_start"
		}))

	async def turn_result(self, event):
		await self.send(json.dumps({
			"type": "turn_result",
			"message": event["message"],
			"state": event["state"]
		}))

	async def choosing_pokemon(self, event):
		await self.send(json.dumps({
			"type": "choosing_pokemon",
			"pokemon": pokemon
		}))

	async def send_pokemon(self, event):
		await self.send(json.dumps({
			"type": "send_pokemon",
			"message": event["message"],
			"state": event["state"]
		}))
		
	async def wait(self, event):
		await self.send(json.dumps({
			"type": "wait",
			"message": event["message"],
			"state": event["state"]
		}))

	async def game_state(self, event):
		await self.send(json.dumps({
			"type": "game_state",
			"state": event["state"],
			"message": event["message"]
		}))
		
	async def battle_end(self, event):
		await self.send(json.dumps({
			"type": "battle_end",
			"state": event["state"],
			"message": event["message"]
		}))