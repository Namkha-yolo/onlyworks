/**
 * Cloud Functions for Resume Roaster
 */

// Load environment variables
require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { Configuration, OpenAIApi } = require('openai');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize OpenAI with API key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Cloud Function for resume analysis
exports.roast = functions.https.onRequest((req, res) => {
  // Enable CORS
  return cors(req, res, async () => {
    console.log("Roast function called");
    
    // Check if method is POST
    if (req.method !== 'POST') {
      return res.status(405).send({ error: 'Method Not Allowed' });
    }
    
    try {
      // Process form data with Busboy
      const busboy = new Busboy({ headers: req.headers });
      const fields = {};
      const fileWrites = [];
      let fileData = null;
      
      // Process fields
      busboy.on('field', (fieldname, val) => {
        console.log(`Field received: ${fieldname} = ${val}`);
        fields[fieldname] = val === 'true';
      });
      
      // Process file upload
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
          console.log("File upload complete, waiting for writes to finish");
          // Wait for files to be written
          await Promise.all(fileWrites);
          
          if (!fileData) {
            console.error("No file provided");
            return res.status(400).send({ error: 'No file provided' });
          }
          
          console.log("Extracting text from file");
          // Extract text from file
          const resumeText = await extractTextFromFile(fileData);
          
          if (!resumeText || resumeText.trim() === '') {
            return res.status(422).send({ error: 'Could not extract text from file' });
          }
          
          console.log("Analyzing resume with OpenAI");
          // Analyze with OpenAI
          const analysis = await analyzeResume(resumeText, fields);
          
          console.log("Analysis complete, sending response");
          // Send analysis to client
          return res.status(200).send(analysis);
          
        } catch (error) {
          console.error('Error processing file:', error);
          return res.status(500).send({ error: 'Failed to process resume: ' + error.message });
        } finally {
          // Clean up temp files
          if (fileData && fileData.filepath) {
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

// Extract text from different file types
async function extractTextFromFile(fileData) {
  const { filepath, mimetype } = fileData;
  
  console.log(`Extracting text from ${mimetype} file`);
  
  try {
    // Handle PDF files
    if (mimetype === 'application/pdf') {
      console.log("Processing PDF file");
      const dataBuffer = fs.readFileSync(filepath);
      const data = await pdf(dataBuffer);
      return data.text;
      
    // Handle Word docs
    } else if (mimetype === 'application/msword' || 
               mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log("Processing Word document");
      const result = await mammoth.extractRawText({ path: filepath });
      return result.value;
      
    } else {
      throw new Error('Unsupported file type: ' + mimetype);
    }
  } catch (error) {
    console.error("Error extracting text:", error);
    throw error;
  }
}

// Analyze resume with OpenAI
async function analyzeResume(resumeText, options) {
  const { brutalMode = true, improveSuggestions = true } = options;
  
  console.log("Analyzing resume with options:", options);
  
  // Prepare prompt for OpenAI
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
    
    // Fallback response
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