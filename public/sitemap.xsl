<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="tr">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex,follow"/>
        <title>ZK HOME · Site Haritası (Sitemap XML)</title>
        <style>
          :root {
            --brand-orange: #C98484;
            --brand-dark: #0B0E11;
            --muted: #64748B;
            --border: #E2E8F0;
            --bg: #F8FAFC;
            --card-bg: #FFFFFF;
            --soft-orange: #FFF7ED;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--brand-dark);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.5;
          }
          .wrap {
            max-width: 1100px;
            margin: 0 auto;
            padding: 32px 20px 64px;
          }
          header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 16px;
          }
          .logo {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: var(--brand-orange);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-weight: 900;
            font-size: 22px;
            letter-spacing: -0.5px;
            box-shadow: 0 4px 12px rgba(201, 132, 132, 0.25);
          }
          h1 {
            font-size: 24px;
            margin: 0;
            font-weight: 800;
            letter-spacing: -0.02em;
            color: var(--brand-dark);
          }
          .sub {
            color: var(--muted);
            margin: 4px 0 24px;
            font-size: 13.5px;
          }
          .meta {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }
          .pill {
            background: var(--soft-orange);
            color: var(--brand-orange);
            border: 1px solid #FFEDD5;
            border-radius: 999px;
            padding: 6px 16px;
            font-weight: 700;
            font-size: 12.5px;
          }
          .card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #F1F5F9;
            text-align: left;
            padding: 13px 18px;
            font-size: 11px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--muted);
            border-bottom: 1px solid var(--border);
            font-weight: 700;
          }
          td {
            padding: 12px 18px;
            border-bottom: 1px solid #F1F5F9;
            vertical-align: middle;
            font-size: 13px;
          }
          tr:last-child td {
            border-bottom: 0;
          }
          tr:hover td {
            background: #FAF5F0;
          }
          a {
            color: var(--brand-orange);
            text-decoration: none;
            font-weight: 600;
            word-break: break-all;
          }
          a:hover {
            text-decoration: underline;
          }
          .num {
            color: var(--muted);
            font-variant-numeric: tabular-nums;
            width: 50px;
          }
          .badge {
            display: inline-block;
            background: #F1F5F9;
            color: #475569;
            border-radius: 6px;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: 700;
          }
          .foot {
            color: var(--muted);
            font-size: 12px;
            margin-top: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          @media (max-width: 640px) {
            .hide-sm { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <div class="logo">S</div>
            <div>
              <h1>ZK HOME · Site Haritası</h1>
            </div>
          </header>
          <xsl:apply-templates/>
        </div>
      </body>
    </html>
  </xsl:template>

  <!-- SITEMAP INDEX TEMPLATE -->
  <xsl:template match="sm:sitemapindex">
    <p class="sub">ZK HOME resmi XML site haritası dizini. Arama motorları aşağıdaki her haritayı ayrı ayrı tarayabilir.</p>
    <div class="meta">
      <span class="pill"><xsl:value-of select="count(sm:sitemap)"/> Alt Harita</span>
    </div>
    <div class="card">
      <table>
        <tr>
          <th class="num">#</th>
          <th>Site Haritası Bağlantısı</th>
          <th class="hide-sm">Son Güncelleme</th>
        </tr>
        <xsl:for-each select="sm:sitemap">
          <tr>
            <td class="num"><xsl:value-of select="position()"/></td>
            <td>
              <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
            </td>
            <td class="hide-sm">
              <span class="badge"><xsl:value-of select="substring(sm:lastmod, 1, 10)"/></span>
            </td>
          </tr>
        </xsl:for-each>
      </table>
    </div>
    <div class="foot">
      <span>ZK HOME · zk-home.com</span>
      <span>Arama Motoru İndeksleme Haritası</span>
    </div>
  </xsl:template>

  <!-- URLSET TEMPLATE -->
  <xsl:template match="sm:urlset">
    <p class="sub">Bu haritadaki tüm dizine eklenebilir URL adresleri, öncelik puanları ve son güncelleme tarihleri.</p>
    <div class="meta">
      <span class="pill"><xsl:value-of select="count(sm:url)"/> İndekslenebilir Adres</span>
    </div>
    <div class="card">
      <table>
        <tr>
          <th class="num">#</th>
          <th>URL Adresi</th>
          <th class="hide-sm">Güncelleme Sıklığı</th>
          <th class="hide-sm">Öncelik</th>
          <th class="hide-sm">Son Güncelleme</th>
        </tr>
        <xsl:for-each select="sm:url">
          <tr>
            <td class="num"><xsl:value-of select="position()"/></td>
            <td>
              <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
            </td>
            <td class="hide-sm">
              <span class="badge"><xsl:value-of select="sm:changefreq"/></span>
            </td>
            <td class="hide-sm">
              <span class="badge"><xsl:value-of select="sm:priority"/></span>
            </td>
            <td class="hide-sm">
              <xsl:if test="sm:lastmod">
                <span class="badge"><xsl:value-of select="substring(sm:lastmod, 1, 10)"/></span>
              </xsl:if>
            </td>
          </tr>
        </xsl:for-each>
      </table>
    </div>
    <div class="foot">
      <span>ZK HOME · zk-home.com</span>
      <span><a href="/sitemap.xml">← Site Haritası Dizinine Dön</a></span>
    </div>
  </xsl:template>
</xsl:stylesheet>
