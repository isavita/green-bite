export function encodeImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Convert ArrayBuffer to Base64
            const bytes = new Uint8Array(reader.result);
            let binary = '';
            bytes.forEach((b) => binary += String.fromCharCode(b));
            const base64String = window.btoa(binary);

            // Use the file's type to support different image formats
            const dataUri = `data:${file.type};base64,${base64String}`;
            resolve(dataUri);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
