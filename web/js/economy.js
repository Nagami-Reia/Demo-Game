/** Economy policy for Koalitionsprotokoll (integer game euros).
 * Unspent cash carries over without interest (user rule revision).
 * Income bonuses start at the NEXT funding phase.
 * The controller owns atomic payment, the one-upgrade-per-round guard and
 * lastUpgradeRound; these helpers never mutate a player or the match.
 *
 * Reference reviewed: Stronghold-Protocol's fan-game source, NOT official
 * Arknights source. Concepts reimplemented here, no source text copied:
 * https://github.com/sganggs/Stronghold-Protocol/blob/master/server/match/player/round.js
 * startRound: upgradePrice - 1 (floor 0) after round 1; incoming funds and
 * pending funds; endPrep clears cash except specifically exempt strategy IDs.
 * https://github.com/sganggs/Stronghold-Protocol/blob/master/server/match/player/economy.js
 * priceOf applies price hooks; refresh consumes freeRefreshes before paid refresh;
 * levelUp resets the NEXT tier's upgrade base price. Buy/sell use fixed prices.
 * https://github.com/sganggs/Stronghold-Protocol/blob/master/server/match/gamedata.js
 * DEFAULTS: tier prices [2,3,3,3,4,4], refresh 1; mode data can override these.
 *
 * Adaptations: our cash carries over with NO interest, unlike the default source
 * rule above. Our center is shared, its discount is shared, floor is 2 (not 0),
 * and fixed recruit prices become minimum auction bids. No refresh is added:
 * refreshing would change the required three sequential public cards per round.
 */
export const costs=Object.freeze([3,4,5,6,8]);
export const bonuses=Object.freeze([1,1,1,2,2]);
const recruitmentPrices=Object.freeze([2,3,3,3,4,4]);
const integer = (value,fallback=0) => Number.isFinite(value) ? Math.max(0,Math.floor(value)) : fallback;

export function round_budget(round,income=0,carried=0){
  // A small scheduled increase supports stronger late markets without interest
  // or win-streak income; both sides receive the same base increase.
  return 12+Math.floor((Math.max(1,integer(round,1))-1)/3)+integer(income)+integer(carried);
}

export function upgrade_price(level,round,lastUpgradeRound=0){
  const tier=integer(level);
  if(tier<1||tier>=6)return null; // maximum level has no purchasable upgrade
  const now=Math.max(1,integer(round,1));
  const entered=integer(lastUpgradeRound);
  const elapsed=entered===0?now-1:Math.max(0,now-entered);
  return Math.max(2,costs[tier-1]-elapsed);
}

export function starting_price(card){
  const tier=Math.max(1,Math.min(6,integer(card?.tier,1)));
  return recruitmentPrices[tier-1];
}
