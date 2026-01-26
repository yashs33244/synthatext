def get_ending_slide_prompt(slide_type, main_text, secondary_text, contact_info, width, height, bg_color, text_color, styling):
    return f"""
You are a McKinsey presentation designer. Create a professional ENDING/THANK YOU SLIDE in HTML.

ENDING SLIDE CONTENT (USE EXACTLY AS GIVEN - DO NOT ADD OR MODIFY):
- Type: {slide_type}
- Main Text: {main_text}
- Secondary Text: {secondary_text}
- Contact Info: {contact_info}

CRITICAL DATA RULES:
⚠️ DO NOT add any text from your side - use ONLY the data provided above
⚠️ If text exceeds boundaries: Remove jargons but preserve key information
⚠️ Main text should be concise and impactful (≤ 50 characters if possible)

DESIGN REQUIREMENTS:
- Slide Background Color: {bg_color}  ← THIS IS THE SLIDE BACKGROUND
- Text Color: {text_color}  ← THIS IS FOR TEXT ONLY, NOT BACKGROUND
- Accent Color: {styling.get('accent_color', '#FFA000')}
- Secondary Color: {styling.get('secondary_color', '#0066CC')}

CRITICAL STYLING RULES:
⚠️ Main text MUST be BOLD (font-weight:bold or font-weight:700)
⚠️ Text color is for TEXT only - NEVER use it for background-color
⚠️ Slide background is ALWAYS {bg_color}

CRITICAL TECHNICAL REQUIREMENTS - PREVENT OVERLAP AND OVERFLOW:

1. CONTAINER (EXACT - DO NOT MODIFY):
   <div id="slide" style="width:{width}px; height:{height}px; position:relative; background-color:{bg_color}; overflow:hidden;">

2. POSITIONING RULES - ABSOLUTELY MANDATORY:
   - Every element MUST have: position:absolute
   - Every element MUST have explicit: top, left, width, height in PIXELS
   - CALCULATE positions: next_top = previous_top + previous_height + gap
   - MINIMUM gap between elements: 20px
   - NO element should have top + height > {height}px
   - ADD overflow:hidden to all text elements
   
3. LAYOUT ZONES (use these EXACT positions - OPTIMIZED MARGINS):
   - Decorative bar: top:0px, left:0px, width:{width}px, height:6px
   - Main text: top:290px, left:40px, width:{width - 80}px, height:75px, font-weight:bold, text-align:center, overflow:hidden
   - Secondary text: top:385px, left:40px, width:{width - 80}px, height:38px, text-align:center, overflow:hidden
   - Contact info (if any): top:445px, left:40px, width:{width - 80}px, height:auto (max 50px), text-align:center
   
4. ALL elements must be DIRECT children of #slide - NO nested containers
5. Make it visually impactful and professional

VALIDATION CHECKLIST (verify before output):
✓ Main text is BOLD (font-weight:bold or 700)
✓ Slide background is {bg_color} (not text color)
✓ Text color is {text_color} (for text only)
✓ Every element has position:absolute with top, left, width, height in px
✓ No element exceeds slide boundaries (top + height ≤ {height}px)
✓ Minimum 20px gaps between elements
✓ All text elements have overflow:hidden
✓ No content added beyond what was provided

Output ONLY the raw HTML, starting with <div id="slide"> and ending with </div>.
NO markdown code blocks. NO explanations. NO text before or after HTML.
"""
