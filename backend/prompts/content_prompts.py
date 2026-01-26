def get_content_slide_prompt(page_title, content_str, slide_number, total_slides, instructions, styling, width, height):
    return f"""
You are a professional presentation designer. Create a single HTML slide based on the following content.

CONTENT TO PRESENT (USE EXACTLY AS GIVEN - DO NOT ADD OR MODIFY):
Title: {page_title}
Content:
{content_str}

This is slide {slide_number} of {total_slides} content slides.

CRITICAL DATA RULES - MOST IMPORTANT:
⚠️ DO NOT add any text, data, or content from your side
⚠️ Use ONLY the data provided in the Content section above
⚠️ If text is too big to fit: Remove jargons, filler words, and unnecessary text
⚠️ ALWAYS preserve: data points, numbers, statistics, key facts, important information
⚠️ DO NOT invent or add examples, explanations, or additional context

CRITICAL TITLE RULES - MANDATORY:
⚠️ MAXIMUM TITLE LENGTH: 60 characters - STRICTLY ENFORCE
⚠️ Create concise, meaningful title from {page_title}
⚠️ Remove filler words, abbreviate if needed, but keep core meaning
⚠️ Preserve key terms and data points in title
⚠️ Examples: "Revenue Growth Analysis" → "Revenue Growth", "Quarterly Financial Performance Overview" → "Q4 Financial Performance"

DESIGN PHILOSOPHY:
Create a clean, professional slide following consulting-style principles:
- Pyramid Principle: Present key message upfront (in title)
- MECE Framework: Information should be mutually exclusive, collectively exhaustive
- Data-Driven: Support claims with data and evidence
- Minimalist Design: Clean, uncluttered layout with consistent visual theme
- Logical Flow: Guide audience seamlessly through the argument

DESIGN INSTRUCTIONS:
{instructions}

STYLING CONFIGURATION:
- Primary Color: {styling.get('primary_color', '#004080')}
- Secondary Color: {styling.get('secondary_color', '#0066CC')}
- Accent Color: {styling.get('accent_color', '#FFA000')}
- Page Background Color: {styling.get('page_background_color', '#FFFFFF')}  ← SLIDE BACKGROUND
- Title Color: {styling.get('title_color', '#004080')}  ← TEXT COLOR ONLY, NOT BACKGROUND
- Body Text Color: {styling.get('body_color', '#333333')}
- Font Family: {styling.get('font_family', 'Arial')}  ← Professional sans-serif recommended
- Title Font Size: {styling.get('title_font_size', 24)}px
- Body Font Size: {styling.get('body_font_size', 11)}px

CRITICAL STYLING RULES:
⚠️ Title MUST be BOLD (font-weight:bold or font-weight:700)
⚠️ Title should be action-oriented when possible (state the conclusion/insight)
⚠️ Title color is for TEXT only - NEVER use title_color for background-color
⚠️ Slide background is ALWAYS page_background_color - title_color does NOT affect background
⚠️ Use limited color palette (2-3 colors maximum for consistency)
⚠️ Ensure strong contrast between text and background for readability

ADDITIONAL INSTRUCTIONS (if provided):
{styling.get('additional_prompt', '')}

CRITICAL TECHNICAL REQUIREMENTS - PREVENT CONTENT OVERLAP AND OVERFLOW:

1. CONTAINER (EXACT - DO NOT MODIFY):
   <div id="slide" style="width:{width}px; height:{height}px; position:relative; background-color:{styling.get('page_background_color', '#FFFFFF')}; overflow:hidden; font-family:{styling.get('font_family', 'Arial')}, sans-serif;">

2. POSITIONING RULES - ABSOLUTELY CRITICAL - FOLLOW EXACTLY:
   - EVERY element MUST have: position:absolute
   - EVERY element MUST specify: top, left, width, height in PIXELS (not %, not em, not auto)
   - USE box-sizing:border-box on elements with padding
   - ADD overflow:hidden to ALL text containers
   
3. SPACING CALCULATION - MANDATORY - NO EXCEPTIONS:
   - To place element B below element A:
     B.top = A.top + A.height + gap (MINIMUM 15px gap, RECOMMENDED 20px)
   - NEVER let any element go below top:670px (reserve 50px for footer)
   - NEVER let any element exceed: top + height > 670px
   - If content doesn't fit, REDUCE font-size or TRIM content - DO NOT overflow
   
4. OPTIMIZED LAYOUT ZONES - MAXIMIZE CONTENT SPACE:
   
   ⚠️ REDUCED MARGINS FOR MORE CONTENT:
   - Left margin: 40px (was 60px)
   - Right margin: 40px (was 60px)
   - Bottom margin: 20px (was 40px)
   - Available width: 1200px (was 1160px)
   - Content area height: 545px (was 535px)
   
   LAYOUT ZONES:
   - Action Title: top:25px, left:40px, width:1200px, height:45px, font-weight:bold, overflow:hidden, text-overflow:ellipsis, white-space:nowrap
     * Title MUST be ≤ 60 characters (abbreviate from {page_title} if needed)
     * Title should state the KEY MESSAGE or conclusion (not just a topic label)
   - Subtitle (optional): top:80px, left:40px, width:1200px, height:18px, overflow:hidden, font-size:{styling.get('body_font_size', 11) + 1}px
   - Content area: top:110px to top:675px (MAX 565px available height)
     * ⚠️ CRITICAL: No content element can have (top + height) > 675px
     * ⚠️ CRITICAL: Calculate total height before placing elements
   - Footer/Source: top:685px, left:40px, height:15px, font-size:9px
   - Page number: top:685px, left:1200px, height:15px, font-size:10px
   
5. CONTENT FITTING RULES - DYNAMIC DISTRIBUTION AND FLEXIBLE SIZING:
   
   ⚠️ ABSOLUTE RULE: NOTHING can overflow below top:675px - NO EXCEPTIONS!
   
   ⚠️ CRITICAL NEW RULE - DYNAMIC BOX SIZING:
   When content doesn't fit evenly across sections (columns/quadrants):
   - IDENTIFY which sections have excess white space
   - IDENTIFY which sections have overflowing content
   - RESIZE boxes dynamically: Take space from sections with white space and give it to overflowing sections
   - ADJUST heights, widths, and positions to balance content distribution
   - GOAL: Minimize white space while preventing overflow
   
   Example: If left column has 3 bullets (uses 100px, has 200px white space) and right column has 10 bullets (needs 350px, only has 300px):
   - Reduce left column height from 300px to 150px
   - Increase right column height from 300px to 450px
   - OR: Move 2-3 bullets from right to left to balance
   
   BEFORE placing ANY content, CALCULATE total height:
   1. Count all elements you need to add (bullets, tables, charts, etc.)
   2. Estimate height for each element
   3. Sum total height needed
   4. If total > 565px → MUST reduce content OR use multi-column/quadrant
   5. ⚠️ BALANCE content across columns - don't leave excessive white space
   
   ⚠️ If content is too long (FOLLOW THIS ORDER):
      1. Split into 2 or 4 columns FIRST (distribute content evenly)
      2. Dynamically resize columns based on content amount
      3. Remove jargons and filler words - preserve data/numbers
      4. Reduce font-size (minimum 9px for body text)
      5. Use smaller line-height (minimum 1.3)
   
   SINGLE COLUMN LAYOUT (when content is minimal):
   - Content: left:40px, width:1200px, top:110px, max-height:565px
   - Maximum 6-8 bullet points
   
   TWO COLUMN LAYOUT (when moderate content):
   ⚠️ ADJUST column heights dynamically based on content:
   - Left column: left:40px, width:580px, top:110px, height:FLEXIBLE (calculate based on content)
   - Right column: left:640px, width:600px, top:110px, height:FLEXIBLE (calculate based on content)
   - 20px gap between columns
   - If one column is short, REDUCE its height and use saved space for other content
   - Maximum 5-6 bullets per column (adjust based on distribution)
   
   FOUR QUADRANT LAYOUT (when lots of data fits better in sections):
   ⚠️ ADJUST quadrant heights dynamically:
   - Top-left: left:40px, top:110px, width:580px, height:FLEXIBLE (min:200px, max:400px)
   - Top-right: left:640px, top:110px, width:600px, height:FLEXIBLE (min:200px, max:400px)
   - Bottom-left: left:40px, top:(top-left.top + top-left.height + 15), width:580px, height:FLEXIBLE
   - Bottom-right: left:640px, top:(top-right.top + top-right.height + 15), width:600px, height:FLEXIBLE
   - Each quadrant: 3-5 bullets (adjust based on content amount)
   - Calculate heights: If top-left needs 250px and top-right needs 350px, bottom sections start at different tops
   - ⚠️ BALANCE: Don't make one quadrant tiny with white space while another overflows
   
   TABLES:
   - Maximum 8 rows (including header) - more space now available
   - Calculate row height: ~22px per row = ~176px total max
   - If table is tall, reduce row height or font-size (minimum 9px)
   - Dynamically size table height based on rows needed
   
   CHARTS/IMAGES/DIAGRAMS (CRITICAL SIZING RULES):
   ⚠️ DIAGRAM SIZE LIMITS:
   - Maximum diagram height: 350px (to leave room for title/context)
   - If diagram would need > 350px → CREATE SEPARATE PAGE FOR DIAGRAM ONLY
   - Calculate exact dimensions: width and height must fit within boundaries
   - Ensure: element_top + element_height + 15px < 675px
   - Never let diagrams push other content off the page
   
   WHEN TO SPLIT DIAGRAMS TO SEPARATE PAGE:
   1. If diagram needs > 350px height
   2. If diagram + existing content total > 565px
   3. If diagram would cause any overlap with other elements
   → Add note on current slide: "See [diagram name] in next slide"
   → Create next slide with ONLY the diagram (can use full 565px height)
   
   DIAGRAM SIZING BEST PRACTICES:
   - Keep diagrams compact and readable
   - Use appropriate font-size in diagrams (minimum 10px)
   - Don't make diagrams unnecessarily large "just to fill space"
   - Mermaid diagrams: Keep node count reasonable (< 10 nodes if possible)
   - Flowcharts: Limit depth to 4-5 levels maximum
   - If diagram is complex, simplify OR split to dedicated page
   
   ⚠️ CRITICAL - TALL ARTIFACTS RULE (VERY IMPORTANT):
   If you have a TALL artifact (chart, diagram, table, mermaid, code block) that:
   - Needs > 350px vertical space (LOWERED threshold for safety)
   - AND there's already other content on the page (bullets, text, etc.)
   - AND combining them would cause overflow (total > 565px)
   
   → DO NOT try to squeeze it in!
   → DO NOT make diagram smaller and unreadable!
   → INSTEAD: Create a SEPARATE slide dedicated to that artifact
   → Mention in current slide: "See detailed [chart/diagram/table] in next slide"
   → This preserves readability and prevents overflow/overlap
   
   Example scenario:
   - Current slide has: Title (45px) + 5 bullets (150px) = 195px used
   - You need to add: Large flowchart (400px)
   - Total would be: 595px > 565px ❌ OVERFLOW!
   - Solution: Keep bullets on current slide, note "See flowchart in next slide"
   - Create next slide with ONLY the flowchart (can use full 565px height)
   
   SEPARATE PAGE DECISION TREE:
   - Diagram needs 250px, other content 200px → Total 450px ✓ OK on same page
   - Diagram needs 350px, other content 200px → Total 550px ✓ OK but tight
   - Diagram needs 400px, other content 200px → Total 600px ❌ SEPARATE PAGE
   - Diagram needs 300px, other content 300px → Total 600px ❌ SEPARATE PAGE
   
6. ELEMENT STRUCTURE - PREVENT OVERLAPPING:
   - ALL content elements are DIRECT children of #slide
   - NO nested divs for layout (only <span> for inline formatting, <br/> for line breaks)
   - NO flexbox, NO CSS grid
   
   ⚠️ OVERLAP PREVENTION RULES (MANDATORY):
   - BEFORE placing element B below element A:
     * Calculate: next_top = A_top + A_height + gap (minimum 15px gap)
     * Verify: next_top + B_height <= 660px
     * If doesn't fit → reduce content or use multi-column
   
   - For SIDE-BY-SIDE elements (columns/quadrants):
     * Verify: left1 + width1 + gap < left2 (gap >= 20px)
     * Never overlap horizontally
   
   - For QUADRANTS:
     * Top quadrants: top:125px, height:250px
     * Bottom quadrants: top:395px (125+250+20), height:250px
     * Verify: 395 + 250 = 645 < 660 ✓
   
   - ALWAYS leave 15px+ vertical gap between ANY two elements
   
7. CONTENT FORMATTING BEST PRACTICES:
   - Bullet points: Use • character with <br/> for new lines
   - Bold: <span style="font-weight:bold;">text</span> (use sparingly for emphasis)
   - Use visual hierarchy: headings > subheadings > body text
   - White space is your friend - don't cram information
   - Group related information logically
   - Background boxes: include padding in height calculation
   
8. DATA VISUALIZATION GUIDELINES:
   - One key chart/graph per slide when possible
   - Use consistent colors aligned with your color palette
   - Label axes clearly, include units
   - Highlight key data points or trends
   - Add brief interpretation/insight near the visual
   
9. "KEY INSIGHT" or "SO WHAT?" BOX (if include_insights is true):
   - Position at bottom of content area
   - Style: background-color:{styling.get('accent_color', '#FFA000')}1A; border-left:4px solid {styling.get('accent_color', '#FFA000')}; padding:15px
   - Calculate height including padding
   - Place above footer (e.g., top:570px if height is 90px)
   - Font: {styling.get('body_font_size', 11)}px, color:{styling.get('body_color', '#333333')}

10. PAGE NUMBER & SOURCE:
   - Slide {slide_number} at: top:680px, left:1180px, font-size:10px, color:#666
   - Source (if provided): top:680px, left:60px, font-size:9px, color:#666

11. FONT FAMILY:
   - Use font-family: {styling.get('font_family', 'Arial')}, Helvetica, sans-serif for ALL text elements
   - Professional sans-serif fonts recommended: Arial, Helvetica, Trebuchet MS, Calibri

12. CODE BLOCKS (CRITICAL - MANDATORY STYLING):
   - ALWAYS use dark background: #1e1e1e or #0a0a0a
   - MANDATORY: Apply proper syntax highlighting to EVERY token
   - Syntax colors (use these EXACT colors):
     * Keywords (def, class, if, for, return, import, etc.): #ff79c6 or #c586c0
     * Strings (text in quotes): #50fa7b or #ce9178
     * Comments (# or // or /* */): #6272a4 or #6a9955
     * Function/Method names: #8be9fd or #dcdcaa
     * Numbers: #bd93f9 or #b5cea8
     * Built-in functions: #8be9fd
     * Variables/identifiers: #f8f8f2 (light gray/white)
   - Font: 'Consolas', 'Monaco', 'Courier New', monospace
   - Padding: 20px
   - Border radius: 6px
   - Add language badge in top-right corner
   - Font size: {styling.get('body_font_size', 11) - 1}px for code
   - Line height: 1.6
   - Add subtle box-shadow: 0 2px 8px rgba(0,0,0,0.15)
   
Example code block structure:
<div style="position:absolute; top:200px; left:60px; width:1160px; height:auto;">
  <div style="position:relative; background:#1e1e1e; border-radius:6px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
    <div style="position:absolute; top:10px; right:10px; background:#2d2d2d; color:#f8f8f2; padding:4px 10px; border-radius:4px; font-size:9px; font-weight:600;">Python</div>
    <pre style="margin:0; color:#f8f8f2; font-family:'Consolas',Monaco,monospace; font-size:{styling.get('body_font_size', 11) - 1}px; line-height:1.6; overflow-x:auto; white-space:pre-wrap;"><code><span style="color:#c586c0;">def</span> <span style="color:#dcdcaa;">calculate_total</span>(<span style="color:#f8f8f2;">items</span>):
    <span style="color:#6a9955;"># Calculate the sum of all items</span>
    <span style="color:#f8f8f2;">total</span> = <span style="color:#b5cea8;">0</span>
    <span style="color:#c586c0;">for</span> <span style="color:#f8f8f2;">item</span> <span style="color:#c586c0;">in</span> <span style="color:#f8f8f2;">items</span>:
        <span style="color:#f8f8f2;">total</span> += <span style="color:#f8f8f2;">item</span>.<span style="color:#dcdcaa;">price</span>
    <span style="color:#c586c0;">return</span> <span style="color:#f8f8f2;">total</span></code></pre>
  </div>
</div>

13. DIAGRAMS & FLOWCHARTS (if present in content):
   - Use clean, modern styling
   - Container: background:#fafafa; border-radius:6px; padding:20px; border:1px solid #e0e0e0
   - Colors: Use your defined color palette
   - Add subtle box-shadow: 0 2px 6px rgba(0,0,0,0.08)
   - Ensure text is legible (minimum 10px font)
   - Position with position:absolute like other elements

14. MERMAID DIAGRAMS (if present):
   - Use clean, professional styling matching overall theme
   - Container: background:#fafafa; border-radius:6px; padding:20px
   - Colors: primary {styling.get('primary_color', '#004080')}, secondary {styling.get('secondary_color', '#0066CC')}, accent {styling.get('accent_color', '#FFA000')}
   - Add box-shadow: 0 2px 6px rgba(0,0,0,0.08)
   - Ensure text is legible (minimum 10px font)

MANDATORY PRE-GENERATION CHECKLIST:
Before generating HTML, you MUST answer these questions:

1. How many main content items do I have? (bullets, sections, charts, etc.)
2. What is the estimated height of all content?
   - Each bullet point: ~20-25px
   - Each table row: ~22px
   - Each chart/diagram: measure carefully
   - Code blocks: measure carefully (depends on lines)
   - Total height = sum of all + gaps between
3. Is total height > 565px?
   - YES → Use 2-column or 4-quadrant layout OR reduce content
   - NO → Can use single column
4. ⚠️ DYNAMIC SIZING NEEDED?
   - If using columns/quadrants, will content be evenly distributed?
   - If one section is short (lots of white space) and another is long (tight fit):
     → RESIZE boxes dynamically - reduce short section, expand long section
     → Example: Left has 3 bullets (120px), Right has 8 bullets (280px)
       Instead of equal 280px each, use Left=150px, Right=400px
5. Are there 4 distinct sections that could use quadrants?
   - YES → Consider 4-quadrant layout if data fits well
   - NO → Use 1-column or 2-column layout
6. ⚠️ Do I have a TALL artifact (> 450px) + other content?
   - YES → DO NOT combine them - note to see artifact in next slide
   - NO → Proceed with normal layout (more space available now)

VALIDATION CHECKLIST (verify EVERY item before output):
✓ Title is ≤ 60 characters (count before output - MANDATORY)
✓ Title is BOLD and action-oriented (states conclusion/insight)
✓ Title color is used for TEXT only, NOT for background
✓ Slide background is page_background_color
✓ ONLY data from content section is used - nothing added
✓ Every element has position:absolute
✓ Every element has top, left, width, height in px (no %, no em, no auto)
✓ Every text element has overflow:hidden
✓ No element has top + height > 670px (except footer at 680px)
✓ At least 15px gap between vertically stacked elements
✓ At least 20px gap between side-by-side elements (columns)
✓ All content fits within slide boundaries - NO OVERFLOW
✓ NO elements overlap horizontally or vertically
✓ Visual hierarchy is clear (title → subtitles → body)
✓ If using quadrants, each quadrant has proper spacing
✓ If content was too long, jargons removed but data preserved

CRITICAL FINAL CHECK - MOST IMPORTANT (CHECK TWICE):
⚠️ COUNT title characters - is it ≤ 60? → If NO, abbreviate immediately
⚠️ Calculate EVERY element's bottom edge: element_top + element_height
   → If ANY is > 675px → FIX IMMEDIATELY (reduce content, use columns, resize boxes, OR move artifact to separate slide)
⚠️ OVERLAP CHECK (EXTREMELY IMPORTANT - CHECK EVERY ELEMENT PAIR):
   For EVERY pair of elements on the page:
   1. Check vertical overlap:
      - Element A bottom: A_top + A_height
      - Element B top must be >= A_bottom + 15px
      - If overlap: ADJUST positions immediately
   2. Check horizontal overlap (for side-by-side elements):
      - Element A right: A_left + A_width
      - Element B left must be >= A_right + 20px
      - If overlap: ADJUST positions or stack vertically instead
   3. Check if any element extends beyond boundaries:
      - Left boundary: >= 40px
      - Right boundary: <= 1240px (40 + 1200)
      - Top boundary: >= 110px (after title)
      - Bottom boundary: <= 675px
⚠️ DYNAMIC BOX SIZING CHECK:
   → Do I have columns/quadrants with UNEVEN content distribution?
   → Is there excessive white space in one section while another is tight/overflowing?
   → If YES: RESIZE boxes - reduce height of sparse sections, increase height of dense sections
   → GOAL: Balanced distribution - no section should be mostly empty while another overflows
⚠️ DIAGRAM SIZE CHECK:
   → Is any diagram/chart > 350px height? → If YES, move to separate page
   → Is diagram unnecessarily large? → If YES, reduce to functional size
   → Does diagram cause total content to overflow? → If YES, separate page
⚠️ Are all gaps >= 15px vertical, >= 20px horizontal? → If NO, adjust
⚠️ Is title BOLD? → If NO, add font-weight:bold
⚠️ Did I add any data not in content? → If YES, REMOVE IT
⚠️ Is slide clean and readable? → If NO, simplify
⚠️ If I have a tall artifact + other content that causes overflow:
   → Did I mention "See [artifact] in next slide"? → If NO, add note
   → Will I create a dedicated slide for that artifact? → If NO, plan to do so

FINAL MATH CHECK (DO THIS CALCULATION):
For each content element:
- Element A: top=110, height=200 → bottom=310 ✓ (< 675)
- Element B: top=330, height=180 → bottom=510 ✓ (< 675)  
- Element C: top=530, height=140 → bottom=670 ✓ (< 675)
- Gap between A and B: 330-310=20px ✓ (>= 15)
- Gap between B and C: 530-510=20px ✓ (>= 15)

OVERLAP CHECK (CRITICAL - CHECK EVERY PAIR):
- Elements A & B: A_bottom (310) + 20px gap < B_top (330) ✓ NO VERTICAL OVERLAP
- Elements B & C: B_bottom (510) + 20px gap < C_top (530) ✓ NO VERTICAL OVERLAP
- If side-by-side: A_right (A_left + A_width) + 20px < B_left ✓ NO HORIZONTAL OVERLAP

DYNAMIC SIZING CHECK:
- If Element A only uses 100px but allocated 200px → REDUCE to 120px (save 80px)
- If Element B needs 250px but allocated 180px → INCREASE to 250px (use saved space)
- Recalculate all positions after resizing

DIAGRAM SIZE CHECK:
- If any diagram > 350px height → MOVE TO SEPARATE PAGE

IF ANY BOTTOM > 675 OR ANY OVERLAP DETECTED → REJECT AND REDESIGN WITH COLUMNS/QUADRANTS/DYNAMIC SIZING/SEPARATE PAGES

Output ONLY the raw HTML code, starting with <div id="slide"> and ending with </div>.
DO NOT use markdown code blocks. DO NOT include explanations. DO NOT add any text before or after the HTML.
"""