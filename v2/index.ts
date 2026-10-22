import { Integration, Model, Plugin, Provider } from "@opencode/plugin";
import {
  VNAIPRO_DEFAULT_BASE_URL,
  VNAIPRO_DEFAULT_NAME,
  VNAIPRO_DEFAULT_NPM,
  VNAIPRO_PROVIDER_ID,
} from "../src/constants";
import { VNAIPRO_DEFAULT_MODELS } from "../src/models";
import type { ModelCost, VnaiProModelDefinition } from "../src/types";

const MAX_RETRY_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504, 529]);
const integrationID = Integration.ID.make(VNAIPRO_PROVIDER_ID);
const providerID = Provider.ID.make(VNAIPRO_PROVIDER_ID);

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function retryDelay(response: Response | undefined, attempt: number): number {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 30_000);
    const date = Date.parse(retryAfter);
    if (!Number.isNaN(date)) return Math.min(Math.max(date - Date.now(), 0), 30_000);
  }
  return Math.min(1_000 * 2 ** attempt + Math.floor(Math.random() * 250), 10_000);
}

function isRetryable(response: Response): boolean {
  return RETRYABLE_STATUS_CODES.has(response.status);
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function costTiers(cost: ModelCost | undefined): Model.Info["cost"] {
  if (!cost) return [];
  const tiers: unknown[] = [
    {
      input: cost.input,
      output: cost.output,
      cache: { read: cost.cache_read ?? 0, write: cost.cache_write ?? 0 },
    },
  ];
  for (const [size, tier] of [
    [200_000, cost.context_over_200k],
    [272_000, cost.context_over_272k],
  ] as const) {
    if (!tier) continue;
    tiers.push({
      tier: { type: "context", size },
      input: tier.input,
      output: tier.output,
      cache: { read: tier.cache_read ?? 0, write: tier.cache_write ?? 0 },
    });
  }
  return tiers as Model.Info["cost"];
}

function modelInfo(id: string, definition: VnaiProModelDefinition): Model.Info {
  const modelID = Model.ID.make(id);
  return {
    ...Model.Info.default(providerID, modelID),
    id: modelID,
    modelID,
    name: definition.name,
    package: `aisdk:${VNAIPRO_DEFAULT_NPM}`,
    capabilities: {
      tools: definition.tool_call !== false,
      input: definition.attachment ? ["text", "image", "pdf"] : ["text"],
      output: ["text"],
    },
    limit: {
      context: definition.limit?.context ?? 128_000,
      output: definition.limit?.output ?? 8_192,
    },
    cost: costTiers(definition.cost),
    variants: Object.entries(definition.variants ?? {}).map(([variantID, settings]) => ({
      id: Model.VariantID.make(variantID),
      settings: settings as Record<string, unknown>,
    })),
    status: "active",
    enabled: true,
    time: { released: 0 },
  } as unknown as Model.Info;
}

type Context = Parameters<Parameters<typeof Plugin.define>[0]["setup"]>[0];

async function resolveApiKey(ctx: Context): Promise<string> {
  try {
    const connection = await ctx.integration.connection.active(integrationID);
    const credential = connection ? await ctx.integration.connection.resolve(connection) : undefined;
    if (credential?.type === "key") return credential.key;
    if (credential?.type === "oauth") return credential.access;
  } catch {
    // Fall through to the environment override.
  }
  return process.env.VNAIPRO_API_KEY ?? process.env.VIBI_API_KEY ?? "";
}

function createProviderFetch(ctx: Context, baseURL: string): typeof fetch {
  const baseOrigin = new URL(baseURL).origin;

  return async (input, init) => {
    if (new URL(requestUrl(input)).origin !== baseOrigin) return fetch(input, init);

    const apiKey = await resolveApiKey(ctx);
    const headers = new Headers(init?.headers);
    if (apiKey) {
      if (!headers.has("x-api-key")) headers.set("x-api-key", apiKey);
      if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${apiKey}`);
    }

    const requestInit: RequestInit = { ...init, headers };
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(input, requestInit);
        if (!isRetryable(response) || attempt === MAX_RETRY_ATTEMPTS - 1) return response;
        await sleep(retryDelay(response, attempt));
      } catch (error) {
        lastError = error;
        if (attempt === MAX_RETRY_ATTEMPTS - 1) throw error;
        await sleep(retryDelay(undefined, attempt));
      }
    }
    throw lastError;
  };
}

export default Plugin.define({
  id: "vnaipro",
  async setup(ctx) {
    await ctx.integration.transform((editor) => {
      editor.update(integrationID, (integration) => {
        integration.id = integrationID;
        integration.name = VNAIPRO_DEFAULT_NAME;
      });
      editor.method.update({
        integrationID,
        method: { type: "key", label: "VNAI Pro API key" },
      });
      editor.method.update({
        integrationID,
        method: { type: "env", names: ["VNAIPRO_API_KEY", "VIBI_API_KEY"] },
      });
    });

    await ctx.provider.transform((editor) => {
      const info = {
        ...Provider.Info.empty(providerID),
        name: VNAIPRO_DEFAULT_NAME,
        activation: "enabled",
        package: `aisdk:${VNAIPRO_DEFAULT_NPM}`,
        integrationID,
        settings: { baseURL: VNAIPRO_DEFAULT_BASE_URL },
      } as unknown as Provider.Info;
      editor.add({
        info,
        models: Object.entries(VNAIPRO_DEFAULT_MODELS).map(([id, definition]) =>
          modelInfo(id, definition as VnaiProModelDefinition),
        ),
      });
    });

    await ctx.aisdk.hook("sdk", async (event) => {
      const packageName = (event.model.package ?? event.package).replace(/^aisdk:/, "");
      if (packageName !== VNAIPRO_DEFAULT_NPM) return;

      const baseURL =
        typeof event.options.baseURL === "string" ? event.options.baseURL : VNAIPRO_DEFAULT_BASE_URL;
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      event.sdk = createAnthropic({
        ...event.options,
        baseURL,
        apiKey: typeof event.options.apiKey === "string" ? event.options.apiKey : "",
        fetch: createProviderFetch(ctx, baseURL),
      } as Parameters<typeof createAnthropic>[0]);
    });
  },
});
