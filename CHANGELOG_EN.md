# Changelog

## [2.0.0] - 2026-09-22

### Refactor
- Rewritten as a **local session usage stats** panel: request counts and token usage (input / output / cache read / cache write) per model over 5h / this week / this month windows
- **Removed the official price/limit pipeline**: no more scraping the pricing page, no price cache/matching, and the `/go-changes` changelog command is gone
- Slimmed config surface: dropped refresh interval / docs URL / history limit; settings only keeps "Focused models"

### Fixes
- Usage scan timer is now a singleton across `/session` switches to avoid duplicate aggregation

### Docs
- Rewrote README / README_EN; install via GitHub clone