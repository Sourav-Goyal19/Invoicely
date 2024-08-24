# Invoicely

Invoicely is a web application designed for shop retailers to generate GST-compliant invoices and manage their transactions efficiently. It automates the process of calculating totals, GST, and formatting invoices, simplifying the billing process for businesses.

## Features

- **Invoice Generation:** Create detailed invoices with transaction details, including quantity, name, price, and totals before and after GST.
- **Transaction Management:** View and manage all created invoices with dates and totals.
- **Category Management:** Create and categorize products for better organization.
- **Branch Management:** Handle multiple business branches with separate invoicing.
- **Transaction Filtering:** Filter transactions by date range.
- **Special Transaction Finder:** Find transactions that sum up to a specific total, useful for generating accurate bills or invoices for accountants and ITR.

## Tech Stack

- **Frontend:** Next.js, TypeScript
- **Backend:** Drizzle ORM, Hono.js
- **Database:** PostgreSQL
- **PDF Generation:** jsPDF

## Installation

To set up and run Finflow locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/finflow.git
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
