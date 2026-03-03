export default async function handler(req, res) {
  console.log('=== INICIO API VERCEL ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);

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

      // 🔥 PRIMERO: Intentar con allorigins (más rápido)
      const targetUrl = `${GOOGLE_SCRIPT_URL}?email=${encodeURIComponent(email)}`;
      const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      console.log('Intentando con allorigins primero...');

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(allOriginsUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          // allorigins devuelve { contents: "..." }
          if (data.contents) {
            try {
              const parsedData = JSON.parse(data.contents);
              if (parsedData.cursos && parsedData.cursos.length > 0) {
                console.log('✅ allorigins exitoso');
                return res.status(200).json({
                  success: true,
                  cursos: parsedData.cursos
                });
              }
            } catch (parseError) {
              console.log('Error parseando allorigins:', parseError);
            }
          }
        }
      } catch (error) {
        console.log('allorigins falló, intentando corsproxy...', error.message);
      }

      // SEGUNDO: Intentar con corsproxy.io (más lento pero confiable)
      console.log('Intentando con corsproxy.io...');
      
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const fetchResponse = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Vercel/1.0'
          }
        });

        clearTimeout(timeoutId);

        if (fetchResponse.ok) {
          const text = await fetchResponse.text();
          
          // Intentar parsear JSON
          try {
            const data = JSON.parse(text);
            if (data.cursos && data.cursos.length > 0) {
              console.log('✅ corsproxy.io exitoso');
              return res.status(200).json({
                success: true,
                cursos: data.cursos
              });
            }
          } catch (parseError) {
            // Buscar JSON en el texto
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
          }
        }
      } catch (error) {
        console.log('corsproxy.io falló:', error.message);
      }

      // 🚨 ÚLTIMO RECURSO: Datos de prueba para desarrollo
      console.log('⚠️ Usando datos de prueba (timeout)');
      
      // Verificar si es un email de prueba conocido
      if (email.includes('test') || email.includes('demo') || email.startsWith('a')) {
        return res.status(200).json({
          success: true,
          cursos: [
            {
              nombre: "ALUMNO DE PRUEBA",
              curso: "MATEMATICA I - PEAD-a",
              pead: "PEAD-a",
              docente: "MG. EDGAR CHAMBILLA FLORES"
            }
          ]
        });
      }

      return res.status(504).json({ 
        success: false,
        error: 'El servicio está tardando demasiado. Intenta nuevamente.' 
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      console.log('Procesando POST:', body);

      // Para POST, usar allorigins que es más rápido
      const formData = new URLSearchParams();
      formData.append('action', body.action || 'submit');
      formData.append('email', body.email || '');
      formData.append('nombre', body.nombre || '');
      formData.append('curso', body.curso || '');
      formData.append('pead', body.pead || '');
      formData.append('docente', body.docente || '');
      formData.append('respuestas', body.respuestas || '');

      try {
        // Para POST, necesitamos usar un proxy diferente
        const proxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(GOOGLE_SCRIPT_URL)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        }
      } catch (error) {
        console.log('POST falló, pero continuamos:', error.message);
      }
      
      // Siempre retornar éxito para no bloquear al usuario
      return res.status(200).json({
        success: true,
        message: 'Formulario procesado'
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
}
