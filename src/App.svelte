<script>
    import { encodeImageToBase64 } from './imageUtils.js';
	import { 
		completionsVision,
		extractImageAnalysisContent,
		parseJsonContent,
        createThread,
        postThreadMessage,
        initiateRun,
        pollRunStatusAndGetMessage,
		extractTotalCO2eGramsFromMessage
	} from './openaiUtils.js';

    let imageBase64, imageAnalysisResult, totalCO2eGrams;
	let calculatingCO2e = false;

    async function handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
			imageBase64, imageAnalysisResult, totalCO2eGrams = null;
            try {
                imageBase64 = await encodeImageToBase64(file);
				const completions = await completionsVision(imageBase64);
				const content = extractImageAnalysisContent(completions);
				imageAnalysisResult = parseJsonContent(content);
            } catch (error) {
                console.error('Error processing the image:', error);
            }
        }
    }

	function displayResponse() {
        if (imageAnalysisResult && imageAnalysisResult.ingredients) {
            return imageAnalysisResult.ingredients.map(ingredient => 
                `<li>${ingredient.name}: ${ingredient.grams} grams</li>`
            ).join('');
        } else {
            return JSON.stringify(imageAnalysisResult, null, 2);
        }
    }

	async function calculateCO2e() {
        calculatingCO2e = true;
        totalCO2eGrams = null;

		const assistantId = 'asst_U46V8wX7fdNlSHpiqirdkAsj';

        try {
            console.log('Creating thread...');
			const threadId = await createThread();
			console.log('Thread created with ID:', threadId);

			console.log('Posting thread message...');
			await postThreadMessage(threadId, imageAnalysisResult);

			console.log('Initiating run...');
			const runId = await initiateRun(threadId, assistantId);
			console.log('Run initiated with ID:', runId);

			console.log('Polling run status...');
			const lastMessage = await pollRunStatusAndGetMessage(threadId, runId);
			console.log('Run completed, last message:', lastMessage);
			
            totalCO2eGrams = extractTotalCO2eGramsFromMessage(lastMessage); 
        } catch (error) {
            console.error('Error calculating CO2e:', error);
            totalCO2eGrams = 'Error in calculation';
        }

        calculatingCO2e = false;
    }
</script>

<main>
    <h1>Green Bite</h1>
    <input type="file" accept="image/*" on:change="{handleFileChange}" />

    {#if imageBase64}
	<div class="image-container">
		<img src="{imageBase64}" alt="" class="image-preview" />
	</div>
    {/if}

	{#if imageAnalysisResult}
	<div class="response-container">
		<h2>Analysis Food:</h2>
		{#if imageAnalysisResult.ingredients}
			<h3>{imageAnalysisResult.food_name}</h3>
			<ul class="ingredients-list">
				{@html displayResponse()}
			</ul>
		{:else}
			<pre>{displayResponse()}</pre>
		{/if}
	</div>
	{:else if imageBase64}
	<div class="response-container">
		<p>Processing...</p>
	</div>
	{/if}

	{#if imageAnalysisResult && imageAnalysisResult.ingredients}
	<button on:click="{calculateCO2e}" disabled={calculatingCO2e} class="calculate-button">
		{#if calculatingCO2e}
			Calculating...
		{:else}
			Calculate CO2e
		{/if}
	</button>

		{#if totalCO2eGrams !== null}
			<p class="co2e-result">Total CO2e: {totalCO2eGrams} g</p>
		{/if}
    {/if}
</main>

<style>
:root {
    --primary-color:  #8FBC8F;
    --secondary-color: #228B22;
    --text-color: #333333;
    --background-color: #DDDDDD;
	--border-color: #DDDDDD;
    --response-bg-color: #F8F8F8;
    --button-border-radius: 20px;
}

main {
    text-align: center;
    padding: 2em;
    max-width: 1024;
    margin: 0 auto;
}

h1 {
    font-size: 2.5em;
    font-weight: 600;
    letter-spacing: -1px;
    margin-bottom: 0.5em;
}

.image-container {
	max-width: 512px;
    margin: 1em auto;
	text-align: center;
}

.image-preview {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
}

.response-container {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--response-bg-color);
}

.ingredients-list {
    list-style-type: none;
    padding: 0;
}

.ingredients-list li {
    margin: 5px 0;
    font-size: 1em;
}

pre {
    background-color: var(--response-bg-color);
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
}

.calculate-button {
    padding: 10px 20px;
    border: 2px solid var(--secondary-color);
    background-color: var(--primary-color);
    color: var(--text-color);
    font-size: 1em;
    cursor: pointer;
    margin-top: 20px;
    border-radius: var(--button-border-radius); /* Apply rounded corners */
}

.co2e-result {
    margin-top: 10px;
    font-size: 1em;
    color: var(--text-color);
}
</style>