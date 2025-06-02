
# 🛡️FraudShield: Advanced Fraud Detection System

FraudShield is a robust web application designed to monitor and detect fraudulent financial transactions in real-time. Leveraging modern web technologies and a machine learning-driven approach, it provides users with insights into their transaction patterns, flags suspicious activities, and offers tools for managing potential fraud cases.

## ✨ Features

*   **User Authentication**: Secure sign-up and login using email/password or social providers (Google) via Supabase Auth.
*   **Real-time Transaction Monitoring**: Track all financial transactions with instant updates.
*   **Fraud Detection & Risk Assessment**: Each transaction is assessed for risk using a conceptual fraud detection model, providing a risk score and flagging potentially fraudulent activities.
*   **Transaction Details & Actions**: View comprehensive details for each transaction, with options to dispute or report suspicious activities.
*   **P2P Transfers**: Facilitate secure peer-to-peer money transfers between users.
*   **Notifications**: Receive real-time alerts for incoming P2P transfers.
*   **Beneficiary Management**: Easily view and manage a list of frequent P2P transfer recipients.
*   **Fraud Case Management**: A dedicated section for tracking and managing reported fraud cases, including status updates and notes.
*   **Transaction Analytics**: Visual dashboards for monthly spending, received funds, and overall transaction activity.
*   **Statements**: Generate and download transaction statements for specific periods.
*   **Search Functionality**: Quickly find transactions by merchant, category, or amount.
*   **Theme Toggle**: Switch between light and dark modes for a personalized viewing experience.
*   **Responsive Design**: Optimized for seamless use across various devices (desktop, tablet, mobile).
  


## 🚀 Technologies Used

*   **Frontend**:
    *   **React**: A JavaScript library for building user interfaces.
    *   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
    *   **Vite**: A fast build tool for modern web projects.
    *   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
    *   **Zustand**: A small, fast, and scalable bear-bones state-management solution.
    *   **Recharts**: A composable charting library built with React and D3.
    *   **Lucide React**: A collection of beautiful and customizable open-source icons.
*   **Backend**:
    *   **Supabase**: An open-source Firebase alternative providing:
        *   **PostgreSQL Database**: For storing all application data (users, transactions, fraud cases).
        *   **Supabase Auth**: For user authentication and management.
        *   **Supabase Edge Functions**: Serverless functions for backend logic (e.g., `process-transaction`, `create-fraud-case`, `notify-admin`).
        *   **Realtime**: For instant updates and notifications.
*   **Fraud Detection**:
    *   **TensorFlow.js**: A library for machine learning in JavaScript, used for the conceptual fraud detection model.
    *   **Deno**: Runtime for Supabase Edge Functions.
    *   **Resend**: For sending email notifications (e.g., admin alerts for disputes).

 
    ##   **User Interface Snapshots**
    <div>
  <img width="736" alt="FraudShield User Dashboard" src="https://github.com/user-attachments/assets/eb2f688b-f6f3-4738-bdc1-4202faf719c8" />
  <p><strong>FraudShield User Dashboard UI</strong></p>
</div>

<div>
<img width="751" alt="image" src="https://github.com/user-attachments/assets/79adb8ad-2652-4904-a254-0cd3768f1c52" />

  <p><strong>FraudShield Recent Transactions</strong></p>
</div>

<div>
  <img width="788" alt="Recent Transactions" src="https://github.com/user-attachments/assets/88cb2ca3-a104-4bff-bb37-e8e587cb49ee" />
  <p><strong>FraidShield Fraud Detection Warning UI</strong></p>
</div>




## ⚙️ Getting Started

Follow these steps to set up and run FraudShield locally on your machine.

### Prerequisites

*   Node.js (v18 or higher)
*   npm or Yarn
*   A Supabase project

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Oluwat-dev/FraudShild.git
    cd fraudshield
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Supabase**:
    *   Go to your Supabase project dashboard.
    *   Navigate to `Project Settings` -> `API`.
    *   Copy your `Project URL` and `anon public` key.
    *   Navigate to `Project Settings` -> `API Keys` and copy your `service_role` key.
    *   Navigate to `Database` -> `SQL Editor` and run the SQL migration files located in `supabase/migrations/` in chronological order. These migrations set up your tables, RLS policies, and database functions.
    *   Navigate to `Edge Functions` and deploy the functions located in `supabase/functions/`. You will need to set up environment variables for these functions:
        *   `SUPABASE_URL` (your project URL)
        *   `SUPABASE_SERVICE_ROLE_KEY` (your service role key)
        *   `RESEND_API_KEY` (your Resend API key for email notifications)

4.  **Configure Environment Variables**:
    Create a `.env` file in the root of your project and add your Supabase credentials:

    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
    ```

### Running the Application

To start the development server:

```bash
npm run dev
# or
yarn dev
```
The application will be accessible at http://localhost:5173.

# 🛡️ FraudShield

FraudShield is an intelligent fraud detection and prevention system powered by Supabase and machine learning. This repository outlines the core architecture, database schema, fraud detection logic, and deployment process.

---

## 📊 Database Schema

FraudShield's database is powered by **PostgreSQL** via **Supabase**. Key tables include:

- **`users`**: Stores user-specific data, including their balance.
- **`transactions`**: Records all financial transactions, including:
  - amount
  - merchant
  - category
  - risk score
  - fraud status
- **`fraud_cases`**: Manages reported fraud incidents, links them to specific transactions, and tracks resolution status.

The schema also includes:

- Custom **enums**:
  - `transaction_status`
  - `fraud_case_status`
- PostgreSQL **functions** for business logic and data integrity:
  - `transfer_money`
  - `validate_recipient_email`
  - `update_user_balance`
  - `handle_new_user`
  - `update_updated_at_column`

---

## 🧠 Fraud Detection Model

The core of FraudShield's intelligence lies in its conceptual fraud detection model.

- The current implementation (`src/lib/fraudModel.ts`) uses a simplified **TensorFlow.js** model for demonstration.
- The **`process-transaction`** Supabase Edge Function is responsible for:
  - Receiving transaction data.
  - Calculating a `risk_score` based on amount, category, location, device info, etc.
  - Determining if a transaction is `is_fraudulent`.
  - Inserting the transaction into the `transactions` table.
  - Updating sender and recipient balances (for P2P transfers).

---

## 🚀 Deployment

FraudShield can be easily deployed:

- **Frontend**: Deploy the React app to static hosting platforms like **Netlify** or **Vercel**. 🔗 You can access the application [here](https://jade-faun-7da1f3.netlify.app/)

- **Backend**: The **Supabase** project handles:
  - Database
  - Authentication
  - Edge Functions (automatically deployed when pushed)

---

## 🤝 Contributing

Contributions are welcome!  
Feel free to open an **issue** or submit a **pull request** if you have ideas for improvements or new features.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

