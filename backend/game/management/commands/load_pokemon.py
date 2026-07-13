import json
import os

from django.core.management.base import BaseCommand
from django.conf import settings

from game.models import Pokemon, Move


class Command(BaseCommand):
    help = "Load Pokémon data from JSON into database"

    def handle(self, *args, **kwargs):
        path = os.path.join(settings.BASE_DIR, "game/data/pokemon.json")

        if not os.path.exists(path):
            self.stdout.write(self.style.ERROR(f"File not found: {path}"))
            return

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, dict):
            data = [data]

        for p in data:
            # -----------------------
            # CREATE / UPDATE POKEMON
            # -----------------------
            pokemon, _ = Pokemon.objects.update_or_create(
                id=p.get("id"),
                defaults={
                    "name": p["name"],
                    "type": p["type"],
                    "hp": p["hp"],
                    "max_hp": p["max_hp"],
                    "attack": p["attack"],
                    "defense": p["defense"],
                    "speed": p["speed"],
                    "special": p["special"],
                }
            )

            # -----------------------
            # ATTACH MOVES (M2M LOGIC)
            # -----------------------
            for m in p["moves"]:
                move_obj, _ = Move.objects.update_or_create(
                    name=m["name"],
                    defaults={
                        "type": m["type"],
                        "power": m.get("power"),
                        "accuracy": m.get("accuracy"),
                        "pp": m.get("pp"),
                        "max_pp": m.get("max_pp"),
                        "category": m.get("category"),
                        "effect": m.get("effect"),
                        "flavor_text": m.get("flavor_text"),
                    }
                )

                # IMPORTANT: link instead of create
                pokemon.moves.add(move_obj)

        self.stdout.write(self.style.SUCCESS("Pokémon loaded successfully (M2M)"))