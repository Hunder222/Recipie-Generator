const recipieReqForm = document.getElementById("recipieReqForm")
const recipieContainer = document.querySelector("#recipieContainer")
const recipieText = document.getElementById("recipieText")
const recipieImg = document.getElementById("recipeImg")
const placeholder = document.querySelector("#loadingPlaceholder")
const apikeyInput = document.querySelector("#apikey")

// TODO query selector"


function getRecipie(mealName, userApiKey) {
    placeholder.style.display = "block";

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

    let url, headers, requestBody;

    // Check if the key looks like an OpenAI key (starts with 'sk-')
    if (userApiKey && userApiKey.startsWith('sk-')) {
        url = "https://api.openai.com/v1/chat/completions";
        headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userApiKey}`
        };
        requestBody = {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: prompt }
            ]
        };
    // if gemini key
    } else if (userApiKey) {
        const model = "gemini-2.5-flash";
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`;
        headers = {
            "Content-Type": "application/json"
        };
        requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt } // Gemini uses 'contents' and 'parts' array
                    ]
                }
            ],
        };

    } else {
        console.error("No API key provided.");
        recipieText.textContent = "Error: Please provide a valid API key.";
        placeholder.style.display = "none";
        return Promise.resolve("No key.");
    }

    return fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error.message); });
            }
            return response.json();
        })
        .then(data => {

            let text = "";

            if (userApiKey.startsWith('sk-')) {
                // Handle OpenAI Response Structure
                if (data.choices && data.choices.length > 0) {
                    text = data.choices[0].message.content;
                } else {
                    console.error("OpenAI Error:", data);
                    text = "Error: OpenAI did not return a response.";
                }
            } else {
                // Handle Gemini Response Structure
                if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
                    text = data.candidates[0].content.parts[0].text;
                } else {
                    console.error("Gemini Error:", data);
                    text = "Error: Gemini did not return a response (Safety Block likely).";
                }
            }

            console.log("Response Text:", text);
            placeholder.style.display = "none";
            
            if (typeof marked !== 'undefined') {
                recipieText.innerHTML = marked.parse(text);
            } else {
                recipieText.textContent = text;
            }

            return text;

        })
        .catch(error => {
            console.error("Fetch/API Error:", error);
            placeholder.style.display = "none";
            recipieText.textContent = `Error: Failed to fetch recipe. Details: ${error.message}`;
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
    const userApiKey = apikeyInput.value

    if (mealName.length < 2) {
        alert("input recipie name");

    } else {
        recipieContainer.style.display="block"
        recipieText.textContent = "Generating recipie...";
        recipieImg.src = "Loading_icon.gif"; 
        recipieImg.style.display = "block";

        const finalImageUrl = generateImageUrl(mealName);

        try {
            await getRecipie(mealName, userApiKey); 
            
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





