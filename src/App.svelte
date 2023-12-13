<script>
    import { encodeImageToBase64 } from './imageUtils.js';
	import { 
		completionsVision,
		extractImageAnalysisContent,
		parseJsonContent
	} from './openaiUtils.js';

    let imageBase64, imageAnalysisResult;

    async function handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
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
