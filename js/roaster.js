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
