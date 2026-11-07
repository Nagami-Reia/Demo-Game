// Game simplification: current presidium members stay in the neutral chair role.
// GO-BT §27(2) permits speaking after relinquishing the chair; role switching is not implemented.
export function is_neutral_chair(card){return !!card?.neutralChair||(card?.offices||[]).some(o=>o.scope==='presidium'&&(!o.status||o.status==='verified_current'));}
