const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI("AIzaSyAVu4ut5_IpsG3C8nZkTClGmFCkkIItVP0"); // Use your own API key);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

const prompt="Analyze the given image of the food item and provide a detailed description including the following aspects. Name of the food item.Estimated calorie content as a percentage of daily intake (assuming a 2000 kcal/day diet).Breakdown of nutritional components such as protein, fats, and carbohydrates. Potential harmful effects based on the food's nutritional composition (e.g., high fat or sugar content).Overall health assessment: is this food healthy, moderately healthy, or unhealthy? Any dietary recommendations or advice related to the food item (e.g., 'consume in moderation', 'high in saturated fats, limit intake')."

async function generateTextFromImage(imagePath) {
    const image = {
      inlineData: {
        data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
        mimeType: "image/jpg", // Ensure this matches the type of your image
      },
    };
  
    try {
      const result = await model.generateContent([  ,image]);
      console.log("API Response:", JSON.stringify(result, null, 2)); // Log the complete response
  
      // Check if the response structure is as expected
      if (result && result.response && result.response.candidates && result.response.candidates.length > 0) {
        return result.response.candidates[0].content.parts[0].text; // Access the correct path to get the text
      } else {
        throw new Error("Unexpected response structure from the API.");
      }
    } catch (error) {
      console.error("Error generating text from image:", error);
      throw error; // Re-throw the error to handle it in the calling function
    }
  }
      
  

app.get("/",(req,res)=>{
    res.send("Hello from gemini");
})
// Endpoint to handle image upload and text generation
app.post("/generate-text-from-image", upload.single("image"), async (req, res) => {
  try {
    const filePath = path.join(__dirname, req.file.path);
    const generatedText = await generateTextFromImage(filePath);

    // Remove the uploaded file after processing
    fs.unlinkSync(filePath);

    // Send the generated text back to the frontend
    res.json({ text: generatedText });
  } catch (error) {
    console.error("Error generating text from image:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
