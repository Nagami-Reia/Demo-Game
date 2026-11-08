"""Evidence-backed external-world references; no actor utility or story outcome."""
from __future__ import annotations

from datetime import date
import json
from pathlib import Path
from .environment_repository import load_environment_payload, profile_file

PROVENANCE = frozenset({"REAL_OBSERVED", "MODEL_INFERRED", "SIMULATION_ASSUMPTION",
                        "SCENARIO_GENERATED", "UNKNOWN"})


class ExternalEnvironment:
    def __init__(self, profile_path: Path):
        self.profile = load_environment_payload(profile_path)
        profile_path = profile_file(profile_path)
        if self.profile.get("schema_version") != "external-environment-1.0":
            raise ValueError("Expected external-environment-1.0")
        ledger_path = profile_path.parent / self.profile["evidence_ledger"]
        self.ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
        self.sources = {row["id"]: row for row in self.ledger["sources"]}
        self.claims = {row["id"]: row for row in self.ledger["claims"]}
        if len(self.sources) != len(self.ledger["sources"]) or len(self.claims) != len(self.ledger["claims"]):
            raise ValueError("Evidence IDs must be unique")
        for row in self.ledger["claims"]:
            self.validate_provenance(row)
        for calendar in self.profile["institutional_calendars"].values():
            self.validate_provenance(calendar)
            for start, end in calendar.get("session_weeks", ()):
                if date.fromisoformat(end) < date.fromisoformat(start):
                    raise ValueError("Invalid institutional calendar interval")

    def validate_provenance(self, row: dict) -> dict:
        if row.get("status") not in PROVENANCE:
            raise ValueError("Invalid provenance status")
        references = row.get("sources", [])
        if set(references) - self.sources.keys():
            raise ValueError("Unknown evidence source")
        if row["status"] == "REAL_OBSERVED" and not references:
            raise ValueError("Observed facts require a source")
        return row

    def calendar_context(self, institution: str, day: str) -> dict:
        """Session weeks are context, NOT a legal permission or minute-level agenda."""
        value = date.fromisoformat(day)
        calendar = self.profile["institutional_calendars"].get(institution)
        if not calendar or calendar["status"] == "UNKNOWN" or value.year != calendar.get("year"):
            return {"institution": institution, "date": day, "status": "UNKNOWN",
                    "execution_permission": "NOT_DETERMINED"}
        regular = any(date.fromisoformat(start) <= value <= date.fromisoformat(end)
                      for start, end in calendar.get("session_weeks", ()))
        return {"institution": institution, "date": day,
                "status": "PLANNED_SESSION_WEEK" if regular else "OUTSIDE_PLANNED_SESSION_WEEKS",
                "sources": calendar["sources"], "execution_permission": "NOT_DETERMINED",
                "extraordinary_session_route": "GG_39_3" if institution == "Bundestag" else None}

    def payload(self) -> dict:
        return {"profile": self.profile, "evidence_ledger": self.ledger,
                "source_count": len(self.sources), "claim_count": len(self.claims),
                "warning": "Research date does not refresh the separate historical world snapshot."}
