# =============================================================================
# Stage 1 – PHP base image (Statamic / Laravel)
# =============================================================================
FROM php:8.3-fpm-alpine AS base

LABEL org.opencontainers.image.title="Claryeo Marketing"
LABEL org.opencontainers.image.source="https://github.com/claryeo-labs/claryeo-marketing"

RUN apk add --no-cache \
        curl \
        libpng-dev \
        libjpeg-turbo-dev \
        libwebp-dev \
        libzip-dev \
        zip \
        unzip \
        git \
        icu-dev \
        oniguruma-dev \
        libxml2-dev \
        freetype-dev \
        sqlite-dev \
        autoconf \
        g++ \
        make \
    && rm -rf /var/cache/apk/*

RUN docker-php-ext-configure gd \
        --with-freetype \
        --with-jpeg \
        --with-webp \
    && docker-php-ext-install -j"$(nproc)" \
        pdo \
        pdo_sqlite \
        bcmath \
        gd \
        zip \
        intl \
        pcntl \
        opcache \
        mbstring \
        xml \
        exif \
    && apk del autoconf g++ make

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# =============================================================================
# Stage 2 – Node.js asset builder (Vite + React islands)
# =============================================================================
FROM node:22-alpine AS assets

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# Pin pnpm to the version that produced the lockfile (newer pnpm enforces a
# supply-chain minimum-release-age policy that rejects recent transitive deps).
RUN corepack prepare pnpm@10.33.0 --activate \
    && pnpm install --frozen-lockfile --ignore-scripts

COPY resources/ resources/
COPY public/ public/
COPY vite.config.js tsconfig.json ./

RUN pnpm run build

# =============================================================================
# Stage 3 – Production (Statamic + PHP-FPM, self-contained)
# =============================================================================
FROM base AS production

COPY .docker/php/php.ini         /usr/local/etc/php/conf.d/99-custom.ini
COPY .docker/php/php-opcache.ini /usr/local/etc/php/conf.d/100-opcache.ini
COPY .docker/php/www-prod.conf   /usr/local/etc/php-fpm.d/www.conf

# A throwaway key so artisan can boot during the image build (real key is
# injected at runtime via the APP_KEY env var on Railway).
ENV APP_ENV=production \
    APP_KEY=base64:2fl3r6uqlKj5yX7Yv1VzqN8p3tR5wH0k9mL4jF6dC8=

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --no-interaction \
    --prefer-dist

COPY . .

COPY --from=assets /app/public/build ./public/build

RUN composer dump-autoload --optimize --classmap-authoritative --no-dev \
    && php artisan statamic:install --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache content users \
    && chmod -R 775 storage bootstrap/cache content users

# =============================================================================
# Stage 4 – Railway (Nginx + PHP-FPM in one container via supervisord)
#
# Build:  docker build --target railway -t claryeo-marketing .
# Run:    docker run -p 8080:8080 -e PORT=8080 claryeo-marketing
# =============================================================================
FROM production AS railway

RUN apk add --no-cache nginx supervisor gettext \
    && mkdir -p /var/log/nginx /var/lib/nginx/tmp /run/nginx

COPY .docker/railway/nginx.conf            /etc/nginx/nginx.conf
COPY .docker/railway/site.conf.template    /etc/nginx/templates/site.conf.template
COPY .docker/railway/supervisord.conf      /etc/supervisord.conf

COPY .docker/railway/entrypoint.sh /usr/local/bin/railway-entrypoint
RUN chmod +x /usr/local/bin/railway-entrypoint

ENTRYPOINT ["railway-entrypoint"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
