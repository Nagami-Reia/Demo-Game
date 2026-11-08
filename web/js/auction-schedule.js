// Two special opportunities in the regular rounds, independent of the center.
export function is_bonus_round(round){return round===3||round===6;}

export function bonus_tier(round){return round<6?4:5;}
