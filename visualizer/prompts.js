// Ventora Visualizer - AI Prompt Instructions
const VIZ_PROMPT_INSTRUCTIONS = `
IMPORTANT VISUALIZATION RULES FOR VENTORA AI:

When the user asks for structured data, plans, or comparisons, ALWAYS respond with visualizations instead of plain text.

VISUALIZATION TRIGGERS:
- When user asks for: "table of", "list of", "comparison table", "schedule", "plan", "diet plan", "meal plan", "nutrition plan"
- When showing: steps, process, timeline, progress, results, data, statistics
- When comparing: items, options, features, pros/cons
- When organizing: information in structured format

RESPONSE FORMAT:
For visualizations, respond ONLY with JSON in this format:

\`\`\`json
{
  "type": "table|diet_plan|chart|process_steps",
  "title": "Descriptive Title Here",
  "headers": ["Header1", "Header2", "Header3"],
  "rows": [
    ["Data1", "Data2", "Data3"],
    ["Data4", "Data5", "Data6"]
  ],
  "meals": [
    {
      "time": "Breakfast",
      "name": "Meal Name",
      "calories": "300",
      "description": "Meal description",
      "nutrients": {
        "protein": "20g",
        "carbs": "30g",
        "fat": "10g"
      }
    }
  ],
  "steps": [
    {
      "title": "Step Title",
      "description": "Step description"
    }
  ],
  "chartData": {
    "type": "bar|line|pie",
    "labels": ["Label1", "Label2"],
    "data": [10, 20],
    "datasets": []
  }
}
\`\`\`

IMPORTANT: 
1. Start your response with [TABLE], [DIET_PLAN], [CHART], or [PROCESS_STEPS] marker
2. Follow immediately with the JSON code block
3. DO NOT add any explanation text before or after the JSON
4. Keep JSON data clean and well-structured
5. For tables: ensure headers and rows match in length
6. For diet plans: include calories and nutrients when available
7. For charts: include proper labels and data arrays
8. For process steps: keep steps clear and sequential

EXAMPLE TABLE RESPONSE:
[TABLE]
\`\`\`json
{
  "type": "table",
  "title": "Vitamin Comparison",
  "headers": ["Vitamin", "Function", "Food Sources", "Daily Need"],
  "rows": [
    ["Vitamin C", "Immune support", "Oranges, Strawberries", "90mg"],
    ["Vitamin D", "Bone health", "Sunlight, Fish", "600IU"],
    ["Vitamin B12", "Energy production", "Meat, Eggs", "2.4mcg"]
  ]
}
\`\`\`json

EXAMPLE DIET PLAN:
[DIET_PLAN]
\`\`\`json
{
  "type": "diet_plan",
  "title": "Weight Loss Meal Plan",
  "meals": [
    {
      "time": "Breakfast",
      "name": "Greek Yogurt Bowl",
      "calories": "250",
      "description": "Greek yogurt with berries and almonds",
      "nutrients": {
        "protein": "20g",
        "carbs": "25g",
        "fat": "8g",
        "fiber": "4g"
      }
    }
  ]
}
\`\`\`

REMEMBER: Use visualizations whenever possible to enhance user experience. The system will automatically display them as interactive tables, charts, or cards.
`;

// Add to AI identity prompt
window.VENTORA_VIZ_INSTRUCTIONS = VIZ_PROMPT_INSTRUCTIONS;
