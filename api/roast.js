const formidable = require('formidable');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Disable body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse form data
    const form = new formidable.IncomingForm();
    
    // Parse the form
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Check if resume file exists
    if (!files.resume) {
      return res.status(400).json({ error: 'No resume file provided' });
    }

    // Get file info
    const file = files.resume;
    const filePath = file.filepath;
    const fileType = file.mimetype;

    // Extract text from file
    let resumeText;
    
    if (fileType === 'application/pdf') {
      // Extract text from PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      resumeText = pdfData.text;
      
    } else if (fileType === 'application/msword' || 
              fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Extract text from DOC/DOCX
      const result = await mammoth.extractRawText({ path: filePath });
      resumeText = result.value;
      
    } else {
      return res.status(415).json({ error: 'Unsupported file type' });
    }

    // Get options from form
    const brutalMode = fields.brutalMode === 'true';
    const improveSuggestions = fields.improveSuggestions === 'true';

    // Analyze resume with OpenAI
    const analysis = await analyzeResume(resumeText, { brutalMode, improveSuggestions });

    // Return analysis
    return res.status(200).json(analysis);
    
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Analyze resume with OpenAI
async function analyzeResume(resumeText, options) {
  const { brutalMode = true, improveSuggestions = true } = options;
  
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
    // Call OpenAI API
    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    // Parse JSON response
    const responseText = chatCompletion.data.choices[0].message.content.trim();
    const jsonMatch = responseText.match(/({[\s\S]*})/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
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
