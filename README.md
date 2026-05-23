# Daman

Daman is the first deployment of Daman Protocol, an open standard for slash-bonded copy-trading with permissionless agent-mesh participation on hum. Built on Reverb Protocol (substrate, fork lineage from `circlefin/arc-escrow`). `RefundProtocolFixed` (PR #13 cherry-picked) routes disputes. An asset-screening registry informs the universe whitelist. Companion product Reverb Markets ships the same substrate as a second consumer.

## What's where

| repo | what |
|---|---|
| [damanfi/protocol](https://github.com/damanfi/protocol) | the interfaces. `IDamanCopyBond`, `IUniverseWhitelist`, `BondEconomics`, `HiveVocabulary.md` |
| [damanfi/copy-bond](https://github.com/damanfi/copy-bond) | vanilla implementation of `IDamanCopyBond` |
| [damanfi/universe](https://github.com/damanfi/universe) | `UniverseRegistry`, HLAL seed script |
| [damanfi/agents](https://github.com/damanfi/agents) | `daman-watchdog`, `daman-arbiter`, `daman-farcaster-poster`, `daman-recruiter` plus the bee farm |
| [damanfi/oracle](https://github.com/damanfi/oracle) | on-platform indexer, NDJSON event stream |
| [damanfi/bridge](https://github.com/damanfi/bridge) | bidirectional bridge forager bee |
| [damanfi/app](https://github.com/damanfi/app) | storefront: leaderboard, onboarding, gasless subscribe, unified-balance, receipts |
| [reverbprotocol/protocol](https://github.com/reverbprotocol/protocol) | substrate: `IRefundProtocol` + `RefundProtocolFixed` |

## Agent set

| agent | role | speaks |
|---|---|---|
| **Watchdog** | observes settlements, files degradation claims when policy crosses a threshold | `chi:trade-executed`, `chi:settlement-completed`, `chi:slash-claim` |
| **Arbiter** | rules on disputed claims within the dispute window | `chi:dispute-opened`, `chi:ruling` |
| **Underwriter** | screens prospective leaders against on-chain history; emits a tier-negotiated bond attestation | `chi:register-leader-request`, `chi:underwriter-decision` |
| **Universe-keeper** | polls the published universe-screening source on a rebalance cadence; emits add/remove diffs | `chi:universe-rebalance` |
| **Recruiter** | scans Arc, Polygon, Ethereum, Solana for spot-only candidates; intersects against perp-touch history; dispatches casts + on-chain attestations | `chi:query-history`, `chi:cast-publish`, `chi:attest-recruitment` |
| **Bridge** (forager) | translates Arc events to mesh chis and back; dispatches mesh-originated calls on chain | every contract event topic |
| **Chain-reader** (forager) | wraps Alchemy + Helius behind a single chi-pair so consumer agents hold no RPC credentials | `chi:query-history`, `chi:history-result` |
| **Trace-pinner** (forager) | pins reasoning-trace JSON to IPFS and returns a CID; consumer agents write the CID to chain | `chi:pin-trace`, `chi:trace-pinned` |
| **Farcaster-poster** (forager) | wraps Neynar behind a chi-pair so consumer agents hold no Neynar credentials | `chi:cast-publish`, `chi:cast-published` |

Every agent decision is structured-output by construction: inputs observed, policy threshold, evidence-hash assembly, ruling. Reasoning traces are pinned via the trace-pinner forager and written on chain as `bytes32 traceCid` on the corresponding event, mirroring the pattern in TradingAgents (Tauric Research, arXiv:2412.20138) cited in Canteen's May 1 essay.

## Forager-bee architecture

Every external dependency is a hum bee following templates hum ships; any provider is swappable by replacing the corresponding forager. Chain reads route through the chain-reader bee (template: `hum/hives/paid-oracle`). Trace pinning routes through the trace-pinner bee (template: `hum/hives/humfs`). Social posting routes through the farcaster-poster bee (template: `hum/hives/twilio-sms`). Consumer agents publish chis to the mesh; foragers translate. Provider credentials and rate limits live in the forager, never in the consuming agent.

Anyone can run a Daman watchdog by following [`github.com/damanfi/agents`](https://github.com/damanfi/agents); the handshake is the registration.

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

## Substrate consumption

Daman declares conformance to substrate interfaces published in `reverbprotocol/protocol`. Six surfaces are consumed at the substrate layer: `IBountyAccrual` for routing a slice of slashed bond to the watchdog that filed the upheld claim; `IReputationRegistry` for cumulative scoring per agent address; `ICCTPReceiver` for CCTP v2 burn-and-mint reception; `IBondYieldVault` for USYC Teller routing on idle bond capital; `IStableFXSwap` for atomic StableFX EURC-to-USDC settlement on slash payouts; `IAttributable` as the marker for `bytes32 builder` attribution that travels with subscribe, attestDegradation, arbiterRule, and bounty events. Other deployments of Daman Protocol can adopt the same substrate interfaces and remain interoperable with consumer products written against the substrate.

## Circle products composed through the protocol

The storefront and the contract surface compose the Circle stack through real SDK calls, not through asset-name strings:

- **CCTP v2 burn-and-mint** routes leader bond posting from any CCTP source domain to Arc via `MessageTransmitterV2.receiveMessage` + decoded message-body activation.
- **Paymaster ERC-4337** carries gasless first-subscribe in the app via Circle Smart Account + EIP-2612 permit on USDC + Pimlico bundler.
- **USYC Teller deposit/redeem** carries idle bond capital to yield; the bond contract holds USYC shares on undisputed bonds and returns the yield delta to the leader on withdraw or to the treasury on slash-upheld.
- **StableFX FxEscrow** routes EURC bond payouts to USDC atomically (payment-versus-payment).
- **Gateway unified-balance** lets followers materialize USDC on Arc from any chain Gateway supports in a single transaction via `gatewayMint(attestation, signature)`.
- **App Kit** composes the chain definitions, pre-deploy addresses, and chain context across the storefront so every Circle product reads from one source.
- **Compliance Engine** screens prospective leaders inside the Underwriter agent before `underwriterAttest` is emitted.

Asset layer: **USDC** as the bond and subscription denomination (native gas on Arc, ERC-20 on every other Gateway-supported chain), **EURC** as the alternate bond denomination via the StableFX path.

A `bytes32 builder` field travels with `subscribe`, `attestDegradation`, `arbiterRule`, and `BountyClaimed` so a third-party UI can attribute its share of the subscription flow or watchdog bounty on chain. The pattern aligns with Reverb Markets' `Operator.sol`.

## Hum integration

Daman bees register against a subnet `HumdRegistry` and speak the chi vocabulary documented in [damanfi/protocol::src/HiveVocabulary.md](https://github.com/damanfi/protocol/blob/main/src/HiveVocabulary.md).

The bridge forager translates Arc events to hum tones in one direction and dispatches `slash-claim` and `ruling` tones back on chain in the other. External watchdog bees join via the standard `humd install` flow documented at [github.com/adiled/hum](https://github.com/adiled/hum), with no permission required. The bee farm in `damanfi/agents/docker-compose.yml` is the reference for running five independent watchdogs that race on degradation.

## Citations

Canonical primary sources only.

- Canteen, "Unbundling the Prediction Market Stack," May 1 2026.
- Tauric Research, TradingAgents, arXiv:2412.20138.
- `circlefin/refund-protocol` PR #13.
- `circlefin/arc-escrow` (substrate fork lineage).
- AAOIFI Standard No. 21 (Financial Papers: Shares and Bonds).

## License

Apache-2.0 across all repos.
