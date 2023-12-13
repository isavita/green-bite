import axios from 'axios';

const timeout = 60000;
const completionsApiUrl = "https://api.openai.com/v1/chat/completions";
const visionModel = "gpt-4-vision-preview";
const visionUserMessage = `
Identify the food in the image and if it's a dish all of its ingredients and their quantities in GRAMS.
Focus on ingredients that have CO2e values.
I will use this data to calculate the CO2e food print of the food.
Whenever you are not sure or there is not enough information in the image for the ingredients use your broder knowledge to give some estimates for the ingredients and their quantities.

RESPONSE FORMAT:
The response have to be JSON formatted  surrounded with the following markup \`\`\`json<INPUT_HERE>\`\`\`.
The JSON should have the following keys
- "food_name" - it is the name of the dish or the item if any found in the image; if no dish found in the image set it to string "none".
- "ingredients" - ARRAY of all important ingredients for caclulating the CO2e emission of the dish. 
Each ingredient have to include the following keys
- "name" - the name of the ingredient.
- "grams" - quantity ALWAYS in grams.
If there is no entry

RESPONSE EXAMPLES:
1. Example of Black Bean Soup
\`\`\`json
{
"food_name": "Black Bean Soup",
"ingredients": [
  {"name": "black beans","grams": 250},
  {"name": "carrot","grams": 80},
  {"name": "yellow onion","grams": 100},
  {"name": "garlic cloves", "grams": 4},
  {"name": "broth", "grams": 14},
  {"name": "oregano", "grams": 3},
  {"name": "olive oil", "grams": 6},
  {"name": "coriander", "grams": 2}
]
}
\`\`\`
2. Example of single item
\`\`\`json
{
"food_name": "apple",
"ingredients": [
  {"name": "apple","grams": 200}
]
}
\`\`\`
3. Example of no food image
\`\`\`json
{
"food_name": "none",
"ingredients": []
}
\`\`\`
DO NOT ADD ANYTHING ELSE to your response
`

export function extractImageAnalysisContent(str) {
    const startPattern = "```json";
    const endPattern = "```";

    const startIndex = str.indexOf(startPattern);
    if (startIndex !== -1) {
        const endIndex = str.indexOf(endPattern, startIndex + startPattern.length);
        if (endIndex !== -1) {
            return str.substring(startIndex + startPattern.length, endIndex);
        }
    }
    return str;
}

export function parseJsonContent(str) {
    try {
        return JSON.parse(str);
    } catch (_error) {
        return str;
    }
}

export async function completionsVision(imageBase64) {
    const apiKey = process.env.OPENAI_API_KEY;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const payload = {
        model: visionModel,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: visionUserMessage
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageBase64
                        }
                    }
                ]
            }
        ],
        max_tokens: 4096
    };

    try {
        const response = await axios.post(completionsApiUrl, payload, { headers: headers, timeout: timeout });
        const content = response.data.choices && response.data.choices[0] ? response.data.choices[0].message.content : '';
        return content;
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(error.response.data);
            console.error(error.response.status);
            console.error(error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error', error.message);
        }
        console.error(error.config);
    }
}
