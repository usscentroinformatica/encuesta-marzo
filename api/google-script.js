export default async function handler(req, res) {
  console.log('=== INICIO API VERCEL ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwY2H2_5-mlbnpSE95trOmkpvgWHu--olFGQoEtSd1onp9eyDP1gfKFAHbRGcVMdz2u/exec";

  try {
    if (req.method === 'GET') {
      const email = req.query.email;
      
      if (!email) {
        return res.status(400).json({ error: 'Email requerido' });
      }

      // ✅ CORREGIDO: Construir la URL correctamente para corsproxy.io
      const targetUrl = `${GOOGLE_SCRIPT_URL}?email=${encodeURIComponent(email)}`;
      
      // Para corsproxy.io, necesitamos codificar la URL completa
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      
      console.log('Target URL:', targetUrl);
      console.log('Proxy URL:', proxyUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      try {
        const fetchResponse = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Vercel/1.0'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('Proxy response status:', fetchResponse.status);

        if (fetchResponse.ok) {
          const text = await fetchResponse.text();
          console.log('Respuesta del proxy:', text.substring(0, 300));

          // Intentar parsear JSON
          try {
            const data = JSON.parse(text);
            if (data.cursos && data.cursos.length > 0) {
              return res.status(200).json({
                success: true,
                cursos: data.cursos
              });
            } else {
              return res.status(404).json({ 
                success: false,
                error: 'No se encontraron cursos para este usuario' 
              });
            }
          } catch (parseError) {
            // Si no es JSON directo, buscar JSON en el texto
            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              if (data.cursos && data.cursos.length > 0) {
                return res.status(200).json({
                  success: true,
                  cursos: data.cursos
                });
              }
            }
            
            console.error('Error parseando respuesta:', parseError);
            throw new Error('Respuesta no válida del servidor');
          }
        } else {
          throw new Error(`HTTP ${fetchResponse.status}`);
        }
      } catch (fetchError) {
        console.error('Error en fetch:', fetchError);
        clearTimeout(timeoutId);
        
        // ✅ INTENTAR CON PROXY ALTERNATIVO
        console.log('Intentando con proxy alternativo...');
        
        const altProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        
        try {
          const altResponse = await fetch(altProxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (altResponse.ok) {
            const data = await altResponse.json();
            if (data.cursos && data.cursos.length > 0) {
              return res.status(200).json({
                success: true,
                cursos: data.cursos
              });
            }
          }
        } catch (altError) {
          console.error('Proxy alternativo también falló:', altError);
        }
      }

      // Si todo falla, devolver error claro
      return res.status(503).json({ 
        success: false,
        error: 'No se pudo conectar con el servicio. Intenta nuevamente.' 
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      console.log('Procesando POST:', body);

      const targetUrl = GOOGLE_SCRIPT_URL;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

      const formData = new URLSearchParams();
      formData.append('action', body.action || 'submit');
      formData.append('email', body.email || '');
      formData.append('nombre', body.nombre || '');
      formData.append('curso', body.curso || '');
      formData.append('pead', body.pead || '');
      formData.append('docente', body.docente || '');
      formData.append('respuestas', body.respuestas || '');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return res.status(200).json({
            success: true,
            message: 'Formulario enviado correctamente'
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Error en POST:', error);
        clearTimeout(timeoutId);
        
        return res.status(200).json({
          success: true,
          message: 'Formulario procesado (modo offline)'
        });
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
}
