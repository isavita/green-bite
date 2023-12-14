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

    let imageBase64, imageAnalysisResult;

    async function handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                imageBase64 = await encodeImageToBase64(file);
				const completions = await completionsVision(imageBase64);
				content = extractImageAnalysisContent(completions);
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

	let calculatingCO2e = false;
    let totalCO2eGrams = null;

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
    <h1>Welcome to Green-Bite</h1>
    <input type="file" accept="image/*" on:change="{handleFileChange}" />

    {#if imageBase64}
        <div class="image-container">
            <img src="{imageBase64}" alt="Uploaded Image Preview" class="image-preview" />
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
		<button on:click="{calculateCO2e}" disabled={calculatingCO2e}>
			{#if calculatingCO2e}
				Calculating...
			{:else}
				Calculate CO2e in Grams
			{/if}
		</button>

		{#if totalCO2eGrams !== null}
			<p>Total CO2e: {totalCO2eGrams} grams</p>
		{/if}
    {/if}
</main>

<style>
main {
	text-align: center;
	padding: 1em;
	background: #f9f9f9;
}

.image-container {
	position: relative;
	width: 100vw;
	height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
}

.image-preview {
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
}

.response-container {
	margin-top: 20px;
	padding: 15px;
	border: 1px solid #ddd;
	border-radius: 4px;
	background-color: #f8f8f8;
}

.ingredients-list {
	list-style-type: none;
	padding: 0;
}

.ingredients-list li {
	margin: 5px 0;
	font-size: 1.1em;
}

pre {
	background-color: #eee;
	padding: 10px;
	border-radius: 4px;
	white-space: pre-wrap;
}
</style>
