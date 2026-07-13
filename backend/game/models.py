from django.db import models


class Pokemon(models.Model):
    name = models.CharField(max_length=100)
    type = models.JSONField()
    hp = models.IntegerField()
    max_hp = models.IntegerField()
    attack = models.IntegerField()
    defense = models.IntegerField()
    speed = models.IntegerField()
    special = models.IntegerField()

    moves = models.ManyToManyField("Move", related_name="pokemons")


class Move(models.Model):
    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=50)

    power = models.IntegerField(null=True, blank=True)
    accuracy = models.IntegerField(null=True, blank=True)
    pp = models.IntegerField(null=True, blank=True)
    max_pp = models.IntegerField(null=True, blank=True)

    category = models.TextField(null=True, blank=True)
    effect = models.JSONField(null=True, blank=True)
    flavor_text = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name