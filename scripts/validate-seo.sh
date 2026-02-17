#!/bin/bash
# SEO Validation Script for PQC Today

echo "🔍 PQC Today - SEO Validation"
echo "=============================="
echo ""

BASE_URL="https://www.pqctoday.com"

# Check meta tags
echo "1. Meta Tags:"
curl -s "$BASE_URL" | grep -o '<title>.*</title>' && echo "  ✅ Title tag found" || echo "  ❌ Title tag missing"
curl -s "$BASE_URL" | grep -q 'og:title' && echo "  ✅ OG title found" || echo "  ❌ OG title missing"
curl -s "$BASE_URL" | grep -q 'og:image' && echo "  ✅ OG image found" || echo "  ❌ OG image missing"
curl -s "$BASE_URL" | grep -q 'twitter:card' && echo "  ✅ Twitter card found" || echo "  ❌ Twitter card missing"
echo ""

# Check structured data
echo "2. Structured Data:"
curl -s "$BASE_URL" | grep -q 'application/ld+json' && echo "  ✅ JSON-LD found" || echo "  ❌ JSON-LD missing"
curl -s "$BASE_URL" | grep -q '"@type":"WebApplication"' && echo "  ✅ WebApplication schema found" || echo "  ❌ WebApplication schema missing"
echo ""

# Check static files
echo "3. Static Files:"
curl -sI "$BASE_URL/robots.txt" | grep -q "200" && echo "  ✅ robots.txt (200 OK)" || echo "  ❌ robots.txt not found"
curl -sI "$BASE_URL/sitemap.xml" | grep -q "200" && echo "  ✅ sitemap.xml (200 OK)" || echo "  ❌ sitemap.xml not found"
curl -sI "$BASE_URL/favicon.svg" | grep -q "200" && echo "  ✅ favicon.svg (200 OK)" || echo "  ❌ favicon.svg not found"
curl -sI "$BASE_URL/og-image.png" | grep -q "200" && echo "  ✅ og-image.png (200 OK)" || echo "  ❌ og-image.png not found"
echo ""

# Check sitemap content
echo "4. Sitemap Routes:"
ROUTES=$(curl -s "$BASE_URL/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | wc -l | tr -d ' ')
echo "  📊 $ROUTES routes in sitemap"
curl -s "$BASE_URL/sitemap.xml" | grep -q '/timeline' && echo "  ✅ /timeline route found" || echo "  ❌ /timeline route missing"
curl -s "$BASE_URL/sitemap.xml" | grep -q '/algorithms' && echo "  ✅ /algorithms route found" || echo "  ❌ /algorithms route missing"
echo ""

# Check key pages
echo "5. Key Pages (HTTP Status):"
for page in "" "timeline" "algorithms" "playground" "learn" "compliance"; do
  STATUS=$(curl -sI "$BASE_URL/$page" | grep "HTTP" | awk '{print $2}')
  if [ "$STATUS" = "200" ]; then
    echo "  ✅ /$page - $STATUS OK"
  else
    echo "  ❌ /$page - $STATUS"
  fi
done
echo ""

# Check share buttons exist
echo "6. Share Button Deployment:"
curl -s "$BASE_URL/assets/ShareButton"*.js >/dev/null 2>&1 && echo "  ✅ ShareButton component deployed" || echo "  ⚠️  ShareButton component not found"
curl -s "$BASE_URL/assets/LandingView"*.js >/dev/null 2>&1 && echo "  ✅ LandingView component deployed" || echo "  ⚠️  LandingView component not found"
echo ""

echo "=============================="
echo "✨ Validation complete!"
echo ""
echo "Next steps:"
echo "1. Test social previews: https://developers.facebook.com/tools/debug/"
echo "2. Run Lighthouse audit in Chrome DevTools"
echo "3. Submit sitemap in Google Search Console"
