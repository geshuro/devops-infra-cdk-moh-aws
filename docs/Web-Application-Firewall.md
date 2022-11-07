# Getting Access to the Web UI

- [1. General steps](#1-general-steps)
- [2. Public hosting](#2-public-hosting)

When you access the Web UI for the first time after a fresh deployment, you will be greeted with a message similar to:

```
Access from your IP is blocked. Please refer to the documentation.
```

## 1. General steps

These steps need to be taken regardless of your deployment configuration. To gain access to the web UI from your IP address, follow these steps:

- Find out your IP address(es).
  - You can use websites like www.whatismyip.com.
  - For internal Amazon use, there are tools and IP lists that can be referred to.
- Find the relevant **IP set**
  - In the AWS Console, go to **"WAF & Shield"**
  - Navigate to **"IP sets"**, make sure to set the filter to the relevant region.
  - Click on the relevant **IP Set**. The name will start with `IPSet-` and contain the stage name and solution name that you have configured in your stage file.
- Click **"Add IP address"** and add all CIDRs that you need to enable.
- The changes take effect immediately, there is no need to re-deploy the solution.

## 2. Public hosting

These **additional** steps need to be taken when you are deploying in **Public Hosting** mode.

Public hosting uses two Web Applicaftion Firewalls (WAF), one for the CloudFront distribution and another for the API Gateway. In addition to the steps above, you need to

- In the AWS Console, go to **"WAF & Shield"**
- Navigate to **"IP sets"**, set the filter to **"Global (CloudFront)"**
- Find and update the relevant IP set in the same way as in "General Steps"

Note: Currently, the solution only supports IPv4 addresses.
