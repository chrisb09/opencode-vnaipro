import type { VnaiProModelDefinition } from "./types";

/**
 * Curated default model lineup for VNAI Pro (vibi.top).
 * Exclusively Anthropic Claude models with accurate limits, capabilities, and rates.
 * Verified against https://vibi.top/api/pricing.
 */
export const VNAIPRO_DEFAULT_MODELS: Record<string, VnaiProModelDefinition> = {
  "claude-fable-5-1": {
    name: "Claude Fable 5.1 (VNAI Pro)",
    attachment: true,
    tool_call: true,
    reasoning: true,
    limit: {
      context: 1_048_576,
      output: 65_536,
    },
    cost: {
      input: 10.0,
      output: 50.0,
      cache_read: 0.25,
      cache_write: 12.5,
    },
  },
  "claude-opus-5-5": {
    name: "Claude Opus 5.5 (VNAI Pro)",
    attachment: true,
    tool_call: true,
    reasoning: true,
    limit: {
      context: 1_000_000,
      output: 128_000,
    },
    cost: {
      input: 6.0,
      output: 30.0,
      cache_read: 0.85,
      cache_write: 7.5,
    },
  },
  "claude-sonnet-5": {
    name: "Claude Sonnet 5 (VNAI Pro)",
    attachment: true,
    tool_call: true,
    reasoning: true,
    limit: {
      context: 1_048_576,
      output: 65_536,
    },
    cost: {
      input: 2.5,
      output: 12.5,
      cache_read: 0.3,
      cache_write: 3.5,
    },
  },
  "claude-haiku-4-5-20251001": {
    name: "Claude Haiku 4.5 (VNAI Pro)",
    attachment: false,
    tool_call: true,
    limit: {
      context: 204_800,
      output: 8_192,
    },
    cost: {
      input: 1.2,
      output: 6.0,
      cache_read: 0.2,
      cache_write: 1.5,
    },
  },
  "claude-fable-5": {
    name: "Claude Fable 5 (VNAI Pro)",
    attachment: true,
    tool_call: true,
    reasoning: true,
    limit: {
      context: 1_048_576,
      output: 65_536,
    },
    cost: {
      input: 11.0,
      output: 55.0,
      cache_read: 1.2,
      cache_write: 15.0,
    },
  },
  "claude-opus-5": {
    name: "Claude Opus 5 (VNAI Pro)",
    attachment: true,
    tool_call: true,
    reasoning: true,
    limit: {
      context: 1_048_576,
      output: 65_536,
    },
    cost: {
      input: 6.0,
      output: 30.0,
      cache_read: 0.85,
      cache_write: 7.5,
    },
  },
  "claude-opus-4-8": {
    name: "Claude Opus 4.8 (VNAI Pro)",
    attachment: true,
    tool_call: true,
    limit: {
      context: 1_048_576,
      output: 65_536,
    },
    cost: {
      input: 6.0,
      output: 30.0,
      cache_read: 0.6,
      cache_write: 7.5,
    },
  },
  "claude-opus-4-7": {
    name: "Claude Opus 4.7 (VNAI Pro)",
    attachment: true,
    tool_call: true,
    limit: {
      context: 1_048_576,
      output: 128_000,
    },
    cost: {
      input: 6.0,
      output: 30.0,
      cache_read: 0.6,
      cache_write: 6.5,
    },
  },
  "claude-opus-4-6": {
    name: "Claude Opus 4.6 (VNAI Pro)",
    attachment: true,
    tool_call: true,
    limit: {
      context: 1_048_576,
      output: 128_000,
    },
    cost: {
      input: 6.0,
      output: 30.0,
      cache_read: 0.6,
      cache_write: 6.5,
    },
  },
  "claude-sonnet-4-6": {
    name: "Claude Sonnet 4.6 (VNAI Pro)",
    attachment: true,
    tool_call: true,
    limit: {
      context: 1_048_576,
      output: 65_536,
    },
    cost: {
      input: 3.3,
      output: 16.5,
      cache_read: 0.4,
      cache_write: 4.13,
    },
  },
};

/**
 * Extended catalog alias.
 */
export const VNAIPRO_EXTENDED_MODELS: Record<string, VnaiProModelDefinition> = {
  ...VNAIPRO_DEFAULT_MODELS,
};
