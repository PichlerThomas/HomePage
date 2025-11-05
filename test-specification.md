# Homepage Recreation Test Specification

## Test-First Approach (CMM3 Methodology)

This document defines test parameters for verifying the recreation of https://ceruleancircle.com/

## Test Parameters

### TC1: Navigation Structure
**Test:** Verify navigation menu contains exactly 5 items
**Expected:**
- About (#about)
- Methods (#method)
- Technology (#technology)
- Experience (#experience)
- Contact (contact.html)

### TC2: Hero Section
**Test:** Verify hero section contains:
- Logo image (Cerulean Logo)
- H2 heading: "Enabling Prosperous Futures."
- Paragraph: "We develop some of the most scalable & truly sustainable digital infrastructure initiatives on the planet. We are the Cerulean Circle."
- YouTube video embed (iframe)
- Technology description paragraph
- Legal disclaimer text (asterisk note about block images)

### TC3: Three Column Highlights
**Test:** Verify three-column section with:
- Column 1: "Meta Structures" (H4) + description + logo
- Column 2: "Real Metaverses" (H4) + description + logo
- Column 3: "INTRALOGISTICS" (H4) + description + logo

### TC4: About Section
**Test:** Verify about section contains:
- Logo image
- Paragraph explaining Cerulean Circle etymology (Latin word caeruleus)

### TC5: Transformations Section
**Test:** Verify section contains:
- H2 heading: "Transformations Abound"
- Paragraph: "Digital transformation means making reality more purposeful, more imaginative & therefore more valuable than it was before."
- Text: "It's a beautiful world."
- Background image

### TC6: Methods Section
**Test:** Verify "Our Methods" section contains:
- H2 heading: "Our Methods"
- Three method cards:
  1. "better business" + "Systemic Business Design" + image + description
  2. "better environments" + "Smart Ecologies" + image + description
  3. "better economies" + "Economic Metamodeling" + image + description
- "Learn More" link (contact.html)

### TC7: Technology Stack Section
**Test:** Verify "Our Technology Stack" section contains:
- H2 heading: "Our Technology Stack"
- Woda Component description + image + "We Provide: Web:Next"
- Woda Stack description + image + paragraph about capabilities
- Woda m2m description + image
- "REQUEST A DEMO" link (contact.html)
- YouTube video embed (iframe)
- C² Sound Currency section with:
  - 2cu logo/image
  - Three paragraphs about C² Sound Currency
  - Link to https://soundcurrency.tech/

### TC8: Our Story Section
**Test:** Verify "Our Story" section contains:
- H2 heading: "Our Story"
- Five paragraphs describing company history and mission

### TC9: Managing Partners Section
**Test:** Verify "The Managing Partners" section contains:
- H2 heading: "The Managing Partners"
- Two partner profiles:
  1. Gunther Sonnenfeld:
     - Image
     - Name + "Sustainable Economics"
     - Role description
     - 6 bullet points of achievements
  2. Marcel Donges:
     - Image
     - Name + "Logistics Optimization"
     - Role description
     - 6 bullet points of achievements

### TC10: Experience Section
**Test:** Verify "Our Experience" section contains:
- H2 heading: "Our Experience"
- List of 12 projects:
  1. Project Theseus: Internet of Services
  2. Project Rapid SOA: Deutsche Post revival
  3. Logistics Merger: Deutsche Post & DHL
  4. Smart City Launch: Stuttgart, Germany
  5. Project Imaginea: Clean Energy Incubator
  6. Smart Ecologies Prep: Magic City, Miami
  7. Logistics Grid: Alliance Digital Wareflow
  8. Metamodel: MOF Common Warehouse
  9. Metaverse: Rhein Ruhr Metropole
  10. Logistics Cluster: 100 intralogistics centers
  11. Efficiency Cluster: 120 Fraunhofer Partners
  12. Total Eclipse: Largest Synchronized Software release ever
- "REQUEST CASE STUDIES" link (contact.html)

### TC11: Books Section
**Test:** Verify "A Few Books That Inspire Us" section contains:
- H2 heading: "A Few Books That Inspire Us"
- Grid of 12 book cover images:
  1. Surviving The Future
  2. Lean Logic
  3. Vaclav Smil
  4. Energy Transitions
  5. Perilous Bounty
  6. Abiogenesis
  7. Pekka Hamalainen
  8. Primal Leadership
  9. A voice in the Wilderness
  10. Daniele Ganser
  11. in search of wisdom
  12. Cryptography

### TC12: Contact Section
**Test:** Verify contact section contains:
- H2 heading: "We'd love to hear from you."
- Paragraph: "The opportunities are endless when we are in service to people & planet."
- Three links: Developers, Partners, Investors (all to contact.html)
- Evolution image
- Cerulean logo link
- "contact" link (contact.html)

### TC13: Footer
**Test:** Verify footer contains:
- Text: "Powered by Cerulean | © 2022 Cerulean"

### TC14: Page Title
**Test:** Verify page title is "Cerulean Circle"

### TC15: Visual Layout
**Test:** Verify visual layout matches original:
- Navigation bar at top
- Sections flow vertically
- Images are properly sized and positioned
- Typography matches original
- Color scheme matches original

## Content Block Definitions

### Block 1: Navigation
- Type: Horizontal navigation bar
- Location: Top of page
- Items: 5 links

### Block 2: Hero Section
- Type: Main landing area
- Contains: Logo, heading, description, video, tech description

### Block 3: Three Highlights
- Type: Three-column grid
- Contains: Meta Structures, Real Metaverses, INTRALOGISTICS

### Block 4: About
- Type: Single column with logo
- Contains: Etymology explanation

### Block 5: Transformations
- Type: Full-width section with image
- Contains: Heading, description, tagline

### Block 6: Methods
- Type: Section with three cards
- Contains: Three method descriptions with images

### Block 7: Technology Stack
- Type: Multi-part section
- Contains: Component descriptions, images, video, C² currency info

### Block 8: Story
- Type: Text section
- Contains: Company history paragraphs

### Block 9: Partners
- Type: Two-column layout
- Contains: Two partner profiles with images and achievements

### Block 10: Experience
- Type: List section
- Contains: 12 project items

### Block 11: Books
- Type: Grid layout
- Contains: 12 book cover images

### Block 12: Contact
- Type: Call-to-action section
- Contains: Heading, description, links, images

### Block 13: Footer
- Type: Footer bar
- Contains: Copyright notice

## Verification Checklist

After recreation, verify:
- [ ] All 15 test cases pass
- [ ] All 13 content blocks present
- [ ] Navigation links work (anchor links scroll correctly)
- [ ] Images load correctly
- [ ] YouTube embeds work
- [ ] External links work (soundcurrency.tech, contact.html)
- [ ] Page is responsive (mobile-friendly)
- [ ] Visual design matches original
- [ ] Page title correct
- [ ] Footer present

