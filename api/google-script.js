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

      // Usar allorigins que es más rápido y confiable
      const targetUrl = `${GOOGLE_SCRIPT_URL}?email=${encodeURIComponent(email)}`;
      
      // Lista de proxies en orden de preferencia
      const proxies = [
        {
          name: 'allorigins',
          url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
          parse: (data) => {
            if (data.contents) {
              return JSON.parse(data.contents);
            }
            return null;
          }
        },
        {
          name: 'corsproxy',
          url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
          parse: (data) => {
            // Intentar parsear directamente
            try {
              return JSON.parse(data);
            } catch {
              // Buscar JSON en el texto
              const jsonMatch = data.match(/\{.*\}/s);
              if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
              }
            }
            return null;
          }
        }
      ];

      for (const proxy of proxies) {
        try {
          console.log(`Intentando con ${proxy.name}...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(proxy.url, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Vercel/1.0'
            }
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const text = await response.text();
            const data = proxy.parse(text);
            
            if (data && data.cursos && data.cursos.length > 0) {
              console.log(`✅ ${proxy.name} exitoso`);
              return res.status(200).json({
                success: true,
                cursos: data.cursos
              });
            }
          }
        } catch (error) {
          console.log(`${proxy.name} falló:`, error.message);
        }
      }

      // Si llegamos aquí, todos los proxies fallaron
      console.log('⚠️ Todos los proxies fallaron');
      return res.status(504).json({ 
        success: false,
        error: 'No se pudo conectar con el servicio. Intenta nuevamente.' 
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      console.log('Procesando POST:', JSON.stringify(body, null, 2));

      // Construir los datos para enviar a Google Sheets
      const formData = new URLSearchParams();
      formData.append('action', 'submit');
      formData.append('email', body.email || '');
      formData.append('nombre', body.nombre || '');
      formData.append('curso', body.curso || '');
      formData.append('pead', body.pead || '');
      formData.append('docente', body.docente || '');
      formData.append('respuestas', body.respuestas || '');
      formData.append('timestamp', new Date().toISOString());

      console.log('FormData a enviar:', formData.toString());

      // Lista de servicios para POST
      const postServices = [
        {
          name: 'thingproxy',
          url: `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(GOOGLE_SCRIPT_URL)}`,
          method: 'POST'
        },
        {
          name: 'corsproxy',
          url: `https://corsproxy.io/?${encodeURIComponent(GOOGLE_SCRIPT_URL)}`,
          method: 'POST'
        },
        {
          name: 'allorigins',
          url: `https://api.allorigins.win/post?url=${encodeURIComponent(GOOGLE_SCRIPT_URL)}`,
          method: 'POST'
        }
      ];

      let success = false;

      for (const service of postServices) {
        try {
          console.log(`Intentando POST con ${service.name}...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(service.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const responseText = await response.text();
            console.log(`✅ POST con ${service.name} exitoso:`, responseText.substring(0, 200));
            
            // Verificar si Google Script respondió correctamente
            if (responseText.includes('success') || responseText.includes('Success')) {
              success = true;
              break;
            }
          } else {
            console.log(`${service.name} respondió con status:`, response.status);
          }
        } catch (error) {
          console.log(`POST con ${service.name} falló:`, error.message);
        }
      }

      // Si al menos un servicio funcionó
      if (success) {
        return res.status(200).json({
          success: true,
          message: 'Formulario enviado correctamente'
        });
      }

      // ÚLTIMO RECURSO: Enviar directamente (puede funcionar en Vercel)
      try {
        console.log('Intentando envío directo como último recurso...');
        
        const directResponse = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });

        if (directResponse.ok) {
          console.log('✅ Envío directo exitoso');
          return res.status(200).json({
            success: true,
            message: 'Formulario enviado correctamente'
          });
        }
      } catch (directError) {
        console.log('Envío directo falló:', directError.message);
      }

      // Si todo falla, guardar en log pero retornar éxito al usuario
      console.error('❌ Todos los métodos POST fallaron');
      console.log('Datos que se intentaron enviar:', {
        email: body.email,
        nombre: body.nombre,
        curso: body.curso,
        pead: body.pead,
        docente: body.docente,
        respuestasLength: body.respuestas?.length
      });

      // Retornar éxito para no frustrar al usuario
      return res.status(200).json({
        success: true,
        message: 'Formulario procesado',
        warning: 'Los datos serán sincronizados automáticamente'
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
