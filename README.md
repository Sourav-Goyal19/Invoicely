# Invoicely

Invoicely is a web application designed for shop retailers to generate GST-compliant invoices and manage their transactions efficiently. It automates the process of calculating totals, GST, and formatting invoices, simplifying the billing process for businesses.

## Features

- 🧾 **GST-Compliant Invoice Generation:** Effortlessly create detailed invoices with product descriptions, quantities, prices, GST calculations, and totals.
- 📂 **Transaction Management Dashboard:** Manage all invoices with an interactive dashboard featuring sorting, filtering, and date-range selection.
- 🏷️ **Category and Product Management:** Organize inventory with easy-to-use category and product management tools.
- 🏢 **Multi-Branch Support:** Manage invoices and transactions for multiple business branches seamlessly.
- 🔍 **Smart Search for Transactions:** Search invoices by specific parameters like total amount, date, or GST percentage for quick retrieval.
- 📜 **Digital and Printable Invoices:** Generate PDF invoices for digital sharing or high-quality printing.
- ⏳ **Loading Skeletons for Transactions:** Enhance user experience with skeleton UI during data loading.
- 🗑️ **Bulk Transaction Deletion:** Quickly delete multiple transactions for easier data management.
- 🔐 **Secure Authentication with Next Auth:** Ensure secure access with authentication and role-based permissions.
- 🌟 **User Settings and Preferences:** Customize application settings, themes, and notification preferences.
- 💾 **Cloud Backup and Restore:** Never lose data with automated cloud backups and easy restoration.
- 🔥 **Optimized API via Hono.js:** Experience fast and reliable performance with a streamlined backend.
- 🎨 **Styled with TailwindCSS and Shadcn UI:** Ensure modern, responsive, and accessible design across devices.
- 🚀 **Deployed on Vercel:** Benefit from fast, scalable, and reliable deployment.


## Tech Stack

- **Frontend:** Next.js, TypeScript
- **Backend:** Drizzle ORM, Hono.js
- **Database:** PostgreSQL
- **PDF Generation:** jsPDF

## Installation

To set up and run Invoicely locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/Sourav-Goyal19/invoicely.git
   cd invoicely
   ```

2. Install the dependencies:

   ```
   npm install
   ```

3. Provide your own database connection string and `NEXTAUTH_SECRET` in the `.env` file.

   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DATABASE_URL=""
   NEXT_PUBLIC_DATABASE_URL=""
   AUTH_DRIZZLE_URL=""
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=
   JWT_SECRET=
   JWT_SIGNING_KEY=
   JWT_ENCRYPTION_KEY=
   JWT_MAX_AGE=
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Usage

- Access the application through the provided URL and start generating GST-compliant invoices.
- Use the interface to create invoices, manage transactions, categorize products, and filter by date.

## Deployment

For deployment instructions, you can follow the typical Next.js deployment process. The application is live at [here](https://invoicely-manager.vercel.app).

## Contributing

Contributions are welcome! Please follow the standard fork-and-pull request workflow. Ensure your code adheres to the project's coding standards and passes all tests.
