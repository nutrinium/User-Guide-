# Dynamic User Guide Management System

A modern, fully dynamic web application for creating, editing, organizing, and publishing user guides for any ERP module — without writing code.

## Features

- **Dynamic Module Management** — Create modules (Inventory, HRMS, CRM, Payroll, etc.) from the UI
- **Guide Builder** — Multi-section guides with drag-to-reorder sections
- **Publish Workflow** — Draft and publish guides with one click
- **Guide Viewer** — Browse published guides filtered by module
- **Dashboard** — Overview stats, quick actions, recent activity
- **Data Export/Import** — Backup and restore via JSON
- **ERP-style UI** — Left sidebar, top navigation, modern cards, responsive layout

## Tech Stack

- React 19 + Vite
- React Router
- Tailwind CSS 4
- Lucide Icons
- LocalStorage persistence

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. **Create Modules** — Go to Modules → Add New Module
2. **Create Guides** — Go to Guides → Create Guide, select a module, add sections
3. **Publish** — Click Publish when ready
4. **View** — Use the Viewer to browse published guides

## Build

```bash
npm run build
npm run preview
```
