def get_title_slide_prompt(title, subtitle, author, date_text, width, height, bg_color, text_color, styling, font_family="Inter"):
    return f"""
You are a McKinsey presentation designer. Create a professional TITLE SLIDE in HTML.

TITLE SLIDE CONTENT (USE EXACTLY AS GIVEN - DO NOT ADD OR MODIFY):
- Main Title: {title}
- Subtitle: {subtitle}
- Author: {author}
- Date: {date_text}

CRITICAL DATA RULES:
⚠️ MAXIMUM TITLE LENGTH: 16 characters - STRICTLY ENFORCE THIS LIMIT
⚠️ If title exceeds 16 characters: Abbreviate, remove filler words, but preserve core meaning
⚠️ DO NOT add any text from your side - use ONLY the data provided above
⚠️ DO NOT modify data points, numbers, or key information
⚠️ Examples: "Q4 Results" (10 chars), "Market Overview" (15 chars), "Revenue Growth" (14 chars)

DESIGN REQUIREMENTS:
- Slide Background Color: {bg_color}  ← THIS IS THE SLIDE BACKGROUND
- Text Color for ALL text: {text_color}  ← THIS IS FOR TEXT ONLY, NOT BACKGROUND
- Accent Color: {styling.get('accent_color', '#FFA000')}
- Secondary Color: {styling.get('secondary_color', '#0066CC')}
- Font Family: {font_family}

CRITICAL STYLING RULES:
⚠️ Title MUST be BOLD (font-weight:bold or font-weight:700)
⚠️ Title color ({text_color}) is for TEXT only - NEVER use it for background-color
⚠️ Slide background is ALWAYS {bg_color} - NEVER change the slide background based on title color

CRITICAL TECHNICAL REQUIREMENTS - PREVENT OVERLAP AND OVERFLOW:

1. CONTAINER (EXACT - DO NOT MODIFY):
   <div id="slide" style="width:{width}px; height:{height}px; position:relative; background-color:{bg_color}; overflow:hidden;">

2. POSITIONING RULES - ABSOLUTELY MANDATORY:
   - Every element MUST have: position:absolute
   - Every element MUST have explicit: top, left, width, height in PIXELS
   - CALCULATE positions carefully: next_element_top = previous_element_top + previous_element_height + gap
   - MINIMUM gap between elements: 20px
   - NO element should have top + height > {height}px
   
3. LAYOUT ZONES (use these EXACT positions - OPTIMIZED MARGINS):
   - Decorative bar: top:0px, left:0px, width:{width}px, height:6px
   - Main title: top:260px, left:40px, width:{width - 80}px, height:65px, font-weight:bold, text-align:center
   - Subtitle: top:340px, left:40px, width:{width - 80}px, height:35px, text-align:center
   - Author: top:400px, left:40px, width:{width - 80}px, height:28px, text-align:center
   - Date: top:660px, left:40px, width:{width - 80}px, height:22px, text-align:center
   
4. TEXT OVERFLOW PREVENTION:
   - Use overflow:hidden on text elements
   - Use text-overflow:ellipsis if text is too long
   - Ensure font-size fits within height constraints
   
5. ALL elements must be DIRECT children of #slide - NO nested containers
6. Add a decorative gradient bar at the top using Accent and Secondary colors
7. Use font-family: {font_family}, Arial, sans-serif for ALL text elements

VALIDATION CHECKLIST (verify before output):
✓ Title is BOLD (font-weight:bold or 700)
✓ Title length ≤ 16 characters (MANDATORY - abbreviate if needed)
✓ Slide background is {bg_color} (not title color)
✓ Text color is {text_color} (for text only)
✓ Every element has position:absolute with top, left, width, height in px
✓ No element exceeds slide boundaries (top + height ≤ {height}px)
✓ Minimum 20px gaps between elements
✓ No content overflow

Output ONLY the raw HTML, starting with <div id="slide"> and ending with </div>.
NO markdown code blocks. NO explanations. NO text before or after HTML.
"""
