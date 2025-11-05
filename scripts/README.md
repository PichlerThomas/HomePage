# Automated Page Reconstruction Script

CMM3-compliant script for automatically reconstructing web pages with all assets.

## Installation

```bash
cd scripts
npm install
```

## Usage

### Basic Usage

```bash
# Auto-detect mode (create or update)
node reconstruct-page.js --url https://ceruleancircle.com/ --target ../reconstructed

# Force create mode
node reconstruct-page.js --url https://ceruleancircle.com/ --target ../reconstructed --mode create

# Force update mode
node reconstruct-page.js --url https://ceruleancircle.com/ --target ../reconstructed --mode update
```

### Options

- `--url, -u <url>`: Original site URL (required)
- `--target, -t <dir>`: Target directory (default: ./reconstructed)
- `--mode, -m <mode>`: Mode: auto|create|update (default: auto)
- `--config, -c <file>`: Configuration file path
- `--help, -h`: Show help message

## Phases

1. **Asset Discovery**: Extracts all fonts, images, and CSS
2. **Asset Download**: Downloads assets locally
3. **CSS Comparison**: Compares CSS properties
4. **Font Verification**: Verifies fonts are loaded
5. **Fix Application**: Applies fixes automatically

## Update Mode

When running in update mode:
- Only new/modified assets are downloaded
- Existing assets are preserved with hash verification
- Backup is created before updates
- Rollback available if update fails

## Output Files

- `assets-inventory.json`: Complete asset inventory
- `assets-downloaded.json`: Download report
- `css-comparison-report.json`: CSS comparison results
- `font-verification-report.json`: Font loading verification
- `fix-application-report.json`: Applied fixes
- `reconstruction-results.json`: Complete reconstruction results

## Configuration

See `automated-reconstruction-plan.md` for configuration options.

