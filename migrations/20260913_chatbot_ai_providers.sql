CREATE TABLE IF NOT EXISTS chatbot_ai_providers (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('gemini','openai','anthropic')),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  key_hint TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 100,
  token_limit BIGINT,
  reset_period TEXT NOT NULL DEFAULT 'monthly' CHECK (reset_period IN ('daily','monthly','never')),
  period_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_ends_at TIMESTAMPTZ,
  prompt_tokens BIGINT NOT NULL DEFAULT 0,
  completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  request_count BIGINT NOT NULL DEFAULT 0,
  error_count BIGINT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ,
  last_status TEXT NOT NULL DEFAULT 'untested',
  last_error TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_ai_providers_active
  ON chatbot_ai_providers(enabled, priority, created_at);
