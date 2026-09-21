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
    name: "Peter Lynch",
    discipline: "Know what you own",
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
    seat: 4,
    name: "Cathie Wood",
    discipline: "Growth and disruption",
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
    seat: 5,
    name: "Aswath Damodaran",
    discipline: "Story into numbers",
    school: "VALUATION",
    bio: "Converts every narrative into inputs: users, fees, margins, discount rate. A price without a model is just a mood.",
    asks: [
      "What tangible cash flows or fee yields justify today's valuation?",
      "What implied growth rate is already priced in by the market?",
      "What is the valuation range, not a single point estimate?"
    ],
    say: "Price {A} as an economic enterprise. To justify current valuations, you require on-chain fee revenue compounding at an annualized rate that almost nothing in this sector has sustained. The narrative story is seductive; the quantitative number attached to it is not.",
    landingOneLiner: "Converts every narrative into inputs: users, fees, margins, discount rate. A price without a model is just a mood.",
    record: { sessions: 42, votedFor: 18, dissents: 24 },
    traits: { growthBias: 3, riskAversion: 5, valuationRigor: 10 }
  },
  {
    seat: 6,
    name: "Nassim Nicholas Taleb",
    discipline: "Tail risk",
    school: "RISK",
    bio: "Sizes for the worst week, not the best month. Prefers a barbell: overwhelmingly anti-fragile or convex, never exposed to ruin. Sole arbiter of position sizing.",
    asks: [
      "What happens in the worst week, not the median forecast?",
      "Does this protocol gain from disorder (antifragile) or shatter under volatility?",
      "Is the maximum loss strictly bounded with open right-tail convexity?"
    ],
    say: "Forget naive point forecasts on {A}. The only thing that matters in non-ergodic environments is avoiding the absorbing barrier of ruin. Sizing must be strictly barbelled: never exposed to liquidation.",
    landingOneLiner: "Sizes the position for the worst week, not the best month. Barbell first, conviction second. Sole arbiter of sizing bands.",
    record: { sessions: 53, votedFor: 15, dissents: 38 },
    traits: { growthBias: 1, riskAversion: 10, valuationRigor: 7 }
  },
  {
    seat: 7,
    name: "Mohnish Pabrai",
    discipline: "Low risk, high uncertainty",
    school: "VALUE",
    bio: "Hunts asymmetry where the downside is capped and the outcome is genuinely unknown, and clones the strongest argument in the room.",
    asks: [
      "Is the downside capped by something real?",
      "Heads I win, tails I lose very little?",
      "Who already did this work better than me?"
    ],
    say: "Low risk with high uncertainty is the setup I want on {A}. I only get half of it here: the uncertainty is tremendous, but the downside is not capped by any tangible book value. Half a setup is not an asymmetric bet—it is a pass.",
    landingOneLiner: "Hunts asymmetry where the downside is capped and the outcome is genuinely unknown. Heads I win, tails I don't lose much.",
    record: { sessions: 39, votedFor: 19, dissents: 20 },
    traits: { growthBias: 4, riskAversion: 7, valuationRigor: 6 }
  },
  {
    seat: 8,
    name: "Bill Ackman",
    discipline: "Concentrated conviction",
    school: "CONCENTRATION",
    bio: "Backs only theses worth defending in public, at size, against every other seat at this table. Diversification is not an argument.",
    asks: [
      "Would I defend this thesis in public against an entire room of skeptics?",
      "Is this worth real concentrated size or nothing at all?",
      "What specific metric would change my mind, precisely?"
    ],
    say: "If {A} is right, a tiny token position is pointless; if it is wrong, even a small position is a permanent loss. I back only theses worth defending in public against every seat at this table. Today's thesis lacks the durable institutional moat required for concentrated capital.",
    landingOneLiner: "Backs only theses worth defending in public, at size, against every other seat at this table. Diversification is not an argument.",
    record: { sessions: 38, votedFor: 21, dissents: 17 },
    traits: { growthBias: 5, riskAversion: 5, valuationRigor: 7 }
  },
  {
    seat: 9,
    name: "Michael Burry",
    discipline: "Contrarian audit",
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
  }
];

const SCHOOL_ORDER = ["ALL", "VALUE", "GROWTH", "VALUATION", "RISK", "CONCENTRATION", "CONTRARIAN"];

module.exports = { AGENTS, SCHOOL_ORDER };
