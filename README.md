# sydneykungfu.github.io

## Update tailwind.min.css

> npx tailwindcss-cli@latest build -i ./assets/css/input.css -o ./assets/css/tailwind.min.css --minify

## Start Jekyll site

### build 

> docker build -t my-jekyll-site .


### run 

> docker run --rm -p 4000:4000 -v "$PWD":/srv/jekyll my-jekyll-site

### Adding watermark

magick assets/images/blogs/choy-lee-fut-lee-koon-hung-wong-tat-mau-san-sau-01.png -gravity southeast -pointsize 36 -fill "rgba(255,255,255,0.8)" -annotate +10+10 "source: sydneykungfu.au" assets/images/blogs/choy-lee-fut-lee-koon-hung-wong-tat-mau-san-sau-01-wm.png

for i in {01..13}; do
  magick assets/images/blogs/choy-lee-fut-kick-techniques-$i.png \
    -gravity southeast -pointsize 36 -fill "rgba(0,0,0,0.5)" \
    -annotate +10+10 "source: sydneykungfu.au" \
    assets/images/blogs/choy-lee-fut-kick-techniques-${i}-wm.png
done