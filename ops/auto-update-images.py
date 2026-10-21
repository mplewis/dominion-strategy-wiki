#!/usr/bin/env python3
"""Stage new images for the domwiki stack and restart via the approved script.

The script pulls every compose service image and compares image IDs against the
running containers. When anything moves, it tags the old images for rollback,
runs restart-containers.sh, then verifies container health. Exit code 0 means
no change or a fully healthy update.
"""

import json
import logging
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from typing import Any

SRV_DIR = "/srv"
"""Compose project directory for the domwiki stack."""

RESTART_SCRIPT = "/srv/scripts/restart-containers.sh"
"""The only approved restart path: down-then-up plus UFW rule reapplication."""

VERIFY_DEADLINE_SECONDS = 300
"""Maximum seconds to wait for every container to reach a good status."""

VERIFY_INTERVAL_SECONDS = 15
"""Seconds between health polls during verification."""

GOOD_STATUSES = ("healthy", "running")
"""Container statuses that count as up after an update."""

LOGGER = logging.getLogger("auto-update-images")
"""Module logger; fields ride along through the extra mechanism."""


class JsonFormatter(logging.Formatter):
    """Render each log record as one JSON line, for journald."""

    def format(self, record: logging.LogRecord) -> str:
        """Merge the static message with its structured fields."""
        payload: dict[str, Any] = {"level": record.levelname, "msg": record.getMessage()}
        payload.update(getattr(record, "fields", {}))
        return json.dumps(payload, default=str)


def log(level: int, msg: str, **fields: object) -> None:
    """Emit a log record with structured fields attached."""
    LOGGER.log(level, msg, extra={"fields": fields})


@dataclass(frozen=True)
class ServiceState:
    """One compose service with its container and the two image IDs of interest."""

    name: str
    container: str
    image_ref: str
    running_id: str
    pulled_id: str

    @property
    def changed(self) -> bool:
        """Report whether the running container lags behind the pulled image."""
        return self.running_id != self.pulled_id


def run(cmd: list[str]) -> str:
    """Run a command in SRV_DIR and return trimmed stdout; raise on failure."""
    proc = subprocess.run(cmd, cwd=SRV_DIR, capture_output=True, text=True, check=False)
    if proc.returncode:
        log(logging.ERROR, "command failed", cmd=cmd, code=proc.returncode, stderr=proc.stderr.strip())
        raise RuntimeError(f"command failed: {' '.join(cmd)}")
    return proc.stdout.strip()


def parse_ps(raw: str) -> list[dict[str, Any]]:
    """Parse docker compose ps output; accepts a JSON array or JSON lines."""
    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError:
        return [json.loads(line) for line in raw.splitlines() if line.strip()]
    return loaded if isinstance(loaded, list) else [loaded]


def load_services() -> list[dict[str, Any]]:
    """List every running compose service with its container name and image ref."""
    entries = parse_ps(run(["docker", "compose", "ps", "--format", "json"]))
    return [e for e in entries if e.get("State") in (None, "running")]


def collect_states(entries: list[dict[str, Any]]) -> list[ServiceState]:
    """Inspect each running container and the image its tag resolves to now."""
    states = []
    for entry in entries:
        running = run(["docker", "inspect", entry["Name"], "--format", "{{.Image}}"])
        pulled = run(["docker", "image", "inspect", entry["Image"], "--format", "{{.Id}}"])
        states.append(
            ServiceState(
                name=entry["Service"],
                container=entry["Name"],
                image_ref=entry["Image"],
                running_id=running,
                pulled_id=pulled,
            )
        )
    return states


def rollback_ref(image_ref: str) -> str:
    """Derive a per-service rollback tag from an image reference."""
    repo = image_ref.rsplit(":", 1)[0]
    return f"{repo}:auto-rollback"


def tag_rollbacks(states: list[ServiceState]) -> None:
    """Tag each superseded image so rollback is one retag plus the restart script."""
    for state in states:
        run(["docker", "tag", state.running_id, rollback_ref(state.image_ref)])
        log(logging.INFO, "rollback tag set", service=state.name, tag=rollback_ref(state.image_ref))


def container_health(container: str) -> str:
    """Return healthy, unhealthy, starting, running, or the raw container state."""
    status = run(["docker", "inspect", container, "--format", "{{.State.Status}}"])
    if status != "running":
        return status
    probe = "{{if .State.Health}}{{.State.Health.Status}}{{end}}"
    return run(["docker", "inspect", container, "--format", probe]) or "running"


def verify(states: list[ServiceState]) -> int:
    """Poll every container until all are good or the deadline passes."""
    deadline = time.monotonic() + VERIFY_DEADLINE_SECONDS
    statuses = {s.container: container_health(s.container) for s in states}
    while not all(st in GOOD_STATUSES for st in statuses.values()):
        if time.monotonic() >= deadline:
            bad = {c: st for c, st in statuses.items() if st not in GOOD_STATUSES}
            log(logging.ERROR, "containers not ready", bad=bad)
            return 1
        time.sleep(VERIFY_INTERVAL_SECONDS)
        statuses = {s.container: container_health(s.container) for s in states}
    for container, status in sorted(statuses.items()):
        log(logging.INFO, "container status", container=container, status=status)
    updated = {s.name: {"from": s.running_id, "to": s.pulled_id} for s in states if s.changed}
    log(logging.INFO, "update complete", updated=updated)
    return 0


def update_stack(entries: list[dict[str, Any]]) -> int:
    """Pull, restart on change, and verify; return the process exit code."""
    names = [entry["Service"] for entry in entries]
    run(["docker", "compose", "pull", "--ignore-pull-failures", *names])
    states = collect_states(entries)
    changed = [s for s in states if s.changed]
    if not changed:
        log(logging.INFO, "no image changes", services=[s.name for s in states])
        return 0
    tag_rollbacks(changed)
    log(logging.INFO, "restart begins", changed=[s.name for s in changed])
    run(["bash", RESTART_SCRIPT])
    return verify(states)


def main() -> int:
    """Configure logging and run one update cycle."""
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler])
    skip = {s.strip() for s in os.environ.get("SKIP", "").split(",") if s.strip()}
    entries = [e for e in load_services() if e["Service"] not in skip]
    if not entries:
        log(logging.ERROR, "no services selected", skip=sorted(skip))
        return 1
    try:
        return update_stack(entries)
    except RuntimeError as exc:
        log(logging.ERROR, "update aborted", error=str(exc))
        return 1


if __name__ == "__main__":
    sys.exit(main())
