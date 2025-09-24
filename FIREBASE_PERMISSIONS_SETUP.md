# Firebase IAM Permissions Setup Guide

## Problem
The deployment is failing with a 403 permission error because the service account lacks access to the Firebase Extensions API:
```
Error: Request to https://firebaseextensions.googleapis.com/v1beta/projects/saintfestcode/instances?pageSize=100&pageToken= had HTTP Error: 403, The caller does not have permission
```

## First: Identify Your Service Account

Before adding roles, you need to identify which service account is being used in your GitHub Actions workflow.

### Method 1: Check GitHub Secret Content
1. Go to your GitHub repository: `https://github.com/your-username/saintfest`
2. Navigate to Settings > Secrets and variables > Actions
3. Look at the `FIREBASE_SERVICE_ACCOUNT_SAINTFESTCODE` secret
4. The secret contains JSON - look for the `client_email` field to identify the service account

### Method 2: Check Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `saintfestcode`
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Look for service accounts that might be used for deployment, typically:
   - `firebase-adminsdk-*@saintfestcode.iam.gserviceaccount.com`
   - `saintfestcode@appspot.gserviceaccount.com`
   - Any custom service account you may have created

## Solution: Add Required IAM Roles

### Required IAM Roles for the Service Account

The service account used in GitHub Actions (`FIREBASE_SERVICE_ACCOUNT_SAINTFESTCODE`) needs these roles:

1. **`roles/firebase.admin`** (Firebase Admin)
   - Provides full access to Firebase services
   - Required for general Firebase operations

2. **`roles/cloudfunctions.admin`** (Cloud Functions Admin)
   - Required for deploying and managing Firebase Functions v2
   - Provides full access to Cloud Functions

3. **`roles/firebaseextensions.admin`** (Firebase Extensions Admin)
   - **This is the missing role causing the 403 error**
   - Required to read/list Firebase Extensions during deployment
   - Firebase CLI checks for extensions before deploying functions

### Step-by-Step Instructions

#### Option A: Using Google Cloud Console (Recommended)

1. **Navigate to IAM & Admin**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select project: `saintfestcode`
   - Navigate to "IAM & Admin" > "IAM"

2. **Find the Service Account**
   - First, you need to identify which service account is stored in the `FIREBASE_SERVICE_ACCOUNT_SAINTFESTCODE` GitHub secret
   - In GitHub, go to your repository > Settings > Secrets and variables > Actions
   - The secret contains a JSON service account key - you need to identify the `client_email` field from that JSON
   - Alternatively, look in Google Cloud Console > IAM & Admin > Service Accounts to see existing accounts
   - It might be named something like:
     - `firebase-adminsdk-xxxxx@saintfestcode.iam.gserviceaccount.com` (Firebase Admin SDK default)
     - `saintfestcode@appspot.gserviceaccount.com` (App Engine default)
     - Or any custom service account you created

3. **Edit IAM Roles**
   - Click the pencil icon (Edit) next to the service account
   - Click "ADD ANOTHER ROLE" for each missing role:
     - Add: `Firebase Admin`
     - Add: `Cloud Functions Admin`
     - Add: `Firebase Extensions Admin`
   - Click "SAVE"

#### Option B: Using gcloud CLI

```bash
# Set your project
gcloud config set project saintfestcode

# First, find your existing service accounts
gcloud iam service-accounts list

# Identify the service account email from the list above or from your GitHub secret
# Replace with the actual email from your FIREBASE_SERVICE_ACCOUNT_SAINTFESTCODE secret
SERVICE_ACCOUNT_EMAIL="your-actual-service-account@saintfestcode.iam.gserviceaccount.com"

# Add the required roles
gcloud projects add-iam-policy-binding saintfestcode \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding saintfestcode \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding saintfestcode \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/firebaseextensions.admin"
```

### Verification

After adding the roles, verify they were applied correctly:

```bash
# List all IAM bindings for your project
gcloud projects get-iam-policy saintfestcode

# Or check specific service account
gcloud projects get-iam-policy saintfestcode \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:${SERVICE_ACCOUNT_EMAIL}"
```

### Testing the Fix

1. **Trigger a new deployment** by pushing to the main branch
2. **Monitor the GitHub Actions logs** for the permission verification output
3. **Check for successful deployment** without 403 errors

### Expected Results

After adding these roles, the deployment should:
- ✅ Successfully access Firebase Extensions API
- ✅ Deploy Firebase Functions v2 without permission errors
- ✅ Complete the full CI/CD pipeline

### Security Notes

- These are the minimum required permissions for Firebase Functions v2 deployment
- The `Firebase Extensions Admin` role is specifically needed because Firebase CLI checks for extensions during deployment
- All roles are scoped to the project level only

### Troubleshooting

If you still get permission errors after adding roles:
1. Wait 5-10 minutes for IAM changes to propagate
2. Verify the service account email matches exactly
3. Check that all three roles are listed in the IAM console
4. Try a fresh deployment to trigger the permission check

If you don't have a service account set up:
1. In Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "CREATE SERVICE ACCOUNT"
3. Name it something like "github-actions-deploy"
4. Add the three required roles during creation
5. Download the JSON key file
6. Copy the JSON content to your GitHub secret `FIREBASE_SERVICE_ACCOUNT_SAINTFESTCODE`