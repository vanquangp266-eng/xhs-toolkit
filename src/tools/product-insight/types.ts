export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface FabeItem {
  fact: string;
  advantage: string;
  benefit: string;
  evidence: string;
}

export interface Persona {
  name: string;
  role: string;
  story: string;
  quote: string;
  tags: string[];
}

export interface QaItem {
  question: string;
  answer: string;
}

export interface StrategicAnalysis {
  user: {
    identity: string;
    attributes: string;
  };
  scenario: {
    timeSpace: string;
    event: string;
    emotion: string;
  };
  problem: {
    dissatisfaction: string;
    blockingPoints: string;
    gap: string;
  };
  property: {
    product: string;
    service: string;
    deliverables: string;
  };
  advantage: {
    differentiation: string;
    marketPosition: string;
  };
  value: {
    functional: string;
    emotional: string;
  };
  dynamics: {
    motivation: {
      internal: string;
      external: string;
    };
    resistance: {
      lowYield: string;
      highInput: string;
      timeWindow: string;
      opportunityCost: string;
    };
  };
}

export interface ReportData {
  productName: string;
  summary: string;
  decomposition: {
    requirements: string;
    targetAudience: string;
    background: string;
    points: {
      pain: string;
      itch: string;
      wow: string;
    };
    userState: {
      current: string;
      expectations: string;
      knownFacts: string;
    };
    lifeSuggestions: string;
  };
  strategicAnalysis: StrategicAnalysis;
  core: {
    productCore: string;
    buyingDemo: string;
  };
  personas: Persona[];
  fabe: FabeItem[];
  qa: QaItem[];
  marketingCopy: {
    painCopy: string;
    itchCopy: string;
    wowCopy: string;
    motivationCopy: string;
    resistanceCopy: string;
  };
}

export interface Session {
  id: string;
  name: string;
  lastModified: number;
  messages: Message[];
  reportData: ReportData | null;
}

export const INITIAL_REPORT_DATA: ReportData = {
  productName: "未指定产品",
  summary: "等待产品详情...",
  decomposition: {
    requirements: "-",
    targetAudience: "-",
    background: "-",
    points: { pain: "-", itch: "-", wow: "-" },
    userState: { current: "-", expectations: "-", knownFacts: "-" },
    lifeSuggestions: "-"
  },
  strategicAnalysis: {
    user: { identity: "-", attributes: "-" },
    scenario: { timeSpace: "-", event: "-", emotion: "-" },
    problem: { dissatisfaction: "-", blockingPoints: "-", gap: "-" },
    property: { product: "-", service: "-", deliverables: "-" },
    advantage: { differentiation: "-", marketPosition: "-" },
    value: { functional: "-", emotional: "-" },
    dynamics: {
      motivation: { internal: "-", external: "-" },
      resistance: { lowYield: "-", highInput: "-", timeWindow: "-", opportunityCost: "-" }
    }
  },
  core: {
    productCore: "-",
    buyingDemo: "-"
  },
  personas: [],
  fabe: [],
  qa: [],
  marketingCopy: {
    painCopy: "-",
    itchCopy: "-",
    wowCopy: "-",
    motivationCopy: "-",
    resistanceCopy: "-"
  }
};