# AI-Powered Marketplace Listing Generator

This is a sophisticated web application designed to help e-commerce sellers, marketplace enthusiasts, and individuals quickly generate high-quality product listings. By leveraging the power of the Google Gemini API, this tool analyzes product images and user notes to create multiple, compelling listing variations complete with titles, descriptions, categories, and market-researched price suggestions.

## Key Features

-   **AI-Powered Content Generation**: Upload up to four images and add optional notes about your product. The AI analyzes the inputs to create professional and engaging listing content.
-   **Multiple Listing Variations**: Instead of just one output, the app generates three distinct variations, each with a different sales strategy:
    -   **Professional & High-Value**: A premium, detailed listing targeting quality-focused buyers.
    -   **Casual & Quick-Sale**: A friendly, concise listing designed for a fast sale.
    -   **Benefit-Focused & Urgent**: A persuasive listing that creates a sense of urgency.
-   **Data-Driven Price Suggestions**: Each variation comes with three price points ('Quick Sale', 'Market Value', 'Premium'), allowing you to align your pricing with your sales goals.
-   **Transparent Market Analysis**: The AI provides a **Pricing Rationale** for its suggestions and is required to **cite its sources** with direct links to comparable sold items on marketplaces like eBay, giving you full transparency and confidence in the data.
-   **Interactive Selection**: Review all variations, their pricing rationales, and cited sources in a clean modal. Select your preferred price for each and add one or more variations to your history.
-   **Persistent Listing History**: All chosen listings are saved locally. You can search, sort, and filter your history to easily manage your content.
-   **Platform-Specific Content (Optional)**: If you configure API keys for eBay or X (Twitter), the AI will also generate optimized content specifically for those platforms.
-   **Multiple Export Formats**: Export your entire listing history to CSV, XLS, PDF, or SQL for record-keeping, analysis, or integration with other systems. Exports include all detailed pricing data and cited sources.
-   **Secure API Key Management**: All API keys (Gemini, eBay, Twitter) are managed securely within the app's settings and stored only in your browser's local storage.

## How to Use

1.  **Configure API Keys**:
    -   Click the **Settings** (gear) icon in the top-right corner.
    -   Enter your **Google Gemini API Key**. This is required for the app to function.
    -   Optionally, add API keys for eBay and X (Twitter) to enable platform-specific content generation.
    -   Click "Save & Close". Your keys are saved securely in your browser.

2.  **Add a New Product**:
    -   In the "Add a New Product" panel, drag and drop up to four product images or click to upload them.
    -   Add any relevant details in the "Optional Notes" field (e.g., condition, flaws, included accessories).

3.  **Generate Listings**:
    -   Click the **"Generate Listing Variations"** button.
    -   The AI will process your input and open the "Choose Your Listing" modal.

4.  **Select Your Variation(s)**:
    -   Review the three generated variations. Examine the titles, descriptions, and the AI's **Pricing Rationale** and **Cited Sources**.
    -   For each variation you like, **click on a price point** (Quick Sale, Market Value, or Premium) to select it.
    -   Once a price is selected, the "Add to History" button becomes active. Click it to save that listing. You can add multiple variations.

5.  **Manage Your History**:
    -   Your saved listings will appear in the "Listing History" panel.
    -   Use the search bar and filters to find specific listings.
    -   Click on any listing to expand it and view its full details, including the platform-specific content and cited sources.
    -   Use the **Export** button to download your data in your preferred format.

## Technology Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **AI**: Google Gemini API (`gemini-2.5-flash`)
-   **Libraries**:
    -   `jspdf` & `jspdf-autotable` for PDF exports.
    -   No backend required; the application runs entirely in the browser.
