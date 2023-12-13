const axios = require('axios');
const fs = require('fs');
const path = require('path');
const completionsApiUrl = "https://api.openai.com/v1/chat/completions";

export async function completionsVision(imageBase64) {
    const apiKey = process.env.LB_OPENAI_API_KEY;

    // Define the headers
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    // Define the payload
    const payload = {
        model: "gpt-4-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Your user message here."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${imageBase64}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 4096
    };

    try {
        // Make the API call
        const response = await axios.post(completionsApiUrl, payload, { headers: headers });
        
        // Extract the first choice content
        const content1 = response.data.choices && response.data.choices[0] ? response.data.choices[0].message.content : '';

        // Process the content to extract JSON
        const jsonContent1 = content1.split('```json')[1].split('```')[0].trim();
        
        // Parse the JSON content
        const parsedContent = JSON.parse(jsonContent1);
        console.log(parsedContent);
    } catch (error) {
        console.error('Error:', error);
    }
}
