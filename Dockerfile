FROM ruby:3.1

# Install dependencies
RUN apt-get update -qq && \
    apt-get install -y build-essential libpq-dev nodejs

# Set working directory
WORKDIR /srv/jekyll

# Install Jekyll and Bundler
RUN gem install jekyll bundler

# Copy Gemfile and Gemfile.lock if they exist
COPY Gemfile* ./

# Install gems if Gemfile exists
RUN if [ -f Gemfile ]; then bundle install; fi

# Copy the rest of the site
COPY . .

# Expose the default Jekyll port
EXPOSE 4000

# Serve the site
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload"] 