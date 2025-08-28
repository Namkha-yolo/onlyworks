// AI Productivity Tracker - Vanilla JavaScript Implementation
class ProductivityTracker {
    constructor() {
      this.isRecording = false;
      this.sessionTime = 0;
      this.screenshots = [];
      this.currentGoal = 'Complete project documentation';
      this.apiKey = '';
      this.isApiKeySet = false;
      this.useServerKey = false;
      this.analysisLog = [];
      this.captureStats = { clicks: 0, keystrokes: 0, windowChanges: 0 };
      this.progressData = { goalCompletion: 0, efficiency: 0 };
      
      // Tracking variables
      this.intervalRef = null;
      this.streamRef = null;
      this.keystrokeCountRef = 0;
      this.isAnalyzing = false;
      
      this.init();
    }
  
    init() {
      // Show API key setup modal
      this.showApiKeyModal();
      
      // Set up event listeners
      this.setupEventListeners();
    }
  
    showApiKeyModal() {
      document.getElementById('apiKeyModal').style.display = 'flex';
    }
  
    hideApiKeyModal() {
      document.getElementById('apiKeyModal').style.display = 'none';
      document.getElementById('trackerInterface').style.display = 'block';
    }
  
    setupEventListeners() {
      // Goal input
      const goalInput = document.getElementById('goalInput');
      if (goalInput) {
        goalInput.addEventListener('change', (e) => {
          this.currentGoal = e.target.value;
        });
      }
  
      // Recording event listeners (set up when recording starts)
      this.setupRecordingListeners();
    }
  
    setupRecordingListeners() {
      if (this.isRecording && this.streamRef) {
        // Periodic screenshots
        this.periodicCapture = setInterval(() => {
          this.triggerScreenshot('periodic');
        }, 30000);
  
        // Click tracking
        this.handleClick = (e) => {
          this.captureStats.clicks++;
          this.updateStatsDisplay();
          this.triggerScreenshot('click');
        };
  
        // Keystroke tracking
        this.handleKeydown = (e) => {
          const isCharacterKey = e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey;
          const isAllowedKey = ['Backspace', 'Delete', 'Enter', 'Tab', 'Space'].includes(e.key);
          
          if (isCharacterKey || isAllowedKey) {
            this.keystrokeCountRef++;
            this.captureStats.keystrokes++;
            this.updateStatsDisplay();
            
            if (this.keystrokeCountRef >= 20) {
              this.keystrokeCountRef = 0;
              this.triggerScreenshot('keystrokes');
            }
          }
        };
  
        // Focus tracking
        this.handleWindowFocus = () => {
          this.captureStats.windowChanges++;
          this.updateStatsDisplay();
          this.triggerScreenshot('focus_return');
        };
  
        this.handleWindowBlur = () => {
          this.captureStats.windowChanges++;
          this.updateStatsDisplay();
          this.triggerScreenshot('focus_leave');
        };
  
        // Add listeners
        document.addEventListener('click', this.handleClick, true);
        document.addEventListener('keydown', this.handleKeydown, true);
        window.addEventListener('focus', this.handleWindowFocus);
        window.addEventListener('blur', this.handleWindowBlur);
      }
    }
  
    removeRecordingListeners() {
      if (this.periodicCapture) {
        clearInterval(this.periodicCapture);
      }
  
      document.removeEventListener('click', this.handleClick, true);
      document.removeEventListener('keydown', this.handleKeydown, true);
      window.removeEventListener('focus', this.handleWindowFocus);
      window.removeEventListener('blur', this.handleWindowBlur);
    }
  
    async startScreenShare() {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            mediaSource: 'screen',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 2 }
          },
          audio: false
        });
        
        this.streamRef = stream;
        
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          this.stopRecording();
        });
  
        return true;
      } catch (error) {
        console.error('Screen sharing failed:', error);
        alert('Screen sharing permission required for progress tracking');
        return false;
      }
    }
  
    async toggleRecording() {
      if (!this.isApiKeySet) {
        alert('Please set your OpenAI API key first');
        return;
      }
  
      if (!this.useServerKey && (!this.apiKey || !this.apiKey.trim().startsWith('sk-'))) {
        alert('Please enter a valid OpenAI API key or use the server key option');
        return;
      }
  
      if (this.isRecording) {
        this.stopRecording();
      } else {
        await this.startRecording();
      }
    }
  
    async startRecording() {
      const screenShareStarted = await this.startScreenShare();
      if (screenShareStarted) {
        this.isRecording = true;
        this.sessionTime = 0;
        this.screenshots = [];
        this.analysisLog = [];
        this.captureStats = { clicks: 0, keystrokes: 0, windowChanges: 0 };
        this.keystrokeCountRef = 0;
  
        // Update UI
        this.updateRecordingUI();
        this.setupRecordingListeners();
        
        // Start timer
        this.intervalRef = setInterval(() => {
          this.sessionTime++;
          this.updateSessionTimer();
        }, 1000);
      }
    }
  
    stopRecording() {
      this.isRecording = false;
      
      if (this.streamRef) {
        this.streamRef.getTracks().forEach(track => track.stop());
      }
      
      if (this.intervalRef) {
        clearInterval(this.intervalRef);
      }
  
      this.removeRecordingListeners();
      this.updateRecordingUI();
      this.endSession();
    }
  
    updateRecordingUI() {
      const recordButton = document.getElementById('recordButton');
      const captureStats = document.getElementById('captureStats');
      const analysisSection = document.getElementById('analysisSection');
      const progressSection = document.getElementById('progressSection');
  
      if (this.isRecording) {
        recordButton.innerHTML = '<i class="fas fa-stop"></i> Stop AI Session';
        recordButton.className = 'btn btn-error btn-lg';
        captureStats.style.display = 'grid';
        analysisSection.style.display = 'block';
        progressSection.style.display = 'block';
      } else {
        recordButton.innerHTML = '<i class="fas fa-play"></i> Start AI Session';
        recordButton.className = 'btn btn-primary btn-lg';
        captureStats.style.display = 'none';
      }
    }
  
    updateSessionTimer() {
      const mins = Math.floor(this.sessionTime / 60);
      const secs = this.sessionTime % 60;
      const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      document.getElementById('sessionTime').textContent = timeString;
    }
  
    updateStatsDisplay() {
      document.getElementById('clickCount').textContent = this.captureStats.clicks;
      document.getElementById('keystrokeCount').textContent = this.captureStats.keystrokes;
      document.getElementById('windowChanges').textContent = this.captureStats.windowChanges;
      document.getElementById('screenshotCount').textContent = this.screenshots.length;
    }
  
    async triggerScreenshot(trigger) {
      if (!this.streamRef || this.isAnalyzing) return;
      
      try {
        const canvas = document.createElement('canvas');
        const video = document.createElement('video');
        video.srcObject = this.streamRef;
        
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
          video.play();
        });
  
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const blob = await new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.9);
        });
        
        const timestamp = new Date().toLocaleTimeString();
        const imageUrl = URL.createObjectURL(blob);
        
        const newScreenshot = {
          id: Date.now(),
          timestamp,
          url: imageUrl,
          blob: blob,
          trigger: trigger,
          analyzed: false
        };
        
        this.screenshots.push(newScreenshot);
        this.updateStatsDisplay();
        this.updateGallery();
        
        if (this.isApiKeySet) {
          await this.analyzeScreenshotWithAI(newScreenshot);
        }
          
      } catch (error) {
        console.error('Screenshot capture failed:', error);
        this.addAnalysisLogEntry({
          timestamp: new Date().toLocaleTimeString(),
          trigger: trigger,
          productivity: 0,
          activity: 'Capture Failed',
          insights: ['Screenshot capture failed: ' + error.message],
          error: error.message
        });
      }
    }
  
    async analyzeScreenshotWithAI(screenshot) {
      if (this.isAnalyzing) return;
      
      this.isAnalyzing = true;
      this.showAnalysisStatus();
  
      try {
        const base64 = await this.blobToBase64(screenshot.blob);
        const analysis = await this.callOpenAIVision(base64, this.currentGoal);
        
        // Update screenshot with analysis
        screenshot.analyzed = true;
        screenshot.aiAnalysis = analysis;
        
        this.addAnalysisLogEntry({
          timestamp: screenshot.timestamp,
          trigger: screenshot.trigger,
          productivity: analysis.productivityScore,
          activity: analysis.activity,
          insights: analysis.insights,
          fullAnalysis: analysis
        });
  
        this.updateProgressMetrics(analysis);
  
      } catch (error) {
        console.error('AI analysis failed:', error);
        
        this.addAnalysisLogEntry({
          timestamp: screenshot.timestamp,
          trigger: screenshot.trigger,
          productivity: 0,
          activity: 'Analysis Failed',
          insights: ['AI analysis failed: ' + error.message],
          error: error.message
        });
      } finally {
        this.isAnalyzing = false;
        this.hideAnalysisStatus();
      }
    }
  
    async callOpenAIVision(base64Image, goal) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [{
              type: 'text',
              text: `Analyze this work session screenshot. The user's goal is: "${goal}". 
              
              Please provide analysis in this exact JSON format:
              {
                "productivityScore": <number 0-100>,
                "activity": "<activity type>",
                "insights": ["<insight 1>", "<insight 2>"],
                "focusLevel": <number 0-100>,
                "goalAlignment": <number 0-100>,
                "recommendations": ["<recommendation 1>", "<recommendation 2>"]
              }`
            }, {
              type: 'image_url',
              image_url: { url: base64Image }
            }]
          }],
          max_tokens: 500
        })
      });
  
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
  
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
      }
      
      // Fallback parsing
      return this.parseAIResponse(content);
    }
  
    parseAIResponse(content) {
      return {
        productivityScore: this.extractNumber(content, 'productivity') || 50,
        activity: this.extractActivity(content) || 'General Work',
        insights: this.extractInsights(content) || ['AI analysis completed'],
        focusLevel: this.extractNumber(content, 'focus') || 50,
        goalAlignment: this.extractNumber(content, 'goal') || 50,
        recommendations: this.extractRecommendations(content) || []
      };
    }
  
    extractNumber(text, keyword) {
      const regex = new RegExp(`${keyword}[:\\s]*([0-9]{1,3})`, 'i');
      const match = text.match(regex);
      return match ? parseInt(match[1]) : null;
    }
  
    extractActivity(text) {
      const activities = ['coding', 'writing', 'research', 'communication', 'design', 'planning'];
      const found = activities.find(activity => text.toLowerCase().includes(activity));
      return found ? found.charAt(0).toUpperCase() + found.slice(1) : 'General Work';
    }
  
    extractInsights(text) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      return sentences.slice(0, 3).map(s => s.trim());
    }
  
    extractRecommendations(text) {
      const sentences = text.split(/[.!?]+/).filter(s => 
        s.toLowerCase().includes('recommend') || 
        s.toLowerCase().includes('suggest') ||
        s.toLowerCase().includes('should')
      );
      return sentences.slice(0, 2).map(s => s.trim());
    }
  
    blobToBase64(blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  
    addAnalysisLogEntry(entry) {
      this.analysisLog.push(entry);
      this.updateAnalysisFeed();
    }
  
    updateAnalysisFeed() {
      const feed = document.getElementById('analysisFeed');
      const recent = this.analysisLog.slice(-5);
      
      feed.innerHTML = recent.map(log => `
        <div class="analysis-entry">
          <div class="analysis-header">
            <span class="activity">${log.activity}</span>
            <span class="trigger-badge">${log.trigger}</span>
            <span class="productivity-score ${this.getScoreClass(log.productivity)}">
              ${log.productivity}%
            </span>
          </div>
          <div class="analysis-insights">
            ${log.insights && log.insights.length > 0 ? log.insights[0] : 'No insights available'}
          </div>
          <div class="analysis-time">
            <i class="fas fa-clock"></i> ${log.timestamp}
          </div>
        </div>
      `).join('');
    }
  
    getScoreClass(score) {
      if (score > 80) return 'score-high';
      if (score > 60) return 'score-medium';
      return 'score-low';
    }
  
    updateProgressMetrics(analysis) {
      this.progressData.goalCompletion = analysis.goalAlignment;
      this.progressData.efficiency = analysis.productivityScore;
  
      document.getElementById('goalProgress').style.width = `${this.progressData.goalCompletion}%`;
      document.getElementById('goalProgressText').textContent = `${this.progressData.goalCompletion}%`;
      
      document.getElementById('efficiencyProgress').style.width = `${this.progressData.efficiency}%`;
      document.getElementById('efficiencyProgressText').textContent = `${this.progressData.efficiency}%`;
    }
  
    updateGallery() {
      const gallery = document.getElementById('screenshotGallery');
      const gallerySection = document.getElementById('gallerySection');
      
      if (this.screenshots.length > 0) {
        gallerySection.style.display = 'block';
        
        gallery.innerHTML = this.screenshots.slice(-12).map(screenshot => `
          <div class="screenshot-item">
            <img src="${screenshot.url}" alt="AI Screenshot" />
            <div class="screenshot-overlay">
              <div class="screenshot-trigger">${screenshot.trigger}</div>
              <div class="screenshot-time">${screenshot.timestamp}</div>
              ${screenshot.aiAnalysis ? 
                `<div class="screenshot-score ${this.getScoreClass(screenshot.aiAnalysis.productivityScore)}">
                  ${screenshot.aiAnalysis.productivityScore}%
                </div>` : 
                '<div class="screenshot-analyzing">Analyzing...</div>'
              }
            </div>
          </div>
        `).join('');
      }
    }
  
    showAnalysisStatus() {
      document.getElementById('analysisStatus').style.display = 'block';
    }
  
    hideAnalysisStatus() {
      document.getElementById('analysisStatus').style.display = 'none';
    }
  
    endSession() {
      console.log('Session ended:', {
        duration: this.sessionTime,
        screenshots: this.screenshots.length,
        goal: this.currentGoal,
        stats: this.captureStats
      });
    }
  }
  
  // Global functions for HTML onclick handlers
  function setApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    if (apiKey.startsWith('sk-')) {
      tracker.apiKey = apiKey;
      tracker.isApiKeySet = true;
      tracker.useServerKey = false;
      tracker.hideApiKeyModal();
    } else {
      alert('Please enter a valid OpenAI API key (starts with sk-)');
    }
  }
  
  function useServerKey() {
    tracker.isApiKeySet = true;
    tracker.useServerKey = true;
    tracker.hideApiKeyModal();
  }
  
  function toggleRecording() {
    tracker.toggleRecording();
  }
  
  // Initialize tracker when page loads
  let tracker;
  document.addEventListener('DOMContentLoaded', () => {
    tracker = new ProductivityTracker();
  });