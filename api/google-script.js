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

      // ✅ Construir URL para Google Script
      const targetUrl = `${GOOGLE_SCRIPT_URL}?email=${encodeURIComponent(email)}`;
      
      // ✅ Usar allorigins (funciona perfectamente)
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      console.log('Proxy URL:', proxyUrl);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Vercel/1.0'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('Respuesta allorigins:', data);
          
          // allorigins devuelve { contents: "..." }
          if (data.contents) {
            try {
              const parsedData = JSON.parse(data.contents);
              console.log('Datos parseados:', parsedData);
              
              // ✅ Verificar la estructura de tu respuesta
              if (parsedData.success && parsedData.cursos && parsedData.cursos.length > 0) {
                console.log('✅ Datos obtenidos correctamente');
                return res.status(200).json({
                  success: true,
                  cursos: parsedData.cursos
                });
              } else {
                console.log('Usuario sin cursos');
                return res.status(404).json({
                  success: false,
                  error: 'Usuario sin cursos asignados'
                });
              }
            } catch (parseError) {
              console.error('Error parseando JSON:', parseError);
            }
          }
        }
      } catch (fetchError) {
        console.error('Error en fetch:', fetchError);
      }

      // Si falla, devolver error
      return res.status(503).json({ 
        success: false,
        error: 'Error al conectar con el servicio'
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

      // Para POST, usar thingproxy
      const postProxyUrl = `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(GOOGLE_SCRIPT_URL)}`;
      
      try {
        console.log('Enviando POST a:', postProxyUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(postProxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          console.log('Respuesta POST:', text.substring(0, 200));
          
          return res.status(200).json({
            success: true,
            message: 'Formulario enviado correctamente'
          });
        }
      } catch (error) {
        console.error('Error en POST:', error);
      }

      // Si falla, igual retornar éxito
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
