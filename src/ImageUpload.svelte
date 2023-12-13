<script>
    import { encodeImageToBase64 } from './imageUtils.js';

    let imageBase64 = null;

    async function handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                imageBase64 = await encodeImageToBase64(file);
            } catch (error) {
                console.error('Error processing the image:', error);
            }
        }
    }
</script>

<style>
    .image-preview {
        margin-top: 20px;
        border: 1px solid #ccc;
        padding: 10px;
        text-align: center;
    }

    .image-preview img {
        max-width: 100%;
        height: auto;
    }
</style>

<main>
    <h1>Upload Image</h1>
    <input type="file" accept="image/*" on:change="{handleFileChange}" />

    {#if imageBase64}
        <div class="image-preview">
            <img src="{imageBase64}" alt="Uploaded Image Preview" />
        </div>
    {/if}
</main>

