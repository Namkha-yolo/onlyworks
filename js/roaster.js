/**
 * Resume Roaster - Diagnostic Version
 * This version includes detailed logging to identify issues
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log("🔍 DIAGNOSTICS: Resume Roaster script loaded");
  
  // DOM Elements
  const elements = {
    uploadArea: document.getElementById('uploadArea'),
    resumeUpload: document.getElementById('resumeUpload'),
    roastBtn: document.getElementById('roastBtn'),
    loadingRoast: document.getElementById('loadingRoast'),
    roastResults: document.getElementById('roastResults'),
    resumeScore: document.getElementById('resumeScore'),
    scoreVerdict: document.getElementById('scoreVerdict'),
    brutalFeedback: document.getElementById('brutalFeedback'),
    improvementAreas: document.getElementById('improvementAreas'),
    downloadReport: document.getElementById('downloadReport'),
    requestRewrite: document.getElementById('requestRewrite'),
    brutalMode: document.getElementById('brutalMode'),
    improveSuggestions: document.getElementById('improveSuggestions'),
    professionalRewrite: document.getElementById('professionalRewrite')
  };
  
  // Check if elements exist
  let missingElements = false;
  Object.entries(elements).forEach(([name, element]) => {
    if (!element) {
      console.error(`🔍 DIAGNOSTICS: Missing element with ID "${name}"`);
      missingElements = true;
    } else {
      console.log(`🔍 DIAGNOSTICS: Found element "${name}"`);
    }
  });
  
  if (missingElements) {
    console.error("🔍 DIAGNOSTICS: Some elements are missing. Resume Roaster may not work correctly.");
    alert("Resume Roaster initialization failed. See console for details.");
    return;
  }
  
  // Log button state
  console.log(`🔍 DIAGNOSTICS: Roast button disabled: ${elements.roastBtn.disabled}`);
  
  // State
  let selectedFile = null;
  let roastData = null;
  
  // Event Listeners for Drag & Drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    elements.uploadArea.addEventListener(eventName, preventDefaults, false);
    console.log(`🔍 DIAGNOSTICS: Added ${eventName} event listener to upload area`);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log(`🔍 DIAGNOSTICS: Prevented default for ${e.type} event`);
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    elements.uploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    elements.uploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    console.log(`🔍 DIAGNOSTICS: Highlighting upload area`);
    elements.uploadArea.classList.add('dragover');
  }
  
  function unhighlight() {
    console.log(`🔍 DIAGNOSTICS: Unhighlighting upload area`);
    elements.uploadArea.classList.remove('dragover');
  }
  
  // Handle file drop
  elements.uploadArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    console.log(`🔍 DIAGNOSTICS: File dropped`);
    const dt = e.dataTransfer;
    const files = dt.files;
    
    console.log(`🔍 DIAGNOSTICS: Drop event files:`, files);
    
    if (files.length) {
      handleFiles(files);
    }
  }
  
  // Handle file selection via input
  elements.resumeUpload.addEventListener('change', function(e) {
    console.log(`🔍 DIAGNOSTICS: File input changed`, this.files);
    
    if (this.files.length) {
      handleFiles(this.files);
    }
  });
  
  // Add a click event to the label to ensure it triggers the file input
  const browseLabel = elements.uploadArea.querySelector('label[for="resumeUpload"]');
  if (browseLabel) {
    browseLabel.addEventListener('click', function(e) {
      console.log(`🔍 DIAGNOSTICS: Browse button clicked`);
      // Explicitly trigger click on the file input
      elements.resumeUpload.click();
    });
  } else {
    console.error(`🔍 DIAGNOSTICS: Could not find label for file input`);
  }
  
  function handleFiles(files) {
    const file = files[0];
    const fileType = file.type;
    
    console.log(`🔍 DIAGNOSTICS: Handling file: ${file.name}, type: ${fileType}, size: ${file.size} bytes`);
    
    // Check if file type is allowed
    if (fileType === 'application/pdf' || 
        fileType === 'application/msword' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      
      selectedFile = file;
      console.log(`🔍 DIAGNOSTICS: Valid file selected: ${file.name}`);
      
      // Update UI to show selected file
      const fileName = file.name;
      elements.uploadArea.innerHTML = `
        <i class="fas fa-file-alt"></i>
        <h3>${fileName}</h3>
        <p class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        <button id="changeFile" class="btn btn-secondary btn-sm">Change File</button>
      `;
      
      document.getElementById('changeFile').addEventListener('click', function() {
        console.log(`🔍 DIAGNOSTICS: Change file button clicked`);
        resetUploadArea();
      });
      
      // Enable roast button
      elements.roastBtn.disabled = false;
      console.log(`🔍 DIAGNOSTICS: Roast button enabled`);
      
    } else {
      console.error(`🔍 DIAGNOSTICS: Invalid file type: ${fileType}`);
      alert('Please upload a PDF, DOC, or DOCX file.');
    }
  }
  
  function resetUploadArea() {
    console.log(`🔍 DIAGNOSTICS: Resetting upload area`);
    selectedFile = null;
    elements.resumeUpload.value = '';
    elements.roastBtn.disabled = true;
    
    elements.uploadArea.innerHTML = `
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
        console.log(`🔍 DIAGNOSTICS: New file input changed`, this.files);
        if (this.files.length) {
          handleFiles(this.files);
        }
      });
      
      // Re-attach drop events
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        elements.uploadArea.addEventListener(eventName, preventDefaults, false);
      });
      
      ['dragenter', 'dragover'].forEach(eventName => {
        elements.uploadArea.addEventListener(eventName, highlight, false);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        elements.uploadArea.addEventListener(eventName, unhighlight, false);
      });
      
      elements.uploadArea.addEventListener('drop', handleDrop, false);
      
      // Re-add click handler to label
      const browseLabel = elements.uploadArea.querySelector('label[for="resumeUpload"]');
      if (browseLabel) {
        browseLabel.addEventListener('click', function() {
          console.log(`🔍 DIAGNOSTICS: New browse button clicked`);
          newResumeUpload.click();
        });
      }
    } else {
      console.error(`🔍 DIAGNOSTICS: Could not find new resume upload input after reset`);
    }
  }
  
  // Handle roast button click
  elements.roastBtn.addEventListener('click', function() {
    console.log(`🔍 DIAGNOSTICS: Roast button clicked`);
    
    if (!selectedFile) {
      console.error(`🔍 DIAGNOSTICS: No file selected`);
      return;
    }
    
    // Test with a mock response first
    console.log(`🔍 DIAGNOSTICS: Using mock response for testing`);
    
    // Show loading
    elements.loadingRoast.style.display = 'block';
    elements.roastResults.style.display = 'none';
    
    console.log(`🔍 DIAGNOSTICS: Loading spinner shown`);
    
    // Mock data for testing
    setTimeout(() => {
      const mockData = {
        score: 6,
        feedback: [
          { section: "Contact Information", comment: "Your contact details are basic. Consider adding LinkedIn or GitHub." },
          { section: "Summary", comment: "Generic summary that doesn't highlight your unique value proposition." },
          { section: "Experience", comment: "Too focused on responsibilities rather than achievements." }
        ],
        improvements: [
          { title: "Add Metrics", description: "Include specific numbers and percentages to quantify achievements." },
          { title: "Use Action Verbs", description: "Begin bullet points with strong action verbs." }
        ]
      };
      
      // Store the mock data
      roastData = mockData;
      
      // Hide loading, show results
      elements.loadingRoast.style.display = 'none';
      elements.roastResults.style.display = 'block';
      
      console.log(`🔍 DIAGNOSTICS: Results shown with mock data`);
      
      // Update UI with roast data
      updateRoastResults(mockData);
      
      // Scroll to results
      elements.roastResults.scrollIntoView({ behavior: 'smooth' });
      
    }, 2000); // 2 second delay to simulate processing
  });
  
  function updateRoastResults(data) {
    console.log(`🔍 DIAGNOSTICS: Updating results with data:`, data);
    
    // Update score
    elements.resumeScore.textContent = data.score;
    
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
    elements.scoreVerdict.textContent = verdict;
    
    // Update feedback sections
    elements.brutalFeedback.innerHTML = '';
    data.feedback.forEach(item => {
      const feedbackItem = document.createElement('p');
      feedbackItem.innerHTML = `<strong>${item.section}:</strong> ${item.comment}`;
      elements.brutalFeedback.appendChild(feedbackItem);
    });
    
    // Update improvement areas if available
    if (data.improvements && data.improvements.length) {
      elements.improvementAreas.innerHTML = '';
      data.improvements.forEach(item => {
        const improvementItem = document.createElement('div');
        improvementItem.classList.add('improvement-item');
        improvementItem.innerHTML = `
          <h5>${item.title}</h5>
          <p>${item.description}</p>
        `;
        elements.improvementAreas.appendChild(improvementItem);
      });
    } else {
      elements.improvementAreas.innerHTML = '<p>No specific improvement suggestions available.</p>';
    }
  }
  
  // Handle download report button
  elements.downloadReport.addEventListener('click', function() {
    console.log(`🔍 DIAGNOSTICS: Download report button clicked`);
    if (!roastData) return;
    
    // Create report text
    let reportText = `RESUME ROAST REPORT\n`;
    reportText += `====================\n\n`;
    reportText += `Overall Score: ${roastData.score}/10\n`;
    reportText += `Verdict: ${elements.scoreVerdict.textContent}\n\n`;
    
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
    
    // Create download
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'resume_roast_report.txt';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  });
  
  // Handle request rewrite button
  elements.requestRewrite.addEventListener('click', function() {
    console.log(`🔍 DIAGNOSTICS: Request rewrite button clicked`);
    
    if (elements.professionalRewrite.checked) {
      alert('This would navigate to a payment page in a real implementation.');
    } else {
      alert('Please select the "Request professional rewrite" option and try again.');
      
      elements.professionalRewrite.parentElement.scrollIntoView({ behavior: 'smooth' });
      elements.professionalRewrite.parentElement.classList.add('highlight');
      
      setTimeout(() => {
        elements.professionalRewrite.parentElement.classList.remove('highlight');
      }, 3000);
    }
  });
  
  console.log("🔍 DIAGNOSTICS: Resume Roaster initialization complete");
});
