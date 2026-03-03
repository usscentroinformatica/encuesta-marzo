// api/google-script.js
export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwY2H2_5-mlbnpSE95trOmkpvgWHu--olFGQoEtSd1onp9eyDP1gfKFAHbRGcVMdz2u/exec";
  
  try {
    let url = GOOGLE_SCRIPT_URL;
    let options = { method: req.method };
    
    // GET para login
    if (req.method === 'GET') {
      if (req.query.email) {
        url += `?email=${encodeURIComponent(req.query.email)}`;
      }
    }
    
    // POST para enviar formulario
    if (req.method === 'POST') {
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(req.body)) {
        formData.append(key, value);
      }
      
      options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      options.body = formData.toString();
    }
    
    console.log('Enviando a Google Script:', url);
    const response = await fetch(url, options);
    const text = await response.text();
    
    try {
      const jsonData = JSON.parse(text);
      return res.status(200).json({
        success: true,
        data: jsonData
      });
    } catch {
      return res.status(200).json({
        success: true,
        data: { text: text }
      });
    }
    
  } catch (error) {
    console.error('Error en función:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
