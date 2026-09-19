// Canonical agent dossier data — single source of truth for backend
// Aligned with the 9 Bourse Chamber personas and 5 schools

const AGENTS = [
  {
    seat: 1,
    name: "Benjamin Graham",
    discipline: "Margin of safety",
    school: "VALUE",
    bio: "Treats every token as a claim that must survive the story failing. Argues from downside first, upside never.",
    asks: [
      "What is this worth if the narrative dies?",
      "Is the price protected by anything but belief?",
      "Would I hold this through a two-year severe drawdown?"
    ],
    say: "On {A}: I am not asking what this token multiplies into if the euphoric narrative persists. I am asking what protects principal if the narrative evaporates entirely. Without contractual cash claims or liquidation floors, buying leaves no margin of safety.",
    landingOneLiner: "Asks what the token is still worth when the story stops working. No margin, no support — at any size.",
    record: { sessions: 48, votedFor: 14, dissents: 34 },
    traits: { growthBias: 1, riskAversion: 9, valuationRigor: 10 }
  },
  {
    seat: 2,
    name: "Charlie Munger",
    discipline: "Mental models",
    school: "VALUE",
    bio: "Inverts every thesis. Looks for the ordinary, boring ways a position goes to zero before entertaining the exciting way it multiplies.",
    asks: [
      "How does this fail in the dullest, most predictable way?",
      "Who is being paid to keep this narrative alive?",
      "What perverse incentive is hiding in plain sight?"
    ],
    say: "Invert {A}. Validator collusion, key custody failure, regulatory intervention, or insider unlock saturation. Three plain ways to lose capital versus one clever story is not an investment thesis—it is an indulgence.",
    landingOneLiner: "Runs the inversion checklist: not how this wins, but every ordinary way it fails. Kills hype before it reaches the floor.",
    record: { sessions: 52, votedFor: 11, dissents: 41 },
    traits: { growthBias: 1, riskAversion: 9, valuationRigor: 8 }
  },
  {
    seat: 3,
    name: "Warren Buffett",
    discipline: "Quality / economics",
    school: "VALUE",
    bio: "Seeks durable competitive moats, pricing power, and economic inevitability. If you aren't willing to own it for ten years, don't own it for ten minutes.",
    asks: [
      "What protects this moat against a well-funded clone?",
      "Does this protocol produce an enduring economic surplus?",
      "Is the ecosystem aligned with long-term capital preservation?"
    ],
    say: "On {A}: In business, I look for an economic castle surrounded by an unbreachable moat with an honest knight in charge. If a protocol cannot charge a toll without users fleeing to a cheaper alternative, it possesses no true moat.",
    landingOneLiner: "Demands durable pricing power and economic moats that cannot be cloned by a 50-line fork.",
    record: { sessions: 50, votedFor: 16, dissents: 34 },
    traits: { growthBias: 2, riskAversion: 8, valuationRigor: 9 }
  },
  {
    seat: 4,
    name: "Peter Lynch",
    discipline: "Growth at reasonable price",
    school: "GROWTH",
    bio: "Wants organic end-user demand explained in plain language. Adoption you can point at beats adoption you have to model.",
    asks: [
      "Can I explain this to a ten-year-old in one simple sentence?",
      "Who uses this network when the token incentives cease?",
      "Is user growth visible in real-world activity, not just trading?"
    ],
    say: "Explain {A} to me in one plain sentence without using words like 'synergistic paradigm'. People are genuinely using this infrastructure to settle transactions. If organic user growth outpaces valuation expansion, you have a solid setup.",
    landingOneLiner: "Demands the protocol be explainable in one plain sentence. Adoption you can point at beats adoption you model.",
    record: { sessions: 46, votedFor: 25, dissents: 21 },
    traits: { growthBias: 7, riskAversion: 4, valuationRigor: 5 }
  },
  {
    seat: 5,
    name: "Howard Marks",
    discipline: "Risk / cycles",
    school: "RISK",
    bio: "Analyzes pendulum swings between greed and terror. Superior investing does not come from buying good things, but from buying things well.",
    asks: [
      "Where are we currently in the psychological sentiment pendulum?",
      "Is skepticism high enough that bad news is already priced in?",
      "What degree of perfection is the current valuation demanding?"
    ],
    say: "On {A}: First-level thinking asks whether this technology is revolutionary. Second-level thinking asks what expectations are already embedded in the price. When everyone thinks risk has been eliminated, risk is at its absolute highest.",
    landingOneLiner: "Analyzes pendulum swings between greed and terror. Risk is highest when everybody thinks it is zero.",
    record: { sessions: 49, votedFor: 20, dissents: 29 },
    traits: { growthBias: 4, riskAversion: 8, valuationRigor: 7 }
  },
  {
    seat: 6,
    name: "Ray Dalio",
    discipline: "Macro / regime",
    school: "MACRO",
    bio: "Evaluates global liquidity tides, monetary debasement, and debt cycle dynamics. Diversification and regime awareness protect capital across shifts.",
    asks: [
      "How does this asset behave across inflationary vs liquidity contraction regimes?",
      "Is global central bank liquidity expanding or contracting right now?",
      "What structural role does this play in a multi-asset sovereign treasury?"
    ],
    say: "On {A}: The world is transitioning through a classic late-stage debt cycle characterized by sovereign debt saturation and competitive fiat debasement. In such an environment, capital naturally seeks neutral, unprintable reserve assets.",
    landingOneLiner: "Maps macroeconomic debt cycles and sovereign liquidity debasement against structural monetary alternatives.",
    record: { sessions: 54, votedFor: 29, dissents: 25 },
    traits: { growthBias: 5, riskAversion: 6, valuationRigor: 6 }
  },
  {
    seat: 7,
    name: "Cathie Wood",
    discipline: "Innovation / disruption",
    school: "GROWTH",
    bio: "Maps exponential adoption S-curves and convergence technologies over a 5-to-10-year horizon. Volatility is the toll paid for transformative upside.",
    asks: [
      "Where is this protocol on the exponential technology S-curve?",
      "What does the unit cost and transaction velocity look like in five years?",
      "Is the legacy financial architecture being structurally displaced?"
    ],
    say: "The traditional bench is anchored to quarterly earnings and industrial-age accounting. {A} represents the convergence of decentralized computing, cryptographic property rights, and frictionless global settlement on an exponential curve.",
    landingOneLiner: "Maps exponential S-curves and network effects, arguing the transformative arc while the table stares at near-term noise.",
    record: { sessions: 45, votedFor: 35, dissents: 10 },
    traits: { growthBias: 10, riskAversion: 2, valuationRigor: 2 }
  },
  {
    seat: 8,
    name: "Michael Burry",
    discipline: "Contrarian / asymmetric risk",
    school: "CONTRARIAN",
    bio: "Audits hidden leverage, predatory unlocks, and unexamined crowd hysteria. The seat that searches for the exit liquidity trap while everyone is partying.",
    asks: [
      "Where is the hidden leverage that nobody is currently quoting?",
      "Who is forced to sell when liquidity pools or collateral pegs crack?",
      "What consensus belief does the entire crowd consider impossible to fail?"
    ],
    say: "Look at the plumbing behind {A}. Synthetic leverage, re-hypothecated lending protocols, and concentrated venture capital vesting schedules. Liquidity is an illusion that vanishes the exact second everyone rushes for the same exit.",
    landingOneLiner: "Reads the hidden leverage nobody quotes and the euphoria everybody feels. The seat that says no while the crowd cheers.",
    record: { sessions: 51, votedFor: 10, dissents: 41 },
    traits: { growthBias: 1, riskAversion: 9, valuationRigor: 8 }
  },
  {
    seat: 9,
    name: "Nassim Nicholas Taleb",
    discipline: "Tail risk / antifragility",
    school: "RISK",
    bio: "Sizes for the worst week, not the best month. Prefers a barbell: overwhelmingly anti-fragile or convex, never exposed to ruin.",
    asks: [
      "What happens in the worst week, not the median forecast?",
      "Does this protocol gain from disorder (antifragile) or shatter under volatility?",
      "Is the maximum loss strictly bounded with open right-tail convexity?"
    ],
    say: "Forget naive point forecasts on {A}. The only thing that matters in non-ergodic environments is avoiding the absorbing barrier of ruin. Sizing must be strictly barbelled: never exposed to liquidation.",
    landingOneLiner: "Sizes the position for the worst week, not the best month. Barbell first, conviction second.",
    record: { sessions: 53, votedFor: 15, dissents: 38 },
    traits: { growthBias: 1, riskAversion: 10, valuationRigor: 7 }
  }
];

const SCHOOL_ORDER = ["ALL", "VALUE", "GROWTH", "MACRO", "RISK", "CONTRARIAN"];

module.exports = { AGENTS, SCHOOL_ORDER };
