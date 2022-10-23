# Dockerize Angular

## summary

- angular build is started on `--watch` flag
  - i.e. `ng build --watch`
- `Dockerfile` is for the `nginx` image
  - copies the `nginx.conf` file from `client` root dir to `/etc/nginx/conf.d/default.conf`
- `docker compose` is used to mount the `./client/dist/client` folder to nginx server root: `/usr/share/nginx/html`

- as the `ng build --watch` builds latest angular source code into the build folder `./client/dist/client`, the `nginx` container serves the latest updates real-time on `http://localhost/`

## known dependencies

- docker desktop
- node version manager (`nvm`)
- `angular-cli`

## steps

1. `mkdir project-root-dir`
2. `cd project-root-dir`
3. `touch docker-compose.yml`
   ```yml
   # docker-compose.yml
   services:
     nginx_env:
       build: ./client
       container_name: nginx-docker
       ports:
         - 80:80
       volumes:
         - ./client/dist/client:/usr/share/nginx/html
   ```
4. `nvm use 16.15.1`
5. `npm install -g @angular/cli`
6. `ng new client --skip-git`

   - _router?_ : **yes**
   - _css_

7. `cd client`
8. `touch Dockerfile`
   ```ruby
   # Defining nginx image to be used
   FROM nginx:latest AS ngi
   # Copying compiled code and nginx config to different folder
   # NOTE: This path may change according to your project's output folder
   # COPY /dist/src/app/dist/client /usr/share/nginx/html
   COPY /nginx.conf  /etc/nginx/conf.d/default.conf
   # Exposing a port, here it means that inside the container
   # the app will be using Port 80 while running
   EXPOSE 80
   ```
9. `touch nginx.conf`

   ```
   server {
     listen 80;
     sendfile on;
     default_type application/octet-stream;

     gzip on;
     gzip_http_version 1.1;
     gzip_disable      "MSIE [1-6]\.";
     gzip_min_length   256;
     gzip_vary         on;
     gzip_proxied      expired no-cache no-store private auth;
     gzip_types        text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;
     gzip_comp_level   9;

     root /usr/share/nginx/html;

     location / {
       try_files $uri $uri/ /index.html =404;
     }
   }
   ```

10. `ng build --watch`
11. open new terminal, go to root `cd /..path/..to/project-root-dir`
12. `touch .gitignore` in the project root from the client root
    - add `DS_Store` inside this file
13. `docker compose up`
