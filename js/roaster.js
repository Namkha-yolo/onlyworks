/**
 * Resume Roaster - Simplified version that WILL work
 */

// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Roaster.js loaded");
  
  // Direct DOM element references
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('resumeUpload');
  const roastBtn = document.getElementById('roastBtn');
  const loadingEl = document.getElementById('loadingRoast');
  const resultsEl = document.getElementById('roastResults');
  
  // Print out if we found the elements
  console.log("Upload area found:", !!uploadArea);
  console.log("File input found:", !!fileInput);
  console.log("Roast button found:", !!roastBtn);
  
  // If any essential element is missing, stop execution
  if (!uploadArea || !fileInput || !roastBtn) {
    console.error("Critical elements missing");
    return;
  }
  
  // Add a click handler to the Browse Files button
  const browseLabel = uploadArea.querySelector('label[for="resumeUpload"]');
  if (browseLabel) {
    console.log("Browse label found");
    browseLabel.onclick = function(e) {
      console.log("Browse label clicked");
      // Don't prevent default - let the label trigger the file input
    };
  }
  
  // State variable to track the selected file
  let selectedFile = null;
  
  // Listen for file selection
  fileInput.addEventListener('change', function() {
    console.log("File input changed, files:", this.files);
    if (this.files.length > 0) {
      handleFile(this.files[0]);
    }
  });
  
  // Function to handle the selected file
  function handleFile(file) {
    console.log("Handling file:", file.name);
    selectedFile = file;
    
    // Update the UI to show the selected file
    uploadArea.innerHTML = `
      <i class="fas fa-file-alt"></i>
      <h3>${file.name}</h3>
      <p>${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
      <button id="changeFileBtn" class="btn btn-secondary btn-sm">Change File</button>
    `;
    
    // Enable the roast button
    roastBtn.disabled = false;
    
    // Add click handler to the change file button
    document.getElementById('changeFileBtn').addEventListener('click', resetUploadArea);
  }
  
  // Function to reset the upload area
  function resetUploadArea() {
    console.log("Resetting upload area");
    selectedFile = null;
    fileInput.value = '';
    roastBtn.disabled = true;
    
    uploadArea.innerHTML = `
      <i class="fas fa-file-upload"></i>
      <h3>Drag & Drop your resume here</h3>
      <p>or</p>
      <label for="resumeUpload" class="btn btn-secondary btn-sm">Browse Files</label>
      <input type="file" id="resumeUpload" accept=".pdf,.doc,.docx" hidden>
      <p class="file-types">Supported formats: PDF, DOC, DOCX</p>
    `;
    
    // Re-initialize the file input
    const newFileInput = document.getElementById('resumeUpload');
    newFileInput.addEventListener('change', function() {
      if (this.files.length > 0) {
        handleFile(this.files[0]);
      }
    });
  }
  
  // Drag and drop functionality
  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('dragover');
  });
  
  uploadArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('dragover');
  });
  
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('dragover');
    
    console.log("File dropped");
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  
  // Handle the Roast button click
  roastBtn.addEventListener('click', function() {
    if (!selectedFile) {
      console.log("No file selected");
      return;
    }
    
    console.log("Roasting file:", selectedFile.name);
    
    // Show loading spinner
    loadingEl.style.display = 'block';
    resultsEl.style.display = 'none';
    
    // Mock data for testing
    setTimeout(function() {
      // Hide loading spinner
      loadingEl.style.display = 'none';
      
      // Show results with mock data
      resultsEl.style.display = 'block';
      
      // Update the UI with mock data
      const mockData = {
        score: 7,
        feedback: [
          {section: "Contact Information", comment: "Your contact section lacks a professional email and LinkedIn URL. Use a professional email instead of a personal one."},
          {section: "Summary", comment: "Your summary is too generic and doesn't highlight your unique value proposition."},
          {section: "Experience", comment: "Your experience bullets focus too much on responsibilities rather than achievements. No quantifiable metrics."},
          {section: "Skills", comment: "Your skills section is a boring list without organization or proficiency levels."}
        ],
        improvements: [
          {title: "Add Metrics", description: "Include specific numbers and percentages to quantify your achievements."},
          {title: "Use Action Verbs", description: "Start bullet points with strong action verbs like 'Implemented' or 'Developed'."},
          {title: "Customize for Job Descriptions", description: "Tailor your resume for specific job postings by incorporating relevant keywords."}
        ]
      };
      
      updateResults(mockData);
      
      // Scroll to results
      resultsEl.scrollIntoView({behavior: 'smooth'});
    }, 2000);
    
    /*
    // This would be the actual API call to Vercel
    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('brutalMode', document.getElementById('brutalMode').checked);
    formData.append('improveSuggestions', document.getElementById('improveSuggestions').checked);
    formData.append('professionalRewrite', document.getElementById('professionalRewrite').checked);
    
    fetch('https://partime-landing-page-phi-three.vercel.app/api/roast', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      loadingEl.style.display = 'none';
      resultsEl.style.display = 'block';
      updateResults(data);
      resultsEl.scrollIntoView({behavior: 'smooth'});
    })
    .catch(error => {
      console.error("Error:", error);
      loadingEl.style.display = 'none';
      alert('Error processing resume. Please try again.');
    });
    */
  });
  
  // Function to update the results UI
  function updateResults(data) {
    // Update score
    document.getElementById('resumeScore').textContent = data.score;
    
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
    
    document.getElementById('scoreVerdict').textContent = verdict;
    
    // Update feedback
    const brutalFeedback = document.getElementById('brutalFeedback');
    brutalFeedback.innerHTML = '';
    
    data.feedback.forEach(item => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${item.section}:</strong> ${item.comment}`;
      brutalFeedback.appendChild(p);
    });
    
    // Update improvements
    const improvementAreas = document.getElementById('improvementAreas');
    improvementAreas.innerHTML = '';
    
    if (data.improvements && data.improvements.length) {
      data.improvements.forEach(item => {
        const div = document.createElement('div');
        div.innerHTML = `
          <h5>${item.title}</h5>
          <p>${item.description}</p>
        `;
        improvementAreas.appendChild(div);
      });
    } else {
      improvementAreas.innerHTML = '<p>No specific improvement suggestions available.</p>';
    }
  }
  
  // Handle download report button
  const downloadBtn = document.getElementById('downloadReport');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      alert('Download feature would be implemented here.');
    });
  }
  
  // Handle request rewrite button
  const rewriteBtn = document.getElementById('requestRewrite');
  if (rewriteBtn) {
    rewriteBtn.addEventListener('click', function() {
      if (document.getElementById('professionalRewrite').checked) {
        alert('This would navigate to a payment page.');
      } else {
        alert('Please select the "Request professional rewrite" option first.');
      }
    });
  }
  
  console.log("Roaster.js initialization complete");
});
