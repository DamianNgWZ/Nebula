# 🌌 Nebula: Scheduling for Your Business
Try our App: http://nebula-seven-bice.vercel.app/

**A scheduling application built to reduce admin overhead for small businesses.**

---

## 🎯 Motivation

The motivation behind our project stems from real-world challenges faced by owners of 
home-based or independent businesses. Through conversations with such business owners, 
we gained valuable insights into the inefficiencies, especially so in service oriented 
businesses such as hair stylists, make-up artists and the likeness. 

They face administrative hassles managing appointments and communicating with clients, 
especially when demand for the services they offer surges. Therefore, we aim to create 
a web app that shoulders the administrtative burden of scheduling appointments and reminding clients of said 
appointments. We aim to decrease the valuable time spent on such repetitive and human-error inducing
processes, giving this time back to business owners to actually allow them to work on enhancing their
services to the best of their abilities.

---

## ✨ Features

- Schedule meetings and manage availability
- Integration with Google Calendar (via Nylas)
- OAuth authentication via Google and GitHub
- Responsive UI with Tailwind and Shadcn/UI components

---

## 🛠 Tech Stack

**Frontend:** Next.js, Tailwind CSS, Shadcn/UI, Conform  
**Backend/API:** Next.js API routes, Nylas  
**Authentication:** Auth.js  
**Database:** Supabase (with Prisma ORM)  
**Deployment & Testing:** Vercel

---

## 🚀 Getting Started

To run the project locally:

1. **Clone the repository and navigate into it**

   ```bash
   git clone https://github.com/yourusername/nebula.git
   cd nebula
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**

   Copy the example env file and update it with real values:

   ```bash
   cp .env.example .env
   ```

   Then open `.env` in your editor and update the placeholders:

   ```env
   DATABASE_URL="postgresql://<user>:<password>@<supabase-url>:6543/postgres?pgbouncer=true&statement_cache_mode=unsafe"

   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"

   AUTH_GITHUB_ID="your-github-client-id"
   AUTH_GITHUB_SECRET="your-github-client-secret"

   AUTH_SECRET="your-auth-secret"
   ```

   > ⚠️ You do **not** need to run `npx prisma db push`, `migrate`, or any Prisma CLI commands.  
   > The database is already provisioned — this setup is just for running and testing the app locally.

4. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

---

## 📁 Project Structure

/app → App Router-based pages  
/components → UI components  
/prisma → Prisma schema and config  
/lib → Auth, DB, utilities  
/public → Static assets (logos, etc.)

---

## 🌐 Deployment

Deployed on [Vercel](https://vercel.com/). Pushes to `main` auto-deploy.

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Auth.js Docs](https://authjs.dev)

---

## 🤝 Contributions

Feel free to fork, clone, and open pull requests! All contributions are welcome.
