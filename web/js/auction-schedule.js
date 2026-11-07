// Two special opportunities in an eight-round game, independent of the center.
export function is_bonus_round(round){return round>=3&&round%3===0;}

export function bonus_tier(round){return round<6?4:5;}
