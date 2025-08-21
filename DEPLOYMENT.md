# Deployment Guide

This guide covers different deployment options for the Gemini Advanced Chat UI. The repository is now **cloud-ready** with deployment configurations for all major platforms.

## ✅ Deployment Readiness Checklist

The repository includes:
- ✅ Optimized Vite configuration with proper React plugin
- ✅ Fixed CSS bundling and asset management
- ✅ SPA routing support with redirects
- ✅ Platform-specific configuration files (`vercel.json`, `netlify.toml`)
- ✅ GitHub Actions workflow for GitHub Pages
- ✅ Docker configuration for containerized deployments
- ✅ Security headers and caching optimizations
- ✅ Environment variable management

## Vercel Deployment (Recommended)

1. **Fork/Clone the repository**
2. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Login to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy:**
   ```bash
   vercel
   ```

5. **Set Environment Variables:**
   - In your Vercel dashboard, go to your project settings
   - Add `VITE_API_KEY` with your Gemini API key value

## Netlify Deployment

1. **Connect your GitHub repository** to Netlify
2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Environment variables:**
   - Add `VITE_API_KEY` with your Gemini API key value

## GitHub Pages Deployment

1. **Enable GitHub Actions** in your repository
2. **Create `.github/workflows/deploy.yml`:**
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             
         - name: Install dependencies
           run: npm install
           
         - name: Build
           run: npm run build
           env:
             VITE_API_KEY: ${{ secrets.VITE_API_KEY }}
             
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

3. **Add repository secret:**
   - Go to Settings → Secrets and variables → Actions
   - Add `VITE_API_KEY` with your Gemini API key

## Docker Deployment (NEW)

The repository now includes a complete Docker setup for containerized deployments:

1. **Build Docker image:**
   ```bash
   docker build -t gemini-chat .
   ```

2. **Run container:**
   ```bash
   docker run -p 80:80 gemini-chat
   ```

3. **For cloud platforms (AWS ECS, Google Cloud Run, Azure Container Instances):**
   - Push to your container registry
   - Deploy using platform-specific instructions
   - Set `VITE_API_KEY` environment variable during build

## Railway Deployment (NEW)

1. **Connect your GitHub repository** to Railway
2. **Railway will automatically detect the `railway.json` configuration**
3. **Set environment variables:**
   - Add `VITE_API_KEY` with your Gemini API key
4. **Deploy** - Railway will build using the included Dockerfile

## Self-Hosting

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Serve the `dist` folder** using any web server:
   ```bash
   # Using Python
   cd dist && python -m http.server 8000
   
   # Using Node.js serve
   npx serve dist
   
   # Using nginx, apache, etc.
   ```

## Environment Variables

Make sure to set the following environment variable in your deployment platform:

- `VITE_API_KEY`: Your Google Gemini API key

## HTTPS Requirement

The application requires HTTPS to work properly due to browser security restrictions for file uploads and API calls. All modern deployment platforms provide HTTPS by default.
