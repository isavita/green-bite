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


const threadsApiUrl = "https://api.openai.com/v1/threads";

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

export async function createThread() {
    const apiKey = process.env.OPENAI_API_KEY;

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
    };

    try {
        const response = await axios.post(threadsApiUrl, {}, { headers: headers, timeout: timeout });
        const threadId = response.data.id;
        return threadId;
    } catch (error) {
        // Handle errors here
        console.error('Error creating thread:', error);
    }
}

export async function postThreadMessage(threadId, recipe) {
    const apiKey = process.env.OPENAI_API_KEY;
    const threadsMessagesUrl = `https://api.openai.com/v1/threads/${threadId}/messages`;

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
    };

    const messageContent = `
${JSON.stringify(recipe)}
Calculate the total CO2 for this recipe in grams.
`;

    const messagePayload = {
        role: "user",
        content: messageContent
    };

    try {
        const response = await axios.post(threadsMessagesUrl, messagePayload, { headers: headers, timeout: timeout });
        return response.data; 
    } catch (error) {
        // Handle errors here
        console.error('Error posting message to thread:', error);
    }
}

export async function initiateRun(threadId, assistantId) {
    const apiKey = process.env.OPENAI_API_KEY;
    const threadsRunUrl = `https://api.openai.com/v1/threads/${threadId}/runs`;

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
    };

    const payload = {
        assistant_id: assistantId
    };

    try {
        const response = await axios.post(threadsRunUrl, payload, { headers: headers, timeout: timeout });
        const threadRunId = response.data.id;
        return threadRunId;
    } catch (error) {
        console.error('Error initiating run:', error);
    }
}

export async function pollRunStatusAndGetMessage(threadId, runId) {
    const apiKey = process.env.OPENAI_API_KEY;
    const threadsRunStatusUrl = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`;
    const threadsMessagesUrl = `https://api.openai.com/v1/threads/${threadId}/messages`;

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v1'
    };

    try {
        let runStatus;
        do {
            const statusResponse = await axios.get(threadsRunStatusUrl, { headers: headers });
            runStatus = statusResponse.data.status;

            console.log('Current run status:', runStatus); // Add this log to check the status

            if (runStatus !== 'completed' && runStatus !== 'failed' && runStatus !== 'expired') {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Check if runStatus is undefined or null
            if (typeof runStatus === 'undefined' || runStatus === null) {
                throw new Error('Run status is undefined or null');
            }

        } while (runStatus !== 'completed' && runStatus !== 'failed' && runStatus !== 'expired');


        const messagesResponse = await axios.get(threadsMessagesUrl, { headers: headers, timeout: timeout });
        const lastMessage = messagesResponse.data.data[0] || {};
        return lastMessage;
    } catch (error) {
        console.error('Error polling run status or retrieving message:', error);
    }
}


export function extractTotalCO2eGramsFromMessage(message) {
    if (message && message.content && message.content.length > 0) {
        const firstContentItem = message.content[0];

        if (firstContentItem.type === 'text' && firstContentItem.text && firstContentItem.text.value) {
            const textValue = firstContentItem.text.value;

            const jsonMatch = textValue.match(/```json({.*})```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    const parsedJson = JSON.parse(jsonMatch[1]);
                    return parsedJson["result"] || jsonMatch;
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    return textValue; 
                }
            } else {
                return textValue;
            }
        }
    }

    return null;
}
