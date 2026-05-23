# Daman

Daman is the first deployment of Daman Protocol, an open standard for slash-bonded copy-trading with permissionless agent-mesh participation on hum. Built on Reverb Protocol (substrate, fork lineage from `circlefin/arc-escrow`). `RefundProtocolFixed` (PR #13 cherry-picked) routes disputes. An asset-screening registry informs the universe whitelist. Companion product Reverb Markets ships the same substrate as a second consumer.

## What's where

| repo | what |
|---|---|
| [damanfi/protocol](https://github.com/damanfi/protocol) | the interfaces. `IDamanCopyBond`, `IUniverseWhitelist`, `BondEconomics`, `HiveVocabulary.md` |
| [damanfi/copy-bond](https://github.com/damanfi/copy-bond) | vanilla implementation of `IDamanCopyBond` |
| [damanfi/universe](https://github.com/damanfi/universe) | `UniverseRegistry`, HLAL seed script |
| [damanfi/agents](https://github.com/damanfi/agents) | `daman-watchdog` + `daman-arbiter` bees for hum |
| [damanfi/oracle](https://github.com/damanfi/oracle) | on-platform indexer, NDJSON event stream |
| [damanfi/bridge](https://github.com/damanfi/bridge) | bidirectional bridge forager bee |
| [damanfi/app](https://github.com/damanfi/app) | minimal storefront: leaderboard, onboarding, receipts |
| [reverbprotocol/protocol](https://github.com/reverbprotocol/protocol) | substrate: `IRefundProtocol` + `RefundProtocolFixed` |

## ADR-001

The oracle is on-platform only. `recordTrade` and `recordSettlement` are callable solely by the configured operator-side oracle address, which reads only the deployment's own emitted events. No off-platform leaderboards, no third-party performance feeds, no external trader-PnL signals inform the bond state. Hum is the transport layer for bee coordination; the chain is the truth.

See [ADR-001.md](./ADR-001.md) for the architectural decision in full.

## Universe screening

The flagship deployment screens against the published HLAL (Wahed-FTSE-USA) ETF holdings on each rebalance window. The choice is informed by published asset-screening methodology, with the screening provenance recorded in the `sourceTag` on each `UniverseRegistry` update.

`UniverseRegistry` itself is curation-agnostic. Other deployments may seed against ESG indices, sector lists, sanctions lists, or any other source.

## Bond economics

Three tiers, in basis points of self-reported AUM, posted as USDC bond before the leader is advertised as active:

| tier | bond requirement |
|---|---|
| retail | 10% |
| mid | 5% |
| institutional | 2.5% floor, 3% ceiling |

Slash cap: 25% of currently-posted bond per dispute. Lockup: leader-determined per deployment; the vanilla impl uses 7 days.

## Hum integration

Daman bees register against a subnet `HumdRegistry` and speak the chi vocabulary documented in [damanfi/protocol::src/HiveVocabulary.md](https://github.com/damanfi/protocol/blob/main/src/HiveVocabulary.md).

The bridge forager translates Arc events to hum tones in one direction and dispatches `slash-claim` and `ruling` tones back on chain in the other. External watchdog bees join via the standard `humd install` flow documented at [github.com/adiled/hum](https://github.com/adiled/hum), with no permission required.

## Citations

Canonical primary sources only.

- Canteen, "Unbundling the Prediction Market Stack," May 1 2026.
- Tauric Research, arXiv:2412.20138.
- `circlefin/refund-protocol` PR #13.
- `circlefin/arc-escrow` (substrate fork lineage).
- AAOIFI Standard No. 21 (Financial Papers: Shares and Bonds).

## License

Apache-2.0 across all repos.
