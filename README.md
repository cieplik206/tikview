# TikView React - Modern MikroTik Dashboard

A modern, responsive web dashboard for MikroTik routers built with React, TypeScript, and Tailwind CSS. This dashboard provides real-time monitoring and management capabilities through the MikroTik REST API.

![TikView Dashboard](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)



## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MikroTik router with REST API enabled
- Basic knowledge of MikroTik configuration

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tikview-react.git
cd tikview-react
```

2. **Install dependencies**
```bash
npm install
```

## 🏗️ Building for Production

```bash
npm run build
```
This creates optimized files in the `bundle/` directory that can be deployed to any web server.

### Files created:
- `bundle/index2.html` - MikroTik-specific HTML file
- `bundle/assets/index.js` - JavaScript bundle
- `bundle/assets/index.css` - CSS bundle

## 📦 Creating a MikroTik DPK Package

DPK (Device Package) allows you to install the dashboard directly on MikroTik routers as custom branding. This replaces the default WebFig interface with TikView React.

### Step 1: Build the Application

```bash
# Install dependencies
npm install

# Build the production bundle
npm run build
```

Verify these files exist after building:
- `bundle/index2.html`
- `bundle/assets/index.js`
- `bundle/assets/index.css`

### Step 2: Create MikroTik Branding Package



1. **Access MikroTik Branding Portal**
   - Log in to https://mikrotik.com/client/branding (Create an account or login)
   - Click "Create New Branding Package"

2. **Configure Basic Settings**
   - **Router Name**: `TikViewReactDashboard` (letters and numbers only, no spaces)
   - **Company URL**: `http://router.local` (or your preferred URL)
   - **Manual URL**: `http://router.local/help` (optional)

3. **Upload Dashboard Files**
   
   The portal will ask for three specific files:
   
   - **HTML File**: Upload `bundle/index2.html` as `index2.html`
   - **CSS File**: Upload `bundle/assets/index.css` as `index.css`
   - **JavaScript File**: Upload `bundle/assets/index.js` as `index.js`


4. **Generate and Download DPK**
   - Click "Generate Package"
   - Choose your RouterOS version (v7.x recommended)
   - Download the `.dpk` file

### Step 3: Install DPK on Router

1. **Upload DPK to Router**
```bash
# Via SCP
scp TikViewReactDashboard.dpk admin@ROUTER_IP:/

# Or via FTP
ftp ROUTER_IP
> put TikViewReactDashboard.dpk

# Or via Winbox
Drag and drop file to Files
```



2. **Reboot Router**
```routeros
Package will be automatically installed on reboot
```




## 📡 API Security Best Practices

1. **Create dedicated API users** with minimal required permissions. Users need `read` and `rest-api` permissions to use this interface
2. **Use HTTPS** with valid SSL certificates in production
3. **Implement IP restrictions** for API access
4. **Regular credential rotation**
5. **Monitor API access logs**

## 🛠️ Troubleshooting

### DPK Installation Issues

**Package not installing:**
- Ensure RouterOS v7.x or higher
- Check available storage: `/system resource print`
- Verify file integrity after upload

**Dashboard not loading after install:**
- Clear browser cache
- Check if www-ssl service is enabled
- Verify branding is active: `/system branding print`

**Reverting to default WebFig:**
```routeros
# Option 1: Reset branding
/system branding reset
/system reboot

# Option 2: Complete reinstall via Netinstall
```



## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.


---

**Note**: This is an independent project and is not officially affiliated with MikroTik.