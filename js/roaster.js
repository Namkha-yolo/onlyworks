/**
 * Resume Roaster - Front-end logic
 * Handles file uploads, UI interactions, and communication with the backend
 */

document.addEventListener('DOMContentLoaded', function() {
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
  
  // State
  let selectedFile = null;
  let roastData = null;
  
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
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
      handleFiles(files);
    }
  }
  
  // Handle file selection via input
  resumeUpload.addEventListener('change', function(e) {
    if (this.files.length) {
      handleFiles(this.files);
    }
  });
  
  function handleFiles(files) {
    const file = files[0];
    const fileType = file.type;
    
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
        <button id="changeFile" class="upload-btn">Change File</button>
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
      <label for="resumeUpload" class="upload-btn">Browse Files</label>
      <input type="file" id="resumeUpload" accept=".pdf,.doc,.docx" hidden>
      <p class="file-types">Supported formats: PDF, DOC, DOCX</p>
    `;
    
    // Re-attach event listener to the new input
    document.getElementById('resumeUpload').addEventListener('change', function(e) {
      if (this.files.length) {
        handleFiles(this.files);
      }
    });
  }
  
  // Handle roast button click
  roastBtn.addEventListener('click', function() {
    if (!selectedFile) return;
    
    // Show loading
    loadingRoast.style.display = 'block';
    roastResults.style.display = 'none';
    
    // Prepare form data
    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('brutalMode', brutalMode.checked);
    formData.append('improveSuggestions', improveSuggestions.checked);
    formData.append('professionalRewrite', professionalRewrite.checked);
    
    // Send to backend
    fetch('/roast', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
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
      console.error('Error:', error);
      loadingRoast.style.display = 'none';
      alert('Something went wrong. Please try again later.');
    });
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
      // Navigate to payment page
      window.location.href = '/professional-rewrite-payment.html';
    } else {
      // Show modal to select professional rewrite option
      alert('Please select the "Request professional rewrite" option and try again.');
      
      // Scroll back to options
      document.querySelector('.resume-options').scrollIntoView({ behavior: 'smooth' });
      
      // Highlight the option
      professionalRewrite.parentElement.classList.add('highlight');
      setTimeout(() => {
        professionalRewrite.parentElement.classList.remove('highlight');
      }, 3000);
    }
  });
});
