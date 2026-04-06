const fs = require('fs');
const path = require('path');

const map = {
    '/products': '/productos',
    '/story': '/historia',
    '/contact': '/contacto',
    '/account': '/cuenta',
    '/login': '/ingresar',
    '/register': '/registro',
    '/shipping': '/envios',
    '/terms': '/terminos',
    '/privacy': '/privacidad',
    '/faq': '/preguntas-frecuentes',
    '/checkout/success': '/finalizar-compra/exito',
    '/checkout': '/finalizar-compra'
};

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            for (const [oldPath, newPath] of Object.entries(map)) {
                content = content.replaceAll("'" + oldPath + "'", "'" + newPath + "'");
                content = content.replaceAll('"' + oldPath + '"', '"' + newPath + '"');
                content = content.replaceAll('`' + oldPath + '`', '`' + newPath + '`');
                
                content = content.replaceAll("'" + oldPath + "/", "'" + newPath + "/");
                content = content.replaceAll('"' + oldPath + '/', '"' + newPath + '/');
                content = content.replaceAll('`' + oldPath + '/', '`' + newPath + '/');
                
                content = content.replaceAll("`" + oldPath + "${", "`" + newPath + "${");
            }

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated: ' + fullPath);
            }
        }
    }
}

processDirectory('./src');
