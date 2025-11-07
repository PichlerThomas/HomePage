# Creator Mode - Coordinate Grid System

## Overview
Creator Mode provides a visual coordinate grid overlay to enable precise communication about page elements. This eliminates ambiguity when discussing specific sections or elements.

## How to Use

### Enable/Disable Grid
- **Press 'G' key** to toggle the grid overlay
- **Click the 'G' button** in the bottom-right corner
- Grid cells are labeled with coordinates (A0, A1, B0, B1, etc.)

### Coordinate System
- **Columns**: A through L (12 columns)
- **Rows**: 0 through 19 (20 rows)
- **Cell Size**: 100px × 100px
- **Format**: `[Column][Row]` (e.g., `A2`, `B3`, `C5`)

### Referencing Elements

#### Single Cell
```
"A2" - The cell at column A, row 2
"B1" - The cell at column B, row 1
```

#### Area/Range
```
"A2-B3" - Area from A2 to B3 (rectangle)
"C0-D5" - Area from C0 to D5
```

#### Section Labels
Major sections have `data-coord` attributes:
- Navigation: `A0-B0`
- Hero Banner: `A1-E3`
- Highlights (Meta Structures): `A4-E6`
- About Section: `A7-E8`
- Transformations: `A9-E10`
- Methods: `A11-E14`
- Technology Stack: `A15-E18`

## Console API

```javascript
// Toggle grid
window.creatorMode.toggle()

// Enable grid
window.creatorMode.enable()

// Disable grid
window.creatorMode.disable()

// Check if enabled
window.creatorMode.isEnabled()

// Get element at coordinate
window.creatorMode.getElementAt('A2')
```

## Example Usage

**User Feedback:**
> "The heading in A4-B4 (Meta Structures) has wrong font and size"

**Developer Response:**
> "Fixing font and size for heading in A4-B4 section"

This creates a clear, unambiguous reference system for both visual and programmatic identification.

## Visual Features

- **Grid Overlay**: Semi-transparent blue grid lines
- **Cell Labels**: Each cell shows its coordinate (A0, A1, etc.)
- **Toggle Button**: Blue circular button with 'G' in bottom-right
- **Active State**: Button turns green when grid is enabled

## Integration

The grid system:
- ✅ Works on any page that includes `creator-mode.js`
- ✅ Non-intrusive (pointer-events: none)
- ✅ High z-index (999999) to appear above all content
- ✅ Can be toggled on/off without page reload
- ✅ Major sections automatically labeled with coordinates


