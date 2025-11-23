const recipieReqForm = document.getElementById("recipieReqForm")
const recipieContainer = document.querySelector("#recipieContainer")
const recipieText = document.getElementById("recipieText")
const recipieImg = document.getElementById("recipeImg")
const placeholder = document.querySelector("#loadingPlaceholder")

// TODO query selector"


function getRecipie(mealName) {

    placeholder.style.display="block"

    const prompt = `
        Create a recipe for ${mealName}.
        
        The recipe must contain:
        - Title of meal.
        - Description and/or fun fact about the meal.
        - Amount of portions.
        - Cooking time in minutes.
        - A list of Ingredients and the amount.
        - Instructions in steps.

        Rules:
        - Use metric units (kg,g,pcs,tb,tsp,pinch,l,ml,cl).
        - 'amount' must be a number (use 0 if 'to taste').
    `;

    const apiKey = "AIzaSyBLaq3Vox53v5-Ldd-G8CvNkHZxuTXkQmA"; 
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // --- The Gemini API request body (payload) is different ---
    const requestBody = {
        "contents": [
            {
                role: "user",
                parts: [
                    { text: prompt }
                ]
            }
        ],
    };

    return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    })
        .then(response => { return response.json(); })
        .then(data => {
            console.log("Full Gemini Response:", data.candidates[0].content);

            // --- Extract the text ---
            try {
                // 1. Check if we have candidates (if not, the prompt was probably blocked)
                if (!data.candidates || data.candidates.length === 0) {
                    console.warn("Gemini Blocked the Prompt:", data.promptFeedback);
                    return "Error: The AI refused to answer this prompt (Safety Block).";
                }

                const candidate = data.candidates[0];

                // 2. Check if the response has content (sometimes it stops for safety)
                if (!candidate.content || !candidate.content.parts) {
                    console.warn("Gemini Blocked the Response. Finish Reason:", candidate.finishReason);
                    return "Error: The AI started answering but stopped (Safety Block).";
                }

                // 3. Extract the text safely
                const text = candidate.content.parts[0].text;
                console.log("Gemini:", text);

                // 4. Render Markdown
                if (typeof marked !== 'undefined') {
                    placeholder.style.display="none"
                    recipieText.innerHTML = marked.parse(text);
                } else {
                    recipieText.textContent = text;
                }

                return text;
            } catch (e) {
                console.error("Error parsing Gemini response:", e);
                console.error("Full response object:", data);
                return "Error: Could not parse response.";
            }
        })
        .catch(error => {
            console.error("Error fetching from Gemini:", error);
        });
}



function generateImageUrl(mealName) {
    const prompt = `A professional food photography shot of ${mealName}, delicious, cinematic lighting, 8k, hyperrealistic`;
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1000&height=600&nologo=true`
    return imageUrl;
}


recipieReqForm.addEventListener('submit', async (event) => {

    event.preventDefault();
    const formData = new FormData(event.target);
    const formObj = Object.fromEntries(formData.entries());
    const mealName = formObj.mealReq;

    if (mealName.length < 2) {
        alert("input recipie name");

    } else {
        recipieContainer.style.display="block"
        recipieText.textContent = "Generating recipie...";
        recipieImg.src = "Loading_icon.gif"; 
        recipieImg.style.display = "block";

        const finalImageUrl = generateImageUrl(mealName);

        try {
            await getRecipie(mealName); 
            // await getRecipieJSON(mealName) // server
            
            // wait for image to be ready before replacing the plaaceholder
            await new Promise((resolve) => {
                const img = new Image();
                img.onload = resolve;
                img.src = finalImageUrl;
            });

            recipieImg.src = finalImageUrl;

        } catch (error) {
            recipieText.textContent = "Error generating recipe.";
            console.error(error);
        }
    }
});






function getRecipieJSON(mealReq) {
    const endpoint = '/requestRecipe/' + mealReq;

    fetch(endpoint)
        // Step 1: Get the Response object
        .then(response => {
            console.log("Response received via fetch:", response);
            
            // You must return this promise to the next .then
            return response.json(); 
        })
        // Step 2: Receive the actual data (the text)
        .then(data => {
            console.log("Actual Data:", data); // This prints: Hello world!
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

