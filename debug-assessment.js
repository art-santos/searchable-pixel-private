// Debug script to check assessment status and manually refresh UI
// Run this in your browser console when the UI is stuck

const DEBUG_ASSESSMENT_ID = 'cca2e9e0-4af3-46cf-8921-9cbb20e74e04';

async function debugAssessmentStatus() {
  console.log('🔍 Debugging assessment status...');
  
  try {
    // Check status endpoint
    const statusResponse = await fetch(`/api/max-visibility/assessments/${DEBUG_ASSESSMENT_ID}/status`);
    const statusData = await statusResponse.json();
    
    console.log('📊 Status API Response:', statusData);
    
    // Check if it's completed
    if (statusData.success && statusData.data?.status === 'completed') {
      console.log('✅ Assessment is completed! Forcing UI refresh...');
      
      // Force refresh the visibility data
      const dataResponse = await fetch('/api/max-visibility/data');
      const dataResult = await dataResponse.json();
      
      console.log('📈 Data API Response:', dataResult);
      
      if (dataResult.success && dataResult.data) {
        console.log('🎉 Data successfully loaded! The UI should now update.');
        console.log('Score:', dataResult.data.overallScore);
        console.log('Competitors:', dataResult.data.competitors?.length || 0);
        
        // You can now refresh the page or trigger a state update
        window.location.reload();
      } else {
        console.log('❌ Data loading failed:', dataResult.error);
      }
    } else {
      console.log('⏳ Assessment still running or failed:', statusData.data?.status);
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
}

// Auto-run the debug
debugAssessmentStatus();

console.log(`
🛠️ Assessment Debug Tool Loaded
Run: debugAssessmentStatus()
Assessment ID: ${DEBUG_ASSESSMENT_ID}
`); 