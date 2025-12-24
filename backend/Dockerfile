# Use the official PHP image
FROM php:8.2-cli

# Set the working directory inside the container
WORKDIR /var/www/html

# Install system dependencies required for Laravel & Database
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql

# Install Composer (The PHP Package Manager)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy all your backend files into the container
COPY . .

# Install Laravel dependencies
RUN composer install --no-dev --optimize-autoloader

# Allow the container to use port 10000 (Render's default) or dynamic $PORT
EXPOSE 8000

# The command to start the application
CMD php artisan migrate --force && php artisan serve --host 0.0.0.0 --port $PORT