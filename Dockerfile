FROM node:20-alpine AS builder
WORKDIR /build
COPY app/package*.json ./
RUN npm ci
COPY app/ .

ARG VITE_SUPABASE_URL=https://bdhmnvmmqejwvqestjyl.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkaG1udm1tcWVqd3ZxZXN0anlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDM2MDksImV4cCI6MjA5NTk3OTYwOX0.oGijSXjWspc8BlvTDH92W7veu-roAvYAs9KWTkgcM0I
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

FROM nginx:alpine
COPY --from=builder /build/dist /usr/share/nginx/html
COPY app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
