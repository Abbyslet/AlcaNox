# AlcaNox

Sitio web estático bilingüe de AlcaNox, disponible en español e inglés.

## Uso rápido

1. Descargue el repositorio con **Code > Download ZIP** y extraiga su contenido.
2. Abra la carpeta con su editor o servidor web favorito.
3. Para una vista local, desde esta carpeta ejecute:

```powershell
py -m http.server 8080
```

Luego visite `http://localhost:8080`. La portada redirige automáticamente a `/es/` o `/en/` según el idioma del navegador; también recuerda la selección manual.

## Publicación

El sitio no requiere compilación. Para Hostinger u otro servidor Apache, suba el contenido de esta carpeta directamente al directorio público del dominio (por ejemplo, `public_html`), incluyendo `.htaccess`.

## Estructura

- `es/`: páginas en español.
- `en/`: páginas en inglés.
- `assets/`: imágenes, logos y recursos visuales.
- Archivos CSS y JavaScript en la raíz: estilos y comportamiento compartidos.
- `.htaccess`: redirección por idioma, compresión y políticas de caché para Apache.

No se incluyen paquetes de despliegue duplicados, cachés ni el sitio independiente LeensFish.
