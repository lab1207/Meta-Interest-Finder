<div align="center">

# 🚀 Meta Interest Finder

### Search Meta (Facebook) Advertising Interests with a Fast, Secure & MCP-Compatible API

<p align="center">

<img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express" />
<img src="https://img.shields.io/badge/Vercel-Ready-000000?style=for-the-badge&logo=vercel" />
<img src="https://img.shields.io/badge/Claude-MCP-7C3AED?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />

</p>

<p align="center">

A lightweight serverless backend that securely searches Meta (Facebook) advertising interests using the Meta Graph API, with native Claude MCP support.

</p>

</div>

---

# 📖 Overview

Meta Interest Finder is a lightweight backend service built for developers, marketers, AI applications, and automation tools that need to search Meta advertising interests securely.

Instead of exposing your Meta Access Token inside frontend applications, Meta Interest Finder keeps all communication with the Meta Graph API on the server.

The project is optimized for **Vercel Serverless Functions**, making deployment fast, simple, and scalable.

It also includes **native Model Context Protocol (MCP)** support, allowing Claude Desktop and other MCP-compatible AI assistants to search Meta advertising interests directly during conversations.

---

# ✨ Why Meta Interest Finder?

Searching Meta advertising interests isn't as straightforward as making a single API request from the browser.

Developers often run into problems like:

- Exposing Meta Access Tokens
- CORS restrictions
- Complex Graph API requests
- Difficult deployment
- Repetitive backend setup

Meta Interest Finder solves these problems by providing a production-ready backend that can be deployed in minutes.

---

# 🚀 Features

## 🔍 Search Advertising Interests

Search thousands of Meta advertising interests directly through a simple REST API.

---

## 🔐 Secure Token Storage

Your Meta Access Token never leaves your backend.

Unlike frontend implementations, sensitive credentials remain protected using server-side environment variables.

---

## ⚡ Serverless

Optimized for Vercel Serverless Functions.

No infrastructure management.

No VPS required.

Deploy in minutes.

---

## 🤖 Claude MCP Compatible

Connect directly to Claude Desktop using the Model Context Protocol (MCP).

Claude can search Meta advertising interests during conversations without exposing your Meta credentials.

---

## 🌍 REST API

Simple JSON API that can be integrated into:

- SaaS products
- Internal tools
- Marketing platforms
- AI agents
- Browser extensions
- Desktop applications

---

## 📦 Lightweight

Built using a minimal Express.js backend with very few dependencies.

Simple architecture.

Easy to extend.

---

## 🚀 Fast

Designed for low-latency interest searching while minimizing unnecessary processing.

---

# 🖼 Architecture

```text
                 Search Request
                        │
                        ▼
         ┌─────────────────────────┐
         │  Meta Interest Finder   │
         │      Express API        │
         └─────────────────────────┘
                        │
                        ▼
              Meta Graph API
                        │
                        ▼
             Interest Search Results
                        │
                        ▼
                JSON Response
```

---

# 🤖 Claude MCP Support

One of the most powerful features of this project is native support for the **Model Context Protocol (MCP)**.

This allows Claude Desktop to communicate directly with Meta Interest Finder as an external tool.

Instead of manually opening Meta Ads Manager to search interests, Claude can perform the search on your behalf and return structured results inside your conversation.

Example workflow:

```text
User
   │
   ▼
Claude Desktop
   │
   ▼
Meta Interest Finder (MCP)
   │
   ▼
Meta Graph API
   │
   ▼
JSON Results
   │
   ▼
Claude Response
```

---

# 💼 Use Cases

Meta Interest Finder can be integrated into a wide variety of applications.

### 📈 Marketing Platforms

Build audience research tools powered by Meta interest search.

---

### 🤖 AI Assistants

Allow AI agents to discover advertising interests dynamically using MCP.

---

### 📊 Internal Dashboards

Create internal marketing dashboards without exposing API credentials.

---

### 🧩 SaaS Products

Add Meta interest search functionality directly into your own software.

---

### 🔬 Audience Research

Discover related interests while planning Meta advertising campaigns.

---

# 🌟 Highlights

- 🔍 Search Meta advertising interests
- 🔒 Secure backend architecture
- ⚡ Vercel optimized
- 🤖 Claude MCP support
- 🌍 REST API
- 📦 Lightweight Express server
- 🚀 Fast deployment
- 🔐 Environment variable support
- 📈 Marketing tool ready
- 🧩 Easy integration

---

# ⚡ Quick Start

Deploy Meta Interest Finder in under **5 minutes**.

```bash
git clone https://github.com/lab1207/meta-interest-finder.git

cd meta-interest-finder

npm install
```

Create your environment variable:

```env
META_TOKEN=YOUR_META_GRAPH_ACCESS_TOKEN
```

Start the development server:

```bash
npm start
```

The API is now ready to accept requests.

---

# 💻 Local Development

## Requirements

Before running the project, ensure you have:
- 18+
- Node.js 
- npm
- A Meta Developer Account
- A valid Meta Graph API Access Token

---

## Installation

Clone the repository.

```bash
git clone https://github.com/lab1207/meta-interest-finder.git
```

Move into the project.

```bash
cd meta-interest-finder
```

Install dependencies.

```bash
npm install
```

Create an environment file.

```env
META_TOKEN=YOUR_META_TOKEN
```

Start the server.

```bash
npm start
```

---

# ☁️ Deploy to Vercel

Meta Interest Finder is optimized for **Vercel Serverless Functions**.

Deployment only takes a few minutes.

---

## Step 1 — Import Repository

Login to Vercel.

Click

```
New Project
```

Select

```
meta-interest-finder
```

Leave the Framework Preset as:

```
Other
```

Click

```
Deploy
```

---

## Step 2 — Configure Environment Variables

Navigate to

```
Project

↓

Settings

↓

Environment Variables
```

Create

| Variable | Value |
|-----------|-------|
| META_TOKEN | Your Meta Graph API Token |

Save the configuration.

Redeploy the project.

---

## Step 3 — Verify Deployment

Open your deployed URL.

Example

```http
GET

https://your-project.vercel.app/api/interests?q=fitness
```

If everything is configured correctly, the API will return matching Meta advertising interests.

---

# 🔐 Environment Variables

The project uses environment variables to securely communicate with the Meta Graph API.

## Required Variables

| Variable | Required | Description |
|-----------|----------|-------------|
| META_TOKEN | ✅ | Meta Graph API Access Token |

Never expose this token inside frontend applications.

Always keep it on the server.

---

# 🔑 Required Meta Permissions

Your Meta Access Token should include the following permissions.

| Permission | Purpose |
|------------|---------|
| ads_read | Access advertising interest search |
| business_management | Access Business Manager resources |
| read_insights | Retrieve audience information |
| pages_show_list | Access associated Pages |

These permissions represent the minimum recommended configuration.

---

# 📡 REST API

Meta Interest Finder exposes a lightweight REST API.

---

## Search Interests

```http
GET /api/interests
```

---

### Parameters

| Name | Required | Description |
|------|----------|-------------|
| q | ✅ | Search keyword |
| limit | ❌ | Maximum number of results |

---

### Example Request

```http
GET /api/interests?q=fitness
```

---

### Example Request

```http
GET /api/interests?q=crypto&limit=25
```

---

### Successful Response

```json
{
  "success": true,
  "results": [
    {
      "id": "6003139266461",
      "name": "Fitness",
      "audience_size_min": 1000000,
      "audience_size_max": 3500000
    }
  ]
}
```

---

### Error Response

```json
{
    "success": false,
    "error": "Invalid Meta Access Token"
}
```

---

# 🤖 Claude MCP

Meta Interest Finder includes native support for the **Model Context Protocol (MCP)**.

This allows Claude Desktop to access Meta advertising interest search directly through your backend.

Supported endpoints:

```http
GET /mcp

POST /mcp
```

Available Tool

```
search_facebook_interests
```

Example conversation

```
User

↓

Find interests related to coffee shops.

↓

Claude

↓

Calls Meta Interest Finder

↓

Meta Graph API

↓

Returns matching interests

↓

Claude formats the results.
```

No API keys are exposed to Claude.

Everything remains securely hosted on your own server.

---

# 📦 Example Integrations

Meta Interest Finder works well with:

- Claude Desktop (MCP)
- Custom AI Agents
- SaaS Platforms
- Internal Marketing Tools
- Browser Extensions
- Desktop Applications
- Marketing Dashboards
- Audience Research Platforms

---

# 🔒 Security

Meta Interest Finder follows a backend-first architecture.

```
Frontend

↓

Meta Interest Finder

↓

Meta Graph API
```

This approach ensures:

- API credentials remain private.
- Frontend applications never receive sensitive tokens.
- Easy key rotation.
- Better security.
- Cleaner architecture.

---

# 📂 Project Structure

The project is intentionally lightweight and easy to understand.

```text
meta-interest-finder
│
├── server.js
│   Main Express server
│   REST API
│   MCP Server
│   Meta Graph API integration
│
├── index.html
│   Simple browser testing interface
│
├── package.json
│   Project metadata and dependencies
│
├── vercel.json
│   Vercel routing and deployment configuration
│
└── README.md
```

---

# 🏗 Architecture

The application follows a simple backend-first architecture.

```text
                Client Application
                        │
                        ▼
          Meta Interest Finder API
                        │
          Authentication & Validation
                        │
                        ▼
               Meta Graph API
                        │
                        ▼
                JSON Response
```

This architecture ensures that your Meta Access Token is never exposed to frontend applications.

---

# ⚡ Performance

Meta Interest Finder was designed with simplicity and speed in mind.

### Current Characteristics

- ⚡ Lightweight Express server
- 🚀 Serverless deployment
- 📦 Minimal dependencies
- 🔒 Secure environment variables
- 🌍 REST API
- 🤖 MCP compatible
- ☁️ Vercel optimized

---

# 💡 Example Use Cases

## 📊 Audience Research

Build tools that discover related Meta advertising interests.

---

## 🤖 AI Marketing Assistants

Allow Claude or other AI assistants to search advertising interests using MCP.

---

## 📈 Marketing Platforms

Integrate interest search directly into your SaaS.

---

## 🧩 Browser Extensions

Power browser extensions without exposing Meta credentials.

---

## 📱 Internal Business Tools

Give marketing teams secure access to advertising interests.

---

## ❓ Frequently Asked Questions

### Does this project expose my Meta Access Token?

No.

The token remains securely stored on the backend using environment variables.

---

### Does it support Claude Desktop?

Yes.

The project includes native support for the **Model Context Protocol (MCP)**.

---

### Can I deploy this somewhere other than Vercel?

Yes.

Although optimized for Vercel, the project can run on any Node.js-compatible hosting platform.

---

### Can I use this in commercial projects?

Yes.

Please review the included license before using the project commercially.

---

# 🛣 Roadmap

The following improvements are planned for future releases.

## v1.1

- [ ] Better API validation
- [ ] Improved error handling
- [ ] Response caching
- [ ] Better logging

---

## v1.2

- [ ] Docker support
- [ ] OpenAPI documentation
- [ ] SDK
- [ ] CLI

---

## v1.3

- [ ] Authentication
- [ ] Rate limiting
- [ ] Analytics
- [ ] Health endpoint

---

## Future

- [ ] Interest Explorer
- [ ] Audience Insights
- [ ] Related Interest Discovery
- [ ] Web Dashboard
- [ ] React SDK
- [ ] Python SDK
- [ ] Official NPM Package

---

# 🤝 Contributing

Contributions are welcome!

Whether you're fixing bugs, improving documentation, or adding new features, your help is appreciated.

## Getting Started

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

# 🐛 Reporting Issues

If you encounter a bug or have a feature request, please open a GitHub Issue.

When reporting issues, include:

- Operating System
- Node.js Version
- Deployment Platform
- Steps to Reproduce
- Expected Behavior
- Actual Behavior

---

# 📜 License

This project is released under the **MIT License**.

You are free to:

- Use
- Modify
- Distribute
- Commercially use

the software under the terms of the MIT License.

---

# ❤️ Acknowledgements

Special thanks to:

- Meta Graph API
- Vercel
- Express.js
- Node.js
- Anthropic MCP

for making projects like this possible.

---

# 🌟 Support

If this project helped you, consider giving it a ⭐ on GitHub.

It helps others discover the project and supports future development.

---

<div align="center">

## ⭐ Star this repository if you found it useful!

Built with ❤️ by **Vaibhav Hajare**

**Happy Building! 🚀**

</div>
