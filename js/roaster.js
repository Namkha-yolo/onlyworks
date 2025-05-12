/**
 * Resume Roaster - Front-end logic for OnlyWork
 * Updated version with improved file handling
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log("Resume Roaster JS loaded");
  
  // DOM Elements
  const uploadArea = document.getElementById('uploadArea');
  const resumeUpload = document.getElementById('resumeUpload');
  const roastBtn = document.getElementById('roastBtn');
  const loadingRoast = document.getElementById('loadingRoast');
  const roastResults = document.getElementById('roastResults');
  const resumeScore = document.getElementById('resumeScore');
  const scoreVerdict = document.getElementById('scoreVerdict');
  const brutalFeedback = document.getElementById('brutalFeedback');
  const improvementAreas = document.getElementById('improvementAreas');
  const downloadReport = document.getElementById('downloadReport');
  const requestRewrite = document.getElementById('requestRewrite');
  const brutalMode = document.getElementById('brutalMode');
  const improveSuggestions = document.getElementById('improveSuggestions');
  const professionalRewrite = document.getElementById('professionalRewrite');
  
  // Check if elements exist
  if (!uploadArea) console.error("Missing uploadArea element");
  if (!resumeUpload) console.error("Missing resumeUpload element");
  if (!roastBtn) console.error("Missing roastBtn element");
  if (!loadingRoast) console.error("Missing loadingRoast element");
  if (!roastResults) console.error("Missing roastResults element");
  
  // State
  let selectedFile = null;
  let roastData = null;
  
  // Ensure file input is clickable
  const browseLabel = document.querySelector('label[for="resumeUpload"]');
  if (browseLabel) {
    browseLabel.addEventListener('click', function(e) {
      // Prevent the default to manually handle the click
      e.preventDefault(); 
      e.stopPropagation();
      
      // Manually trigger click on the file input
      resumeUpload.click();
      
      console.log("Browse button clicked, triggering file input");
    });
  }
  
  // Event Listeners for Drag & Drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    uploadArea.classList.add('dragover');
  }
  
  function unhighlight() {
    uploadArea.classList.remove('dragover');
  }
  
  // Handle file drop
  uploadArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    console.log("File dropped");
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
      handleFiles(files);
    }
  }
  
  // Handle file selection via input
  resumeUpload.addEventListener('change', function(e) {
    console.log("File input changed", this.files);
    
    if (this.files.length) {
      handleFiles(this.files);
    }
  });
  
  function handleFiles(files) {
    const file = files[0];
    const fileType = file.type;
    
    console.log("Handling file:", file.name, "Type:", fileType);
    
    // Check if file type is allowed
    if (fileType === 'application/pdf' || 
        fileType === 'application/msword' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      
      selectedFile = file;
      
      // Update UI to show selected file
      const fileName = file.name;
      uploadArea.innerHTML = `
        <i class="fas fa-file-alt"></i>
        <h3>${fileName}</h3>
        <p class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        <button id="changeFile" class="btn btn-secondary btn-sm">Change File</button>
      `;
      
      document.getElementById('changeFile').addEventListener('click', function() {
        resetUploadArea();
      });
      
      // Enable roast button
      roastBtn.disabled = false;
      
    } else {
      alert('Please upload a PDF, DOC, or DOCX file.');
    }
  }
  
  function resetUploadArea() {
    selectedFile = null;
    resumeUpload.value = '';
    roastBtn.disabled = true;
    
    uploadArea.innerHTML = `
      <i class="fas fa-file-upload"></i>
      <h3>Drag & Drop your resume here</h3>
      <p>or</p>
      <label for="resumeUpload" class="btn btn-secondary btn-sm">Browse Files</label>
      <input type="file" id="resumeUpload" accept=".pdf,.doc,.docx" hidden>
      <p class="file-types">Supported formats: PDF, DOC, DOCX</p>
    `;
    
    // Re-attach event listener to the new input
    const newResumeUpload = document.getElementById('resumeUpload');
    if (newResumeUpload) {
      newResumeUpload.addEventListener('change', function(e) {
        if (this.files.length) {
          handleFiles(this.files);
        }
      });
      
      // Re-attach event to the browse label
      const newBrowseLabel = document.querySelector('label[for="resumeUpload"]');
      if (newBrowseLabel) {
        newBrowseLabel.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          newResumeUpload.click();
        });
      }
    }
    
    // Re-attach drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    uploadArea.addEventListener('drop', handleDrop, false);
  }
  
  // Handle roast button click
  roastBtn.addEventListener('click', function() {
    if (!selectedFile) return;
    
    console.log("Roast button clicked, processing file:", selectedFile.name);
    
    // Show loading
    loadingRoast.style.display = 'block';
    roastResults.style.display = 'none';
    
    // Prepare form data
    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('brutalMode', brutalMode.checked);
    formData.append('improveSuggestions', improveSuggestions.checked);
    formData.append('professionalRewrite', professionalRewrite.checked);
    
    // Get the Vercel function URL
    const functionUrl = 'https://partime-landing-page-phi-three.vercel.app/api/roast';
    
    console.log("Sending request to:", functionUrl);
    
    // For debugging first, let's use a mock response
    // This will help verify if the frontend is working correctly
    setTimeout(() => {
      const mockData = {
        score: 7,
        feedback: [
          { section: "Contact Information", comment: "Your contact section lacks professional email and LinkedIn URL. Use a professional email instead of a personal one." },
          { section: "Summary", comment: "Your summary is too generic and doesn't highlight your unique value proposition. It reads like every other resume." },
          { section: "Experience", comment: "Your experience bullets focus too much on responsibilities rather than achievements. No quantifiable metrics are provided." },
          { section: "Skills", comment: "Your skills section is a boring list without organization or proficiency levels." },
          { section: "Education", comment: "Your education section lacks relevant coursework or academic achievements that would set you apart." }
        ],
        improvements: [
          { title: "Add Metrics and Results", description: "Include specific numbers and percentages to quantify your achievements. For example, 'Increased sales by 25%' instead of 'Increased sales'." },
          { title: "Use Action Verbs", description: "Start bullet points with strong action verbs like 'Implemented', 'Developed', or 'Managed' instead of passive language." },
          { title: "Customize for Job Descriptions", description: "Tailor your resume for specific job postings by incorporating relevant keywords from the job description." },
          { title: "Improve Formatting", description: "Use consistent formatting throughout your resume. Ensure proper alignment, spacing, and font usage." }
        ]
      };
      
      // Store the response data
      roastData = mockData;
      
      // Hide loading, show results
      loadingRoast.style.display = 'none';
      roastResults.style.display = 'block';
      
      // Update UI with roast data
      updateRoastResults(mockData);
      
      // Scroll to results
      roastResults.scrollIntoView({ behavior: 'smooth' });
      
      console.log("Mock response processed successfully");
      
      // After confirming frontend works, uncomment this real API call
      /*
      fetch(functionUrl, {
        method: 'POST',
        body: formData
      })
      .then(response => {
        console.log("Response received:", response.status);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Data received:", data);
        
        // Store the response data
        roastData = data;
        
        // Hide loading, show results
        loadingRoast.style.display = 'none';
        roastResults.style.display = 'block';
        
        // Update UI with roast data
        updateRoastResults(data);
        
        // Scroll to results
        roastResults.scrollIntoView({ behavior: 'smooth' });
      })
      .catch(error => {
        console.error("Error:", error);
        loadingRoast.style.display = 'none';
        alert(`Error: ${error.message}. Please try again later.`);
      });
      */
    }, 2000); // Simulate 2 second API call
  });
  
  function updateRoastResults(data) {
    // Update score
    resumeScore.textContent = data.score;
    
    // Update verdict based on score
    let verdict = '';
    if (data.score <= 3) {
      verdict = 'This resume needs life support!';
    } else if (data.score <= 5) {
      verdict = 'Mediocre at best. Major improvements needed.';
    } else if (data.score <= 7) {
      verdict = 'Not terrible, but not impressive either.';
    } else if (data.score <= 9) {
      verdict = 'Pretty solid resume with minor issues.';
    } else {
      verdict = 'Excellent resume! Little to roast here.';
    }
    scoreVerdict.textContent = verdict;
    
    // Update feedback sections
    brutalFeedback.innerHTML = '';
    data.feedback.forEach(item => {
      const feedbackItem = document.createElement('p');
      feedbackItem.innerHTML = `<strong>${item.section}:</strong> ${item.comment}`;
      brutalFeedback.appendChild(feedbackItem);
    });
    
    // Update improvement areas if available
    if (data.improvements && data.improvements.length) {
      improvementAreas.innerHTML = '';
      data.improvements.forEach(item => {
        const improvementItem = document.createElement('div');
        improvementItem.classList.add('improvement-item');
        improvementItem.innerHTML = `
          <h5>${item.title}</h5>
          <p>${item.description}</p>
        `;
        improvementAreas.appendChild(improvementItem);
      });
    } else {
      improvementAreas.innerHTML = '<p>No specific improvement suggestions available.</p>';
    }
  }
  
  // Handle download report button
  downloadReport.addEventListener('click', function() {
    if (!roastData) return;
    
    // Create a text representation of the report
    let reportText = `RESUME ROAST REPORT\n`;
    reportText += `====================\n\n`;
    reportText += `Overall Score: ${roastData.score}/10\n`;
    reportText += `Verdict: ${scoreVerdict.textContent}\n\n`;
    
    reportText += `BRUTAL FEEDBACK:\n`;
    reportText += `---------------\n`;
    roastData.feedback.forEach(item => {
      reportText += `${item.section}: ${item.comment}\n`;
    });
    
    reportText += `\nAREAS TO IMPROVE:\n`;
    reportText += `----------------\n`;
    if (roastData.improvements && roastData.improvements.length) {
      roastData.improvements.forEach(item => {
        reportText += `${item.title}\n`;
        reportText += `${item.description}\n\n`;
      });
    } else {
      reportText += `No specific improvement suggestions available.\n`;
    }
    
    // Create a Blob from the text
    const blob = new Blob([reportText], { type: 'text/plain' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'resume_roast_report.txt';
    
    // Append to body, click and remove
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  });
  
  // Handle request rewrite button
  requestRewrite.addEventListener('click', function() {
    if (professionalRewrite.checked) {
      alert('This would navigate to a payment page in a real implementation.');
    } else {
      alert('Please select the "Request professional rewrite" option and try again.');
      
      // Scroll back to options
      document.querySelector('.roast-options').scrollIntoView({ behavior: 'smooth' });
      
      // Highlight the option
      professionalRewrite.parentElement.classList.add('highlight');
      setTimeout(() => {
        professionalRewrite.parentElement.classList.remove('highlight');
      }, 3000);
    }
  });
  
  console.log("Resume Roaster initialization complete");
});
