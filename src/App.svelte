<script>
	let recipes = [
		{ id: 1, name: "Veggie Pasta", co2ePerGram: 0.5 },
		{ id: 2, name: "Bean Burger", co2ePerGram: 0.7 },
		{ id: 3, name: "Tofu Stir-Fry", co2ePerGram: 0.6 }
	];
	let selectedRecipeId = null;
	let portionSizeInGrams = 0;
	let totalCO2e = 0;

	$: if (selectedRecipeId && portionSizeInGrams > 0) {
		const recipe = recipes.find(r => r.id === selectedRecipeId);
		totalCO2e = recipe.co2ePerGram * portionSizeInGrams;
	} else {
		totalCO2e = 0;
	}
</script>

<main>  <h1>Welcome to Green-Bite</h1>

	<select bind:value={selectedRecipeId}>
	  <option value="" disabled selected>Select a recipe</option>
	  {#each recipes as recipe}
		<option value={recipe.id}>{recipe.name}</option>
	  {/each}
	</select>
  
	<input type="number" bind:value={portionSizeInGrams} min="0" placeholder="Portion size in grams" />
  
	<p>Total CO2e for this portion: {totalCO2e.toFixed(2)} grams</p>
  </main>

<style>
main {
	text-align: center;
	padding: 1em;
	background: #f9f9f9;
}

select {
	margin-top: 1em;
	padding: 0.5em;
	border: 1px solid #ddd;
	border-radius: 4px;
}
</style>
