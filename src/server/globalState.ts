import { EventEmitter } from "events";
import { TokenData, TraderData } from "../types/tokens";

// Create a global namespace for shared state across imports
declare global {
  // eslint-disable-next-line no-var
  var pumpFunState:
    | {
        tokenStore: TokenData[];
        tokenActualStore: TokenData[];
        solanaPrice: number;
        lastPriceUpdate: Date | null;
        eventEmitter: EventEmitter;
        subscribedTokens: Set<string>;
        traderStore: Map<string, TraderData>;
        profitTierTraders: {
          tier1: Set<string>;
          tier2: Set<string>;
          tier3: Set<string>;
          tier4: Set<string>;
          tier5: Set<string>;
        };
        subscribedTraders: Set<string>;
      }
    | undefined;
}

// Initialize global state if not already set
export function initGlobalState() {
  if (!global.pumpFunState) {
    console.log("Initializing global pump.fun state");
    global.pumpFunState = {
      tokenStore: [],
      tokenActualStore: [],
      solanaPrice: 0,
      lastPriceUpdate: null,
      eventEmitter: new EventEmitter(),
      subscribedTokens: new Set<string>(),
      traderStore: new Map<string, TraderData>(),
      profitTierTraders: {
        tier1: new Set<string>(),
        tier2: new Set<string>(),
        tier3: new Set<string>(),
        tier4: new Set<string>(),
        tier5: new Set<string>(),
      },
      subscribedTraders: new Set<string>(),
    };
  }
}