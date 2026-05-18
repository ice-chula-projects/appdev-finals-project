
# Board of Mess

A lightweight, self-hostable message board application focused on simple and secure message exchange.

> Final Project for **2190512 Application Development**

---

## ✨ Features

- 🧵 Create and browse message threads
- 🔒 Optional password protection for threads
- 📎 Simple file attachment system
- 🐋 Self-hostable backend using Docker
- 📱 Multi-Platform frontend built with React Native + Expo
- ⚡ Simple setup and deployment

---

## 📖 Overview

**Board of Mess** is a simple message board platform where users can create and read text-based discussions. Messages are organized into threads, and each thread can optionally be protected with a password.

The backend can be self-hosted by anyone using Docker, making deployment quick and easy.

---

# 🚀 Getting Started

## 🔌 Backend Setup

### Prerequisites

Make sure the following are installed on your system:

- Docker
- Git

### Installation

1. Clone the backend into a folder

2. Open the backend folder in your terminal.

3. (Optional) Configure the application by editing:

* `settings.json`
* `.env`

4. Start the backend server:

```bash
docker-compose up -d
```

The backend service should now be running.

---

## Connecting the Frontend

Use the following URL as the API endpoint in the frontend app:

```text
http://[IP_ADDRESS]:[PORT]/
```

Example:

```text
http://192.168.1.10:5000/
```

### Allowing External Connections

If you want devices outside your local machine to connect to the backend, you will need to:

* Forward the selected port in your router settings
* Allow the port through your firewall (if applicable)

---

# 🖥️ Frontend Setup

## Prerequisites

Ensure the following are installed:

* Node.js
* npm

## Installation

1. Clone the frontend into a folder

2. Open the frontend folder in your terminal.

3. Install dependencies:

```bash
npm install
```

4. Start the Expo development server:

```bash
npm run
```

You can now launch the app using Expo or a development build.

> Optionally, you may also build and install the application directly on your device.

---

# 🛠 Tech Stack

## Backend

* 🍃 MongoDB — Database storage
* 🐍 Flask API — REST API backend
* 🐳 Docker — Containerized deployment

## Frontend

* ⚛️ React Native — Cross-platform mobile UI
* 🚀 Expo — Development and build tooling

---
