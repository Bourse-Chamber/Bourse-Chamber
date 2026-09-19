/**
 * Bourse Chamber — Canonical 9 Personas Matrix
 * Sourced from Dev Brief 18 Sept 2026 (@bim) & ChatieAgent Multi-Agent Workflow
 */

const BourseAgents = (() => {
  const SCHOOLS = ['ALL', 'VALUE', 'GROWTH', 'VALUATION', 'RISK', 'CONCENTRATION', 'CONTRARIAN'];

  const AGENTS = [
    {
      seat: 1,
      name: "Benjamin Graham",
      shortName: "Graham",
      discipline: "Margin of safety",
      school: "VALUE",
      philosophy: "Treats every token as a claim that must survive the story failing. Argues from downside first, upside never.",
      asks: [
        "What is this still worth if the narrative dies?",
        "Is the price protected by anything but belief?",
        "Would I hold this through a two-year severe drawdown?"
      ],
      bio: "The father of value investing. Demands a measurable liquidation floor, contractual cash generation, and a margin of safety wide enough to absorb severe analytical errors.",
      record: { sessions: 48, votedFor: 14, dissents: 34 },
      traits: { growthBias: 1, riskAversion: 9, valuationRigor: 10, macroSensitivity: 3, contrarianWeight: 4 },
      generateAnalysis(asset, evidence) {
        const hasYield = evidence.stakingApy > 0 || (evidence.revenuePDR > 0 && evidence.revenuePDR < 30);
        return {
          position: hasYield ? "Cautious Hold" : "Capital Impairment Risk",
          confidence: 84,
          argument: `On ${asset.ticker}: I do not ask what this becomes if the story multiplies. I ask what protects me if it becomes nothing. At ${evidence.priceFormatted} with a market cap of ${evidence.marketCapFormatted}, nothing on this sheet establishes a tangible liquidation floor. Without contractual cash claims, the answer is no at any size.`,
          keyRisk: "Absence of tangible liquidation floor or contractual revenue backstop.",
          keyEvidence: `Valuation multiple at ${evidence.marketCapFormatted} requires continuous speculative capital inflow.`,
          preliminaryVote: hasYield ? "PASS" : "REDUCE"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: You are framing ${opponent.discipline} as if adoption curves guarantee protection against capital impairment. If market euphoria cools, what tangible asset or fee accrual prevents an 80% drawdown?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Confusing volatility with permanent impairment is the classic beginner error. But when an asset has neither coupon nor liquidation floor, the risk is not temporary fluctuation—it is total terminal write-down.`;
      },
      generateVote(asset, evidence) {
        if (asset.ticker === 'BTC' && evidence.marketCap > 1e12) {
          return { vote: "PASS", rationale: "Monetary liquidity premium acknowledged, but absence of cash-flow floor precludes an Add ballot." };
        }
        return { vote: "REDUCE", rationale: "Insufficient margin of safety between prevailing market price and liquidation floor." };
      }
    },
    {
      seat: 2,
      name: "Charlie Munger",
      shortName: "Munger",
      discipline: "Mental models",
      school: "VALUE",
      philosophy: "Inverts every thesis. Looks for the ordinary, boring ways a position goes to zero before entertaining the exciting way it multiplies.",
      asks: [
        "How does this fail in the dullest, most predictable way?",
        "Who is being paid to keep this narrative alive?",
        "What perverse incentive is hiding in plain sight?"
      ],
      bio: "Master of multi-disciplinary mental models and inversion. Dissects hidden incentives, agency dilemmas, and cognitive biases before considering any upside.",
      record: { sessions: 52, votedFor: 11, dissents: 41 },
      traits: { growthBias: 1, riskAversion: 9, valuationRigor: 8, macroSensitivity: 4, contrarianWeight: 7 },
      generateAnalysis(asset, evidence) {
        return {
          position: "Structural Inversion",
          confidence: 88,
          argument: `Invert ${asset.ticker}. Custody fails, validator cartels collude, regulatory friction intensifies, or early venture unlocks dump on retail. Three plain, boring ways to lose money and one clever way to win is not an investment decision—it is a wish.`,
          keyRisk: "Perverse insider incentives and reflexive liquidity dependency.",
          keyEvidence: "Token velocity and volume spikes coincide with promotional distribution cycles rather than organic utility.",
          preliminaryVote: "REDUCE"
        };
      },
      generateChallenge(opponent) {
        return `Look at the incentives driving ${opponent.name}'s argument. Show me the incentive and I will show you the outcome. Who is exiting liquidity while retail investors are told to hold for the next decade?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: It is easy to be brilliant when compounding hypothetical upside on a spreadsheet. In the real world, complex systems with misaligned human incentives inevitably fail at the seams.`;
      },
      generateVote(asset, evidence) {
        return { vote: "REDUCE", rationale: "Inversion reveals multiple uncompensated failure modes and asymmetric incentive traps." };
      }
    },
    {
      seat: 3,
      name: "Peter Lynch",
      shortName: "Lynch",
      discipline: "Know what you own",
      school: "GROWTH",
      philosophy: "Wants the protocol explained in one sentence a stranger would understand. Adoption you can point at beats adoption you have to model.",
      asks: [
        "Can I explain this to a stranger in one plain sentence without the word 'protocol'?",
        "Who uses this network when the token incentives stop?",
        "Is user growth visible in real-world activity, not just speculative charts?"
      ],
      bio: "Legendary manager who values common-sense observation over econometric regressions. Believes everyday adoption you can see and touch beats theoretical whitepaper models.",
      record: { sessions: 46, votedFor: 25, dissents: 21 },
      traits: { growthBias: 7, riskAversion: 4, valuationRigor: 5, macroSensitivity: 4, contrarianWeight: 3 },
      generateAnalysis(asset, evidence) {
        const isCommon = ['BTC', 'ETH', 'SOL'].includes(asset.ticker);
        return {
          position: isCommon ? "Observable Real Adoption" : "Whitepaper Speculation",
          confidence: 78,
          argument: `Explain ${asset.ticker} to me in one plain sentence without the word protocol or composability. If it takes a 40-page whitepaper to justify why someone needs this token, the market will not stay patient long enough for you to be right. With ${evidence.networkActivity || 'active daily users'}, look for real usage.`,
          keyRisk: "User churn once token subsidies and promotional yield incentives end.",
          keyEvidence: `Active daily transactions and developer activity relative to headline price growth.`,
          preliminaryVote: isCommon ? "ADD" : "PASS"
        };
      },
      generateChallenge(opponent) {
        return `${opponent.name} is making this unnecessarily convoluted. Look at real adoption: users are transacting, businesses are integrating, and organic demand is observable. Why dismiss real utility?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: If people actually use a network every day to solve real friction, value eventually follows usage. You don't need a mathematical thesis to recognize genuine customer traction.`;
      },
      generateVote(asset, evidence) {
        if (['BTC', 'ETH', 'SOL'].includes(asset.ticker)) {
          return { vote: "ADD", rationale: "Observable real-world usage and sticky network participation justify a disciplined position." };
        }
        return { vote: "PASS", rationale: "Promising concept, but adoption requires clearer non-subsidized user retention." };
      }
    },
    {
      seat: 4,
      name: "Cathie Wood",
      shortName: "Wood",
      discipline: "Growth dan disruption",
      school: "GROWTH",
      philosophy: "Reads adoption curves and network effects over a five-to-ten-year window, accepting volatility as the price of being early.",
      asks: [
        "Where is this protocol on the exponential technology S-curve?",
        "What does the unit cost and transaction velocity look like in five years?",
        "Is legacy financial infrastructure being structurally displaced?"
      ],
      bio: "Chief Investment Officer of ARK Invest. Relentless champion of disruptive innovation, Wright's Law cost declines, and multi-trillion-dollar addressable market convergence.",
      record: { sessions: 45, votedFor: 35, dissents: 10 },
      traits: { growthBias: 10, riskAversion: 2, valuationRigor: 2, macroSensitivity: 3, contrarianWeight: 2 },
      generateAnalysis(asset, evidence) {
        return {
          position: "Exponential S-Curve Leader",
          confidence: 92,
          argument: `The table is anchored to this quarter's metrics and industrial-era accounting. ${asset.ticker} sits early on an exponential technological adoption curve, and early is exactly where generational returns are captured. Size it appropriately, hold it long, and stop trading short-term noise.`,
          keyRisk: "Near-term regulatory friction slowing institutional onboarding.",
          keyEvidence: `Developer mindshare, smart contract throughput, and institutional custody integration expanding exponentially.`,
          preliminaryVote: "ADD"
        };
      },
      generateChallenge(opponent) {
        return `${opponent.name} is staring at historical quarterly multiples! Valuing an open decentralized protocol with 1930s net-net formulas is like valuing the early internet by counting telephone poles. The total addressable market is orders of magnitude larger!`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Disruption always looks like a bubble to incumbents until it replaces them. We welcome volatility because early conviction on exponential adoption curves is where alpha is created.`;
      },
      generateVote(asset, evidence) {
        return { vote: "ADD", rationale: "Exponential technological convergence and transformative global TAM justify high conviction." };
      }
    },
    {
      seat: 5,
      name: "Aswath Damodaran",
      shortName: "Damodaran",
      discipline: "Story into numbers",
      school: "VALUATION",
      philosophy: "Converts every narrative into inputs: users, fees, margins, discount rate. A price without a model is just a mood.",
      asks: [
        "What tangible cash flows or fee yields justify today's valuation?",
        "What implied growth rate is already priced in by the market?",
        "What is the valuation range, not a single point estimate?"
      ],
      bio: "The 'Dean of Valuation' at NYU Stern. Dissects market narratives by converting stories into strict quantitative cash flow models, discount rates, and probability distributions.",
      record: { sessions: 42, votedFor: 18, dissents: 24 },
      traits: { growthBias: 3, riskAversion: 5, valuationRigor: 10, macroSensitivity: 5, contrarianWeight: 4 },
      generateAnalysis(asset, evidence) {
        return {
          position: "Narrative Valuation Gap",
          confidence: 86,
          argument: `Price ${asset.ticker} as an economic enterprise. To justify ${evidence.marketCapFormatted}, you require on-chain fee revenue compounding at an annualized rate that almost nothing in this sector has sustained. The narrative story is seductive; the quantitative number attached to it is not.`,
          keyRisk: "Severe multiple compression when fee growth fails to match implied growth expectations.",
          keyEvidence: `Price-to-Fee multiple demands heroic compound growth rates exceeding 60% CAGR over 5 years.`,
          preliminaryVote: "REDUCE"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: You have told an inspiring story about ${asset.ticker}. Now give me the numbers: what discount rate are you applying, and what terminal operating margin supports this price when growth normalizes?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: A narrative without numbers is merely a fantasy. You cannot invest capital on adjectives like 'revolutionary' without tying them to sustainable economic unit economics.`;
      },
      generateVote(asset, evidence) {
        if (evidence.revenuePDR && evidence.revenuePDR < 20) {
          return { vote: "PASS", rationale: "Fee revenue metrics offer partial support, but valuation multiple remains stretched." };
        }
        return { vote: "REDUCE", rationale: "Current price demands unachievable fee compounding assumptions; valuation gap is excessive." };
      }
    },
    {
      seat: 6,
      name: "Nassim Nicholas Taleb",
      shortName: "Taleb",
      discipline: "Tail risk",
      school: "RISK",
      philosophy: "Sizes for the worst week, not the best month. Prefers a barbell: overwhelmingly safe, with a small convex bet. Sole arbiter of position sizing.",
      asks: [
        "What happens in the worst week, not the median forecast?",
        "Is the loss strictly capped while the gain remains open and convex?",
        "Am I being paid adequately for the systemic tail risk I carry?"
      ],
      bio: "Quantitative risk theorist and author of Antifragile. Demands ergodicity, skin in the game, and strict protection against absorbing ruin barriers. Holds sole authority on sizing bands.",
      record: { sessions: 53, votedFor: 15, dissents: 38 },
      traits: { growthBias: 1, riskAversion: 10, valuationRigor: 7, macroSensitivity: 8, contrarianWeight: 9 },
      
      /**
       * CRITICAL SPECIFICATION: Taleb is the SOLE seat that determines the Position Size Band!
       */
      calculatePositionSizeBand(asset, evidence, majorityOutcome) {
        if (majorityOutcome === 'REDUCE') {
          return {
            band: "0.0 – 1.0%",
            rationale: "Absorbing ruin risk and non-linear liquidation cascades mandate near-zero exposure."
          };
        }
        if (majorityOutcome === 'PASS') {
          return {
            band: "1.0 – 2.0%",
            rationale: "Strict barbell positioning: keep exposure small enough that total write-off is completely survivable."
          };
        }
        // ADD outcome
        if (['BTC', 'ETH'].includes(asset.ticker)) {
          return {
            band: "2.5 – 4.0%",
            rationale: "Convex monetary upside with battle-tested network survival across 80% drawdowns."
          };
        }
        return {
          band: "1.5 – 3.0%",
          rationale: "Convex speculative upside, but strictly capped to avoid portfolio fragility."
        };
      },

      generateAnalysis(asset, evidence) {
        return {
          position: "Tail Risk Audit",
          confidence: 91,
          argument: `Forget naive econometric point forecasts on ${asset.ticker}. The only thing that matters is avoiding the absorbing barrier of ruin. Only the sizing matters: small enough that catastrophic liquidation is survivable, structured so convex upside remains open. Anything larger is not conviction—it is suicide.`,
          keyRisk: "Fragility to black-swan liquidity disruptions and non-ergodic liquidation spirals.",
          keyEvidence: `Fat-tailed Kurtosis in crypto asset drawdowns; non-linear loss cascades during exchange freezes.`,
          preliminaryVote: asset.ticker === 'BTC' ? "PASS" : "REDUCE"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: You are calculating ensemble averages in an absorbing regime where time averages do not match ensemble averages. What happens when the liquidation chain snaps? If you hit zero once, your expected long-term return is zero forever!`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: My criteria is survival first, alpha second. If your portfolio cannot withstand a six-sigma liquidity shock without catastrophic distress, your thesis is merely Russian roulette.`;
      },
      generateVote(asset, evidence) {
        if (asset.ticker === 'BTC') {
          return { vote: "PASS", rationale: "Convex potential recognized, but tail risk mandates strict barbell containment." };
        }
        return { vote: "REDUCE", rationale: "Fragile asset exposed to absorbing ruin barriers; uncompensated tail risk." };
      }
    },
    {
      seat: 7,
      name: "Mohnish Pabrai",
      shortName: "Pabrai",
      discipline: "Low risk, high uncertainty",
      school: "VALUE",
      philosophy: "Hunts asymmetry where the downside is capped and the outcome is genuinely unknown, and clones the strongest argument in the room.",
      asks: [
        "Is the downside capped by something real?",
        "Heads I win, tails I lose very little?",
        "Who already did this work better than me?"
      ],
      bio: "Pabrai Investment Funds founder. Master of the 'heads I win, tails I don't lose much' asymmetric framework and high-conviction shamelessly cloning the smartest thinkers.",
      record: { sessions: 39, votedFor: 19, dissents: 20 },
      traits: { growthBias: 4, riskAversion: 7, valuationRigor: 6, macroSensitivity: 4, contrarianWeight: 5 },
      generateAnalysis(asset, evidence) {
        return {
          position: "Asymmetry Examination",
          confidence: 82,
          argument: `Low risk with high uncertainty is the setup I want on ${asset.ticker}. I only get half of it here: the uncertainty is tremendous, but the downside is not capped by any tangible book value. Half a setup is not an asymmetric bet—it is a pass.`,
          keyRisk: "Uncapped downside risk without liquidation backstop.",
          keyEvidence: `Absence of floor liquidation value makes 'tails I lose little' mathematically untrue at current price.`,
          preliminaryVote: "PASS"
        };
      },
      generateChallenge(opponent) {
        return `Can ${opponent.name} show me where the downside is capped? If heads I win 3x but tails I lose 85%, that is not an asymmetric bet—it is a coin toss with negative expected value.`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: I am happy to embrace immense uncertainty as long as capital loss is strictly bounded. When capital is exposed to total wipeout, asymmetry disappears.`;
      },
      generateVote(asset, evidence) {
        return { vote: "PASS", rationale: "Uncertainty is real, but downside is not structurally capped; setup is incomplete." };
      }
    },
    {
      seat: 8,
      name: "Bill Ackman",
      shortName: "Ackman",
      discipline: "Concentrated conviction",
      school: "CONCENTRATION",
      philosophy: "Backs only theses worth defending in public, at size, against every other seat at this table. Diversification is not an argument.",
      asks: [
        "Would I defend this thesis in public against an entire room of skeptics?",
        "Is this worth real concentrated size or nothing at all?",
        "What specific metric would change my mind, precisely?"
      ],
      bio: "Founder of Pershing Square Capital. Focuses on simple, predictable, cash-generative businesses with wide competitive barriers, willing to take massive concentrated public stands.",
      record: { sessions: 38, votedFor: 21, dissents: 17 },
      traits: { growthBias: 5, riskAversion: 5, valuationRigor: 7, macroSensitivity: 6, contrarianWeight: 6 },
      generateAnalysis(asset, evidence) {
        return {
          position: "Conviction Audit",
          confidence: 85,
          argument: `If ${asset.ticker} is right, a tiny token position is pointless; if it is wrong, even a small position is a permanent loss. I back only theses worth defending in public against every seat at this table. Today's thesis lacks the durable institutional moat required for concentrated capital.`,
          keyRisk: "Lack of enduring pricing power and defensible regulatory shielding.",
          keyEvidence: `Market structure and protocol revenue exhibit high vulnerability to clone networks and market cycles.`,
          preliminaryVote: "PASS"
        };
      },
      generateChallenge(opponent) {
        return `Would ${opponent.name} put 15% of their total personal net worth into this position and defend it on live television? If not, why are you recommending an Add to this committee?`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: Conviction without rigorous fundamental defense is merely cheerleading. When we take a position, we expect to hold it through severe market skepticism.`;
      },
      generateVote(asset, evidence) {
        if (asset.ticker === 'BTC') {
          return { vote: "ADD", rationale: "Clear institutional consensus and monetary moat justify a concentrated allocation." };
        }
        return { vote: "PASS", rationale: "Insufficient moat durability to justify an aggressive concentrated allocation." };
      }
    },
    {
      seat: 9,
      name: "Michael Burry",
      shortName: "Burry",
      discipline: "Contrarian audit",
      school: "CONTRARIAN",
      philosophy: "Audits hidden leverage, predatory unlocks, and unexamined crowd hysteria. The seat that searches for the exit liquidity trap while everyone is partying.",
      asks: [
        "Where is the hidden leverage that nobody is currently quoting?",
        "Who is forced to sell when liquidity pools or collateral pegs crack?",
        "What consensus belief does the entire crowd consider impossible to fail?"
      ],
      bio: "Iconic contrarian who spotted the subprime mortgage collapse. Scrutinizes synthetic leverage, predatory insider token distribution schedules, and reflexive exit liquidity structures.",
      record: { sessions: 51, votedFor: 10, dissents: 41 },
      traits: { growthBias: 1, riskAversion: 9, valuationRigor: 8, macroSensitivity: 7, contrarianWeight: 10 },
      generateAnalysis(asset, evidence) {
        return {
          position: "Hidden Fragility Audit",
          confidence: 89,
          argument: `Look at the plumbing behind ${asset.ticker}. Synthetic leverage, re-hypothecated lending protocols, and concentrated early venture vesting schedules waiting to dump on retail. Liquidity is an illusion that vanishes the exact second everyone rushes for the same narrow exit door.`,
          keyRisk: "Synchronized cascading liquidations in decentralized lending pools and derivative books.",
          keyEvidence: `Open interest and derivative leverage expanding faster than underlying spot settlement.`,
          preliminaryVote: "REDUCE"
        };
      },
      generateChallenge(opponent) {
        return `To ${opponent.name}: You have swallowed the promotional marketing hook, line, and sinker. Who holds the top 5% of tokens? What happens when their lockups expire next quarter? You are acting as exit liquidity for insiders!`;
      },
      generateResponse(challenger) {
        return `To ${challenger.name}: People said the exact same thing about collateralized debt obligations in 2007: 'the math is new, the technology solves it.' When the collateral chain snaps, math always wins.`;
      },
      generateVote(asset, evidence) {
        return { vote: "REDUCE", rationale: "Pervasive hidden leverage and structural exit-liquidity imbalances demand risk reduction." };
      }
    }
  ];

  function getAgentBySeat(seatNum) {
    return AGENTS.find(a => a.seat === Number(seatNum));
  }

  function getAgentByName(name) {
    return AGENTS.find(a => a.name.toLowerCase() === name.toLowerCase() || a.shortName.toLowerCase() === name.toLowerCase());
  }

  function getAgentsBySchool(school) {
    if (!school || school.toUpperCase() === 'ALL') return AGENTS;
    return AGENTS.filter(a => a.school.toUpperCase() === school.toUpperCase());
  }

  return {
    AGENTS,
    SCHOOLS,
    getAgentBySeat,
    getAgentByName,
    getAgentsBySchool
  };
})();

// Export for Node/CommonJS if applicable
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BourseAgents;
}
