FROM php:8.2-apache

RUN docker-php-ext-install mysqli pdo pdo_mysql

WORKDIR /var/www/html

# Copy your app into the container
COPY frontend/ /var/www/html/frontend/
COPY backend/ /var/www/html/backend/
COPY sql/ /var/www/html/sql/

# Root index.html that just redirects to the real frontend page
RUN printf '%s\n' \
  '<!doctype html>' \
  '<html><head>' \
  '<meta charset="utf-8" />' \
  '<meta http-equiv="refresh" content="0; url=/frontend/index.html" />' \
  '<title>Mixtape</title>' \
  '</head><body>' \
  '<p>Redirecting to <a href="/frontend/index.html">Mixtape</a>...</p>' \
  '</body></html>' \
  > /var/www/html/index.html

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
