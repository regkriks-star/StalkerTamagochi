import { FACES, ITEMS, LOCATIONS, type ItemId, type LocationId } from "./game";

export function Face({ face }: { face: number }) {
  return (
    <span
      className="face-sprite"
      aria-hidden="true"
      style={face === 6 ? {
        backgroundImage: `url(${import.meta.env.BASE_URL}character/face-reference.webp)`,
        backgroundSize: "100% 100%",
      } : {
        backgroundPosition: `${(face % 3) * 50}% ${Math.floor(face / 3) * 100}%`,
      }}
    />
  );
}

export function CharacterPortrait({
  face,
  suit = null,
  mask = null,
  location,
}: {
  face: number;
  suit?: ItemId | null;
  mask?: ItemId | null;
  location: LocationId;
}) {
  const outfit = suit === "jacket" || suit === "armor" ? suit : null;
  const background = LOCATIONS[location].background;
  const asset = (file: string) => `${import.meta.env.BASE_URL}character/${file}.webp`;
  return (
    <div
      className="character-art"
      role="img"
      aria-label={`Сталкер: ${mask ? ITEMS.mask.name : FACES[face]}; ${outfit ? ITEMS[outfit].name : "обычная одежда"}. ${LOCATIONS[location].name}`}
      data-face={face}
    >
      <div
        className="character-background"
        data-location={location}
        style={background ? { backgroundImage: `url(${import.meta.env.BASE_URL}${background})` } : undefined}
      />
      <div className="character-doll" aria-hidden="true">
        <img className="character-body" src={asset("body")} alt="" draggable={false} />
        {mask ? (
          <img className="character-mask" src={asset("mask")} alt="" draggable={false} />
        ) : (
          <div className="character-face"><Face face={face} /></div>
        )}
        {outfit && (
          <img className={`character-clothing clothing-${outfit}`} src={asset(outfit)} alt="" draggable={false} />
        )}
      </div>
    </div>
  );
}
