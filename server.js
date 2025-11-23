
const express = require("express");
const cors = require("cors");

const path = require('path');
const fs = require('fs').promises; // promises for await and async function
let updateQueue = Promise.resolve();

const app = express();
const port = 3006;

app.use(cors());
app.use(express.json())
// subfolder with files it loads on localhost:3000, including html, its styles and client side JS
app.use(express.static(path.join(__dirname)));





const mealLibrary = {
    meals: {
        "Spaghetti carbonare": {
            name: "Spaghetti Carbonara",
            portions: 4,
            cookingTimeMin: 30,
            ingredients: [
                { ingredient: "spaghetti", amount: 500, unit: "g" },
                { ingredient: "bacon", amount: 150, unit: "g" },
                { ingredient: "cream", amount: 500, unit: "ml" }
            ],
            instructionSteps: [
                "Lorem ipsum dolor sit amet, consectetur adipisici elit",
                "Sed eiusmod tempor incidunt ut labore et dolore magna aliqua.",
                "Curabitur blandit tempus ardua ridiculus sed magna.",
                "Inmensae subtilitatis, obscuris et malesuada fames.",
                "Paullum deliquit, ponderibus modulisque suis ratio utitur.",
                "Pellentesque habitant morbi tristique senectus et netus.",
                "A communi observantia non est"
            ]
        },
        "Tortelinni with cream sauce": {
            name: "Tortelinni with cream sauce",
            portions: 4,
            cookingTimeMin: 30,
            ingredients: [
                { ingredient: "spaghetti", amount: 500, unit: "g" },
                { ingredient: "bacon", amount: 150, unit: "g" },
                { ingredient: "cream", amount: 500, unit: "ml" }
            ],
            instructions: "     "
        }
    }
}









async function getRecipieAi(mealName) {
    const apiKey = "AIzaSyBLaq3Vox53v5-Ldd-G8CvNkHZxuTXkQmA";
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const jsonStructure = {
        name: "Name of the meal",
        description: "Short description and optionally: add fun fact about the meal",
        portions: 4,
        cookingTimeMin: 30,
        ingredients: [
            { ingredient: "Item name", amount: 100, unit: "kg/g/pcs/tb/tsp/pinch/l/ml/cl" },
            { ingredient: "Item name", amount: 100, unit: "kg/g/pcs/tb/tsp/pinch/l/ml/cl" }
        ],
        instructionSteps: ["Step 1", "Step 2"]
    };

    const prompt = `
        Create a recipe for ${mealRequest}.

        IMPORTANT: You must output ONLY valid JSON. Do not output markdown text.
        Follow this exact JSON structure:
        ${JSON.stringify(jsonStructure)}

        Rules:
        - Use only these metric units (kg,g,pcs,tb,tsp,pinch,l,ml,cl).
            if unit is irrelevant, set unit to 'N/A'. example( "ingredient": "Egg yolk", "amount": 2, "unit":"N/A")
        - 'amount' must be a number (use 0 if 'to taste').
        - 'cookingTimeMin' must be a number, (time in minutes).
    `;


    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }] // Correct Gemini API structure
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // 1. Get the raw text
        let text = data.candidates[0].content.parts[0].text;
        console.log("Raw text received from Gemini:", text);

        // 2. CLEAN THE TEXT (Crucial step to remove markdown wrappers)
        // This handles both backticks at the start and end of the string.
        text = text.trim(); // Remove leading/trailing whitespace
        if (text.startsWith('```json')) {
            console.log("Started with markdown");
            text = text.substring(7); // Remove '```json'
        }
        if (text.endsWith('```')) {
            console.log("Ended with markdown");
            text = text.substring(0, text.length - 3); // Remove trailing '```'
        }
        text = text.trim(); // Clean up again after trimming the wrappers

        console.log("Clean JSON text ready for parsing:", text);
        return text;

    } catch (error) {
        console.error("AI Error:", error);
        return null; // Return null so the server knows it failed
    }
}

// --- Call the function ---
//geminiChat("Tell me how to pronouse the name 'Mohsen'");




app.get('/requestRecipe/:reqMeal', async (req, res) => {
    const reqMeal = req.params.reqMeal;
    console.log("User requested:", reqMeal);

    const recipeText = await getRecipieAi(reqMeal);

    if (recipeText) {
        // Send the AI response back to the client
        res.json({
            status: "success",
            data: JSON.parse(recipeText) // Parse it to real JSON before sending
        });
    } else {
        res.status(500).json({ error: "Failed to generate recipe" });
    }
});







app.listen(port, () => {
    console.log(`Application is now running on port ${port}`);
});







const testRecipie = {
    "name": "Spaghetti Carbonara",
    "description": "A classic Roman pasta dish featuring spaghetti tossed with a creamy sauce made from egg yolks, Pecorino Romano cheese, crispy guanciale, and black pepper.",
    "ingredients": [
        {
            "ingredient": "Spaghetti",
            "amount": 200,
            "unit": "g"
        },
        {
            "ingredient": "Guanciale (or Pancetta)",
            "amount": 100,
            "unit": "g"
        },
        {
            "ingredient": "Pecorino Romano cheese, grated",
            "amount": 50,
            "unit": "g"
        },
        {
            "ingredient": "Egg yolks",
            "amount": 2,
            "unit": "pcs"
        },
        {
            "ingredient": "Freshly ground black pepper",
            "amount": 5,
            "unit": "g"
        },
        {
            "ingredient": "Salt (for pasta water)",
            "amount": 10,
            "unit": "g"
        }
    ],
    "instructionSteps": [
        "Bring a large pot of salted water to a rolling boil. Add the spaghetti and cook according to package directions until al dente. Before draining, reserve about 1 cup (240ml) of the starchy pasta water.",
        "While the pasta cooks, cut the guanciale into small strips or cubes. Place the guanciale in a cold skillet and cook over medium heat until crispy and the fat has rendered. Remove the crispy guanciale with a slotted spoon and set aside, leaving the rendered fat in the skillet.",
        "In a medium bowl, whisk together the egg yolks, grated Pecorino Romano cheese, and a generous amount of freshly ground black pepper until smooth and creamy.",
        "Once the spaghetti is cooked, drain it and immediately add it to the skillet with the warm guanciale fat (remove the skillet from the heat to prevent the eggs from scrambling). Toss well to coat the spaghetti in the fat.",
        "Quickly pour the egg and cheese mixture over the hot spaghetti, tossing continuously and vigorously. The residual heat from the pasta and the fat will cook the eggs into a creamy sauce without scrambling them.",
        "Add a small amount of the reserved pasta water (1-2 tablespoons at a time) to the spaghetti while continuously tossing, until the sauce reaches your desired creamy consistency. You may not need all the reserved water.",
        "Stir in the reserved crispy guanciale. Serve immediately, garnished with extra Pecorino Romano cheese and freshly ground black pepper."
    ]
}