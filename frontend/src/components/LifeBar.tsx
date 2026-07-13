import "../game.css"

type LifeBarProps = {
  hp: number;
  maxHp: number;
};

export default function LifeBar({ hp, maxHp }: LifeBarProps) {
  const percentage = (hp / maxHp) * 100;

  let type = "life-bar"
  if (percentage <= 50)
    type = "mid-life"
  else if (percentage <= 10)
    type = "low-life"
  return (
    <div className="life-bar-container rounded-full">
      <div
        className={`${type} rounded-full`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

//use it like this <LifeBar hp={playerPokemon?.hp} maxHp={playerPokemon?.maxHp} />