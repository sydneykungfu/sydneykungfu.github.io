FROM ruby:3.1

# Install dependencies
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs build-essential libpq-dev

# Set working directory
WORKDIR /srv/jekyll

# Install Jekyll and Bundler
RUN gem install jekyll bundler

# Copy Gemfile and Gemfile.lock if they exist
COPY Gemfile* ./

# Install gems if Gemfile exists
RUN if [ -f Gemfile ]; then bundle install; fi

# Copy package.json and package-lock.json
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy the rest of the site
COPY . .

# Expose the default Jekyll port
EXPOSE 4000

# Serve the site
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload"]