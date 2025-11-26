# Use PHP + Apache
FROM php:8.2-apache

# Install MySQL-related extensions
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Our app will go live here
WORKDIR /var/www/html

# Copy frontend and backend into the container
COPY frontend/ /var/www/html/frontend/
COPY backend/ /var/www/html/backend/
COPY sql/ /var/www/html/sql/

# Permissions (optional but nice)
RUN chown -R www-data:www-data /var/www/html

# Apache listens on 80 inside the container
EXPOSE 80
