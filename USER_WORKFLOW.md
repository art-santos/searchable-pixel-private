# User Workflow: Core Traffic Monitoring

This document outlines the core user workflow for the traffic monitoring functionality of the application.

## 1. Onboarding: Registration and Login

*   A new user visits the platform and signs up for an account.
*   Existing users can log in with their credentials.
*   This process is handled by the **Authentication** functionality, using Supabase for backend services.

## 2. Workspace and API Key Generation

*   Upon first login or through a clear UI prompt, a **Workspace** is automatically created for the user.
*   A unique **API Key** is generated and associated with this workspace.
*   The user is directed to a dashboard where they can view their workspace ID and the API key.

## 3. Getting the Tracking Script

*   On the dashboard, the user is presented with a JavaScript **tracking script**.
*   This script is pre-configured with the user's unique **workspace ID**.
*   Clear instructions are provided for the user to copy this script and paste it into the `<head>` section of their website's HTML.

## 4. Verifying Script Installation

*   The application provides a mechanism to check if the tracking script has been correctly installed on the user's website.
*   This could be a "Verify Installation" button that triggers a backend service to check for the presence of the script on the user's registered domain.
*   The user receives clear feedback on whether the installation was successful or if there are issues.

## 5. Monitoring Traffic

*   Once the script is installed and verified, it begins collecting data on crawler visits to the user's website.
*   This data is sent to the application's backend via the `/api/track/[workspaceId]/pixel.gif` endpoint.
*   The user can view the collected traffic data on their **Dashboard**.
*   The dashboard will display key metrics from the `crawler_visits` table, such as:
    *   Total visits
    *   Visits by crawler (e.g., Googlebot, Bingbot)
    *   Top crawled pages
    *   A timeline of crawler activity.
