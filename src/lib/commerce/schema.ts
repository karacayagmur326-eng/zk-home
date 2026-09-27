import { query } from "@lib/admin/db"

declare global {
  var _schemaPromise: Promise<void> | null | undefined
}

async function createSchema() {
  await query(`
    -- BirFatura requires integer IDs; local catalog/customer IDs are strings.
    -- Keep this mapping permanently so retries and redeployments reuse IDs.
    CREATE TABLE IF NOT EXISTS store_birfatura_identity (
      source_key TEXT PRIMARY KEY,
      external_id BIGSERIAL NOT NULL UNIQUE
        CHECK (external_id > 0 AND external_id <= 9007199254740991)
    );

    CREATE TABLE IF NOT EXISTS store_category (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      description TEXT,
      parent_id TEXT,
      rank INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_collection (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_tag (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL UNIQUE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_product (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      subtitle TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      thumbnail TEXT,
      collection_id TEXT,
      type_id TEXT,
      type_value TEXT,
      discountable BOOLEAN NOT NULL DEFAULT TRUE,
      weight NUMERIC,
      length NUMERIC,
      height NUMERIC,
      width NUMERIC,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_variant (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES store_product(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'Standart',
      sku TEXT,
      barcode TEXT,
      allow_backorder BOOLEAN NOT NULL DEFAULT FALSE,
      manage_inventory BOOLEAN NOT NULL DEFAULT FALSE,
      stock INTEGER NOT NULL DEFAULT 0,
      price BIGINT NOT NULL DEFAULT 0,
      compare_at_price BIGINT,
      currency_code TEXT NOT NULL DEFAULT 'try',
      thumbnail TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      rank INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_product_image (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES store_product(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      rank INTEGER NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS store_product_category (
      product_id TEXT NOT NULL REFERENCES store_product(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES store_category(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS store_product_tag (
      product_id TEXT NOT NULL REFERENCES store_product(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES store_tag(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS store_media (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      filename TEXT,
      storage_key TEXT,
      mime_type TEXT,
      size_bytes BIGINT,
      data_bytes BYTEA,
      data_base64 TEXT,
      title TEXT,
      alt_text TEXT,
      caption TEXT,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE store_media ADD COLUMN IF NOT EXISTS data_base64 TEXT;
    ALTER TABLE store_media ADD COLUMN IF NOT EXISTS data_bytes BYTEA;
    ALTER TABLE store_media ADD COLUMN IF NOT EXISTS storage_key TEXT;
    ALTER TABLE store_media ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE store_media ADD COLUMN IF NOT EXISTS alt_text TEXT;
    ALTER TABLE store_media ADD COLUMN IF NOT EXISTS caption TEXT;
    ALTER TABLE store_media ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE store_media ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE store_media ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    UPDATE store_media
      SET storage_key=CASE
        WHEN url LIKE 'http%' AND filename IS NOT NULL THEN 'uploads/' || filename
        ELSE filename
      END
      WHERE storage_key IS NULL;
    CREATE INDEX IF NOT EXISTS store_media_created_at_idx
      ON store_media(created_at DESC NULLS LAST);
    CREATE INDEX IF NOT EXISTS store_media_deleted_at_idx
      ON store_media(deleted_at);

    CREATE TABLE IF NOT EXISTS store_customer (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      company_name TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_coupon (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'percentage',
      value NUMERIC NOT NULL DEFAULT 0,
      min_subtotal NUMERIC NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      usage_count INTEGER NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE store_coupon ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT NULL;
    ALTER TABLE store_coupon ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE store_coupon ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ DEFAULT NULL;
    ALTER TABLE store_coupon ADD COLUMN IF NOT EXISTS description TEXT;

    -- store_product soft delete destegi
    ALTER TABLE store_product ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

    -- store_campaign tablosu
    CREATE TABLE IF NOT EXISTS store_campaign (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'discount',
      status TEXT NOT NULL DEFAULT 'draft',
      starts_at TIMESTAMPTZ DEFAULT NOW(),
      ends_at TIMESTAMPTZ DEFAULT NULL,
      discount_type TEXT DEFAULT NULL,
      discount_value NUMERIC DEFAULT 0,
      min_subtotal NUMERIC DEFAULT 0,
      usage_count INTEGER NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS store_campaign_status_idx ON store_campaign(status);

    ALTER TABLE store_customer
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;
    ALTER TABLE store_customer
      ADD COLUMN IF NOT EXISTS username TEXT;
    ALTER TABLE store_customer
      ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'Müşteri';
    ALTER TABLE store_customer
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Aktif';
    ALTER TABLE store_customer
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    CREATE UNIQUE INDEX IF NOT EXISTS store_customer_email_unique_idx
      ON store_customer(email);
    CREATE UNIQUE INDEX IF NOT EXISTS store_customer_username_unique_idx
      ON store_customer (LOWER(username)) WHERE username IS NOT NULL;

    CREATE TABLE IF NOT EXISTS store_customer_address (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES store_customer(id) ON DELETE CASCADE,
      address_name TEXT,
      is_default_shipping BOOLEAN NOT NULL DEFAULT FALSE,
      is_default_billing BOOLEAN NOT NULL DEFAULT FALSE,
      company TEXT,
      first_name TEXT,
      last_name TEXT,
      address_1 TEXT,
      address_2 TEXT,
      city TEXT,
      country_code TEXT NOT NULL DEFAULT 'tr',
      province TEXT,
      postal_code TEXT,
      phone TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_customer_token (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES store_customer(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_customer_favorite (
      customer_id TEXT NOT NULL REFERENCES store_customer(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES store_product(id) ON DELETE CASCADE,
      variant_id TEXT REFERENCES store_variant(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (customer_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS store_customer_favorite_customer_idx
      ON store_customer_favorite(customer_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS store_cart (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      email TEXT,
      currency_code TEXT NOT NULL DEFAULT 'try',
      shipping_address JSONB,
      billing_address JSONB,
      shipping_method JSONB,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_cart_item (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL REFERENCES store_cart(id) ON DELETE CASCADE,
      variant_id TEXT NOT NULL REFERENCES store_variant(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price BIGINT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (cart_id, variant_id)
    );

    CREATE TABLE IF NOT EXISTS store_order (
      id TEXT PRIMARY KEY,
      display_id BIGSERIAL UNIQUE,
      customer_id TEXT,
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      currency_code TEXT NOT NULL DEFAULT 'try',
      subtotal BIGINT NOT NULL DEFAULT 0,
      shipping_total BIGINT NOT NULL DEFAULT 0,
      total BIGINT NOT NULL DEFAULT 0,
      shipping_address JSONB,
      billing_address JSONB,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_order_item (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES store_order(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      thumbnail TEXT,
      sku TEXT,
      quantity INTEGER NOT NULL,
      unit_price BIGINT NOT NULL,
      total BIGINT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE SEQUENCE IF NOT EXISTS store_order_display_id_seq START 1001;
    ALTER TABLE store_order ALTER COLUMN display_id SET DEFAULT nextval('store_order_display_id_seq');

    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'not_fulfilled';
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS tracking_number TEXT;
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS tracking_url TEXT;
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS invoice_type TEXT NOT NULL DEFAULT 'individual';
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS invoice_status TEXT NOT NULL DEFAULT 'not_issued';
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS invoice_number TEXT;
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS coupon_code TEXT;
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS discount_total BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE store_order
      ADD COLUMN IF NOT EXISTS tax_total BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE store_order
      ALTER COLUMN created_at SET DEFAULT NOW();
    ALTER TABLE store_order
      ALTER COLUMN updated_at SET DEFAULT NOW();

    CREATE TABLE IF NOT EXISTS store_order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES store_order(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_payment (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES store_order(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL,
      provider_reference TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      amount BIGINT NOT NULL,
      currency_code TEXT NOT NULL DEFAULT 'try',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS store_payment_provider_reference_unique
      ON store_payment(provider_id,provider_reference)
      WHERE provider_reference IS NOT NULL;

    CREATE TABLE IF NOT EXISTS store_inventory_reservation (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL REFERENCES store_cart(id) ON DELETE CASCADE,
      variant_id TEXT NOT NULL REFERENCES store_variant(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS store_inventory_reservation_active_unique
      ON store_inventory_reservation(cart_id,variant_id)
      WHERE status='active';

    CREATE TABLE IF NOT EXISTS store_refund (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL REFERENCES store_payment(id),
      amount BIGINT NOT NULL CHECK (amount > 0),
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      provider_reference TEXT,
      error_message TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE store_refund ADD COLUMN IF NOT EXISTS error_message TEXT;
    ALTER TABLE store_refund ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    CREATE TABLE IF NOT EXISTS store_return_request (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES store_order(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL REFERENCES store_customer(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'requested',
      admin_note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(order_id,customer_id)
    );
    ALTER TABLE store_return_request
      ADD COLUMN IF NOT EXISTS inventory_restored BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE store_return_request
      DROP CONSTRAINT IF EXISTS store_return_request_order_id_customer_id_key;

    CREATE TABLE IF NOT EXISTS store_return_item (
      id TEXT PRIMARY KEY,
      return_request_id TEXT NOT NULL REFERENCES store_return_request(id) ON DELETE CASCADE,
      order_item_id TEXT NOT NULL REFERENCES store_order_item(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(return_request_id,order_item_id)
    );

    CREATE TABLE IF NOT EXISTS store_invoice (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE REFERENCES store_order(id) ON DELETE CASCADE,
      invoice_type TEXT NOT NULL DEFAULT 'individual',
      invoice_number TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      provider_id TEXT,
      provider_reference TEXT,
      pdf_url TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS store_invoice_order_id_unique ON store_invoice(order_id);

    CREATE TABLE IF NOT EXISTS product_reviews (
      id BIGSERIAL PRIMARY KEY,
      product_id TEXT NOT NULL,
      author TEXT NOT NULL,
      email TEXT NOT NULL,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      customer_id TEXT,
      order_id TEXT,
      verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS customer_id TEXT;
    ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS order_id TEXT;
    ALTER TABLE product_reviews
      ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN NOT NULL DEFAULT FALSE;
    CREATE UNIQUE INDEX IF NOT EXISTS product_reviews_verified_order_unique
      ON product_reviews(customer_id,product_id,order_id)
      WHERE customer_id IS NOT NULL AND order_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS notification_outbox (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_setting (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS theme_settings (
      id INTEGER PRIMARY KEY,
      logo_text TEXT DEFAULT 'ZK HOME',
      logo_url TEXT,
      font_family TEXT DEFAULT 'Inter',
      font_size_base TEXT DEFAULT '16px',
      h1_size TEXT DEFAULT '2.5rem',
      h2_size TEXT DEFAULT '2rem',
      h3_size TEXT DEFAULT '1.75rem',
      h4_size TEXT DEFAULT '1.5rem',
      slider_font_title TEXT DEFAULT 'Georgia',
      slider_font_desc TEXT DEFAULT 'Inter',
      header_logo_url TEXT,
      header_logo_dark_url TEXT,
      header_logo_height INTEGER,
      header_logo_alt TEXT,
      footer_logo_url TEXT,
      footer_logo_dark_url TEXT,
      footer_logo_height INTEGER,
      footer_logo_alt TEXT,
      favicon_url TEXT,
      admin_logo_url TEXT,
      admin_logo_height INTEGER,
      admin_logo_alt TEXT,
      mini_logo_url TEXT,
      mini_logo_height INTEGER,
      mini_logo_alt TEXT
    );

    CREATE TABLE IF NOT EXISTS slider (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      image_url_light TEXT,
      heading TEXT,
      subheading TEXT,
      description TEXT,
      badge_text TEXT,
      badge_color TEXT,
      bg_color TEXT,
      button_text TEXT,
      button_link TEXT,
      button_color TEXT,
      button2_text TEXT,
      button2_link TEXT,
      button2_color TEXT,
      text_color TEXT,
      features TEXT,
      right_features TEXT,
      top_bar_features TEXT,
      top_bar_color TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS content_pages (
      handle TEXT PRIMARY KEY,
      title TEXT,
      content JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content_pages_deleted (
      handle TEXT PRIMARY KEY,
      content JSONB NOT NULL DEFAULT '{}'::jsonb,
      original_updated_at TIMESTAMPTZ,
      deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blog_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL DEFAULT 'file-text',
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category_id TEXT REFERENCES blog_categories(id) ON DELETE SET NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT 'Editör',
      reading_time TEXT NOT NULL DEFAULT '5 dk',
      status TEXT NOT NULL DEFAULT 'draft',
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      views INTEGER NOT NULL DEFAULT 0,
      seo_title TEXT,
      seo_description TEXT,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts(status);
    CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON blog_posts(category_id);

    CREATE TABLE IF NOT EXISTS navigation_menu (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      handle TEXT,
      location JSONB NOT NULL DEFAULT '[]'::jsonb,
      items JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS category_settings (
      id TEXT PRIMARY KEY DEFAULT 'main',
      icon_size TEXT NOT NULL DEFAULT '24',
      font_size TEXT NOT NULL DEFAULT '12',
      font_weight TEXT NOT NULL DEFAULT '700',
      icon_color TEXT NOT NULL DEFAULT '#C98484',
      text_color TEXT NOT NULL DEFAULT '#312727',
      icon_bg TEXT NOT NULL DEFAULT '#FCF7F6',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS homepage_categories (
      category_id TEXT PRIMARY KEY REFERENCES store_category(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS featured_section (
      id TEXT PRIMARY KEY DEFAULT 'main',
      title TEXT NOT NULL DEFAULT 'ÖNE ÇIKAN ÜRÜNLER',
      subtitle TEXT NOT NULL DEFAULT 'Mağazada öne çıkan ürünler.',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS featured_tabs (
      id BIGSERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_integration (
      provider TEXT PRIMARY KEY,
      name TEXT,
      integration_type TEXT NOT NULL DEFAULT 'payment',
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      environment TEXT NOT NULL DEFAULT 'test',
      public_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      encrypted_config TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE store_integration ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE store_integration
      ADD COLUMN IF NOT EXISTS integration_type TEXT NOT NULL DEFAULT 'payment';

    CREATE INDEX IF NOT EXISTS store_product_status_idx ON store_product(status);
    CREATE INDEX IF NOT EXISTS store_product_handle_idx ON store_product(handle);
    CREATE INDEX IF NOT EXISTS store_variant_product_idx ON store_variant(product_id);
    CREATE INDEX IF NOT EXISTS store_product_category_category_idx ON store_product_category(category_id);
    CREATE INDEX IF NOT EXISTS store_cart_item_cart_idx ON store_cart_item(cart_id);
    CREATE INDEX IF NOT EXISTS store_order_customer_idx ON store_order(customer_id);
    CREATE INDEX IF NOT EXISTS store_order_status_idx ON store_order(status);
    CREATE INDEX IF NOT EXISTS store_payment_order_idx ON store_payment(order_id);
    CREATE INDEX IF NOT EXISTS store_order_history_order_idx ON store_order_status_history(order_id);
    CREATE INDEX IF NOT EXISTS notification_outbox_status_idx ON notification_outbox(status, created_at);
    CREATE INDEX IF NOT EXISTS store_customer_token_lookup_idx
      ON store_customer_token(token_hash,type,expires_at);

    -- Bireysel müşterilerden T.C. kimlik numarası alınmaz veya saklanmaz.
    -- Önceki geliştirme sürümlerinde oluşmuş şifreli alanları da temizle.
    UPDATE store_cart
    SET metadata = COALESCE(metadata, '{}'::jsonb) - 'invoice_identity',
        updated_at = NOW()
    WHERE COALESCE(metadata, '{}'::jsonb) ? 'invoice_identity';
    UPDATE store_order
    SET metadata = COALESCE(metadata, '{}'::jsonb) - 'invoice_identity',
        updated_at = NOW()
    WHERE COALESCE(metadata, '{}'::jsonb) ? 'invoice_identity';

  `)
}

import { hashPassword } from "./customer-auth"

export function ensureCommerceSchema() {
  // Production schema changes belong to deployment migrations. Replaying the
  // full DDL/bootstrap script in every serverless cold start adds seconds to
  // storefront TTFB and can create lock contention under traffic.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.RUN_SCHEMA_BOOTSTRAP !== "true"
  ) {
    return Promise.resolve()
  }

  if (!global._schemaPromise) {
    global._schemaPromise = createSchema().then(async () => {
      const bootstrapPassword = (process.env.ADMIN_PASSWORD || "").trim()
      if (!bootstrapPassword) return
      const adminPassHash = hashPassword(bootstrapPassword)
      await query(
        `INSERT INTO store_customer (id, username, email, password_hash, first_name, last_name, role, status, email_verified)
         VALUES ($1, 'admin', $2, $3, 'Sistem', 'Yöneticisi', 'Admin', 'Aktif', TRUE)
         ON CONFLICT (email) DO NOTHING`,
        [
          "cust_admin_master",
          process.env.ADMIN_EMAIL || "admin@zk-home.com",
          adminPassHash,
        ]
      ).catch(() => null)
    }).catch((error: any) => {
      console.warn("Commerce schema initialization warning:", error?.message || error)
      global._schemaPromise = null
    })
  }
  return global._schemaPromise
}
