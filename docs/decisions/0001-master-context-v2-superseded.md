# 0001 — SajibAtlas-Master-Context-v2.md is not an active authority

**Date:** 2026-09-01  
**Phase:** 0E  
**Status:** Decided

## Evidence

- Tracked in git (`git ls-files`). Missing from the working tree (`D` in `git status`).
- Last content checkpoint cited inside the file: `65d7db3` (before V10.6 baseline `6f6c51c`).
- File names `phase4-mcq` as the development branch.
- V10.6 `DOCUMENT_MAP.md`, `README.md`, and `AGENTS.md` do not list this file.
- No remaining markdown reference to the filename in the repository.
- Vision, architecture, current state, roadmap, and rules live in the V10.6 set.

## Decision

Do not restore `SajibAtlas-Master-Context-v2.md`.

It is a historical context pack, not an active authority. Restoring it would
reintroduce a stale parallel constitution.

The blob remains in git history at `HEAD` if operational notes (domain/DNS)
need to be read later.

## Classification

C. historical/obsolete document  
D. duplicate of later V10.6 authorities
