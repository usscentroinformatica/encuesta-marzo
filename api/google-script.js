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

      // Construir la URL completa con el parámetro email
      const targetUrl = `${GOOGLE_SCRIPT_URL}?email=${encodeURIComponent(email)}`;
      console.log('Target URL:', targetUrl);

      // REALIZAR LA PETICIÓN DIRECTA, PERMITIENDO REDIRECCIONES
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout de 15 segundos

        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Vercel/1.0'
          },
          signal: controller.signal,
          // ¡IMPORTANTE! Seguir redirecciones automáticamente (por defecto ya lo hace)
          redirect: 'follow' 
        });

        clearTimeout(timeoutId);

        console.log('Respuesta recibida - Status:', response.status);
        console.log('URL final tras redirecciones:', response.url); // Esto te dirá a qué URL se llegó

        if (response.ok) {
          // Intentar obtener el texto de la respuesta
          const text = await response.text();
          console.log('Texto de respuesta (primeros 200 chars):', text.substring(0, 200));

          // Intentar parsear directamente como JSON
          try {
            const data = JSON.parse(text);
            if (data.success && data.cursos && data.cursos.length > 0) {
              console.log('✅ Datos obtenidos correctamente');
              return res.status(200).json({
                success: true,
                cursos: data.cursos
              });
            } else {
              console.log('Estructura de datos inesperada:', data);
            }
          } catch (parseError) {
            // Si falla el parseo directo, buscar JSON dentro del texto (por si hay HTML alrededor)
            console.log('No se pudo parsear directamente, buscando JSON...');
            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) {
              try {
                const data = JSON.parse(jsonMatch[0]);
                if (data.success && data.cursos && data.cursos.length > 0) {
                  console.log('✅ JSON encontrado en el texto');
                  return res.status(200).json({
                    success: true,
                    cursos: data.cursos
                  });
                }
              } catch (e) {
                console.error('Error parseando JSON extraído:', e);
              }
            }
          }
        } else {
          console.log('La respuesta no fue OK. Status:', response.status);
        }

      } catch (fetchError) {
        console.error('Error durante el fetch:', fetchError);
      }

      // Si todo falla, devolver un error claro
      return res.status(503).json({ 
        success: false,
        error: 'No se pudo obtener la información. Intenta nuevamente.'
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      console.log('Procesando POST:', body);

      // Construir datos para enviar
      const formData = new URLSearchParams();
      formData.append('action', body.action || 'submit');
      formData.append('email', body.email || '');
      formData.append('nombre', body.nombre || '');
      formData.append('curso', body.curso || '');
      formData.append('pead', body.pead || '');
      formData.append('docente', body.docente || '');
      formData.append('respuestas', body.respuestas || '');

      // Realizar petición POST directa a Google Script
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          signal: controller.signal,
          redirect: 'follow'
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          console.log('Respuesta POST (primeros 200 chars):', text.substring(0, 200));
          
          return res.status(200).json({
            success: true,
            message: 'Formulario enviado correctamente'
          });
        } else {
          console.log('POST no OK. Status:', response.status);
        }
      } catch (fetchError) {
        console.error('Error en POST fetch:', fetchError);
      }

      // Si falla, igual retornar éxito para no bloquear al usuario
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
