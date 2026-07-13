FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 index.html /usr/share/nginx/html/index.html
COPY --chown=101:101 assets /usr/share/nginx/html/assets
COPY --chown=101:101 pages /usr/share/nginx/html/pages

USER 101
EXPOSE 8080
