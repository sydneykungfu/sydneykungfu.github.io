# sydneykungfu.github.io

## Update tailwind.min.css

> npx tailwindcss-cli@latest build -i ./assets/css/input.css -o ./assets/css/tailwind.min.css --minify

## Start Jekyll site

### build 

> docker build -t my-jekyll-site .


### run 

> docker run --rm -p 4000:4000 -v "$PWD":/srv/jekyll my-jekyll-site