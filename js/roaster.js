// Modify your roastBtn event listener in roaster.js:

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
  
  /* COMMENT OUT OR REMOVE THIS MOCK DATA SECTION
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
  */
  
  // UNCOMMENT AND USE THIS SECTION INSTEAD
  
  // This is the actual API call to Vercel
  const formData = new FormData();
  formData.append('resume', selectedFile);
  formData.append('brutalMode', document.getElementById('brutalMode').checked);
  formData.append('improveSuggestions', document.getElementById('improveSuggestions').checked);
  formData.append('professionalRewrite', document.getElementById('professionalRewrite').checked);
  
  // Make sure this URL is correct - it should be your Vercel API endpoint
  fetch('https://partime-landing-page-phi-three.vercel.app/api/roast', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    console.log("API Response:", response);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("API Data:", data);
    loadingEl.style.display = 'none';
    resultsEl.style.display = 'block';
    updateResults(data);
    resultsEl.scrollIntoView({behavior: 'smooth'});
  })
  .catch(error => {
    console.error("Error:", error);
    loadingEl.style.display = 'none';
    alert('Error processing resume: ' + error.message + '. Please try again.');
  });
});
