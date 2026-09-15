#!/usr/bin/env bash
set -euo pipefail

rm -rf _site
mkdir -p _site

# Alistigo website at root
cp -r websites/alistigo/dist/. _site/

# Storybook at /storybook/
mkdir -p _site/storybook
cp -r websites/storybook/storybook-static/. _site/storybook/

# Playground at /playground/
mkdir -p _site/playground/en _site/playground/fr
cp -r apps/alistigo-artifact-playground/dist/en/. _site/playground/en/
cp -r apps/alistigo-artifact-playground/dist/fr/. _site/playground/fr/

# /playground/ — detect browser language and redirect
cat > _site/playground/index.html << 'HTMLEOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Alistigo Playground</title>
    <script>
      var supported = ['en', 'fr'];
      var loc = (navigator.languages || [navigator.language || 'en'])
        .map(function (l) { return l.slice(0, 2).toLowerCase(); })
        .find(function (l) { return supported.indexOf(l) !== -1; }) || 'en';
      window.location.replace('./' + loc + '/');
    </script>
  </head>
  <body>
    <a href="./en/">English</a> | <a href="./fr/">Fran&#231;ais</a>
  </body>
</html>
HTMLEOF

echo "www.alistigo.com" > _site/CNAME
