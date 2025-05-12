/**
 * Cloud Function for Resume Roaster
 * With .env support
 */

// Load environment variables from .env file
require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { Configuration, OpenAIApi } = require('openai');

admin.initializeApp();

// Initialize OpenAI with the API key from .env
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Log the API key (first few characters only) for debugging
console.log("API Key loaded (first 5 chars):", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 5) + "..." : "NOT FOUND");

// Cloud Function for resume roasting
exports.roast = functions.https.onRequest((req, res) => {
  // Enable CORS
  return cors(req, res, async () => {
    console.log("Roast function called with method:", req.method);
    
    // Verify method is POST
    if (req.method !== 'POST') {
      return res.status(405).send({ error: 'Method Not Allowed' });
    }
    
    try {
      // Parse form data using Busboy
      const busboy = new Busboy({ headers: req.headers });
      const fields = {};
      const fileWrites = [];
      let fileData = null;
      
      // Process fields
      busboy.on('field', (fieldname, val) => {
        console.log(`Field received: ${fieldname} = ${val}`);
        fields[fieldname] = val === 'true';
      });
      
      // Process file
      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(`Processing file: ${filename} (${mimetype})`);
        
        // Create temp file
        const filepath = path.join(os.tmpdir(), filename);
        const writeStream = fs.createWriteStream(filepath);
        
        // Write file to temp
        file.pipe(writeStream);
        
        // Save file info
        fileData = { filepath, mimetype, filename };
        
        // Add promise to array
        const promise = new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
        
        fileWrites.push(promise);
      });
      
      // When all uploads are processed
      busboy.on('finish', async () => {
        try {
          console.log("All uploads processed, waiting for file writes to complete");
          // Wait for all files to be written
          await Promise.all(fileWrites);
          
          if (!fileData) {
            console.error("No file provided");
            return res.status(400).send({ error: 'No file provided' });
          }
          
          console.log("Extracting text from file");
          // Extract text from the file
          const resumeText = await extractTextFromFile(fileData);
          
          console.log("Analyzing resume with OpenAI");
          // Analyze the resume
          const analysis = await analyzeResume(resumeText, fields);
          
          console.log("Analysis complete, sending response");
          // Send back the analysis
          return res.status(200).send(analysis);
          
        } catch (error) {
          console.error('Error processing file:', error);
          return res.status(500).send({ error: 'Failed to process resume: ' + error.message });
        } finally {
          // Clean up temp files
          if (fileData) {
            fs.unlinkSync(fileData.filepath);
            console.log("Temporary file deleted");
          }
        }
      });
      
      // Handle request
      busboy.end(req.rawBody);
      
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).send({ error: 'Server error: ' + error.message });
    }
  });
});

// Function to extract text from different file types
async function extractTextFromFile(fileData) {
  const { filepath, mimetype } = fileData;
  
  console.log(`Extracting text from ${mimetype} file`);
  
  // Handle different file types
  if (mimetype === 'application/pdf') {
    // Extract text from PDF
    console.log("Processing PDF file");
    const dataBuffer = fs.readFileSync(filepath);
    const data = await pdf(dataBuffer);
    return data.text;
    
  } else if (mimetype === 'application/msword' || 
             mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Extract text from DOC/DOCX
    console.log("Processing Word document");
    const result = await mammoth.extractRawText({ path: filepath });
    return result.value;
    
  } else {
    throw new Error('Unsupported file type: ' + mimetype);
  }
}

// Function to analyze resume using OpenAI
async function analyzeResume(resumeText, options) {
  const { brutalMode = true, improveSuggestions = true } = options;
  
  console.log("Analyzing resume with options:", options);
  
  // Prepare a prompt for OpenAI based on options
  let prompt = `Analyze the following resume critically and provide honest feedback. `;
  
  if (brutalMode) {
    prompt += `Be brutally honest and don't sugar coat the critique. `;
  } else {
    prompt += `Be direct but constructive. `;
  }
  
  prompt += `For each section (Contact Information, Summary/Objective, Education, Experience, Skills, etc.), 
  provide specific criticisms. Also give an overall score out of 10.
  
  Resume text:
  ${resumeText}
  
  Please respond in the following JSON format:
  {
    "score": 7,
    "feedback": [
      {"section": "Contact Information", "comment": "Your detailed critique here"},
      {"section": "Summary", "comment": "Your detailed critique here"},
      {"section": "Experience", "comment": "Your detailed critique here"},
      ...
    ]`;
  
  if (improveSuggestions) {
    prompt += `,
    "improvements": [
      {"title": "Improvement title 1", "description": "Detailed suggestion"},
      {"title": "Improvement title 2", "description": "Detailed suggestion"},
      ...
    ]`;
  }
  
  prompt += `
  }`;
  
  try {
    console.log("Sending request to OpenAI");
    // Call OpenAI API
    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    console.log("OpenAI response received");
    
    // Parse JSON response
    const responseText = chatCompletion.data.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/({[\s\S]*})/);
    
    if (jsonMatch) {
      const jsonResponse = JSON.parse(jsonMatch[0]);
      console.log("Successfully parsed JSON response");
      return jsonResponse;
    } else {
      console.error("Failed to parse JSON response from OpenAI");
      throw new Error('Failed to parse JSON response from OpenAI');
    }
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback response in case of API error
    return {
      score: 5,
      feedback: [
        { section: "General", comment: "We encountered an issue analyzing your resume. Here's a generic assessment: Your resume needs more specific achievements and quantifiable results. Avoid generic descriptions and focus on your unique contributions." }
      ],
      improvements: improveSuggestions ? [
        { title: "Add Specific Metrics", description: "Include numbers and percentages to quantify your achievements." },
        { title: "Tailor to Job Descriptions", description: "Customize your resume for each application by matching keywords from the job posting." }
      ] : []
    };
  }
}