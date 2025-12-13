/**
 * Script para generar un JWT_SECRET seguro
 * 
 * Ejecutar: cd server && node scripts/generateSecret.js
 * 
 * Este script genera un secret de 64 bytes (512 bits) que es
 * criptográficamente seguro para firmar tokens JWT.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const secret = crypto.randomBytes(64).toString('hex');
const envPath = path.join(__dirname, '../.env');

console.log('\n🔐 GENERADOR DE JWT_SECRET SEGURO');
console.log('='.repeat(50));
console.log('\n✅ Secret generado (128 caracteres, 512 bits):');
console.log('\n' + '-'.repeat(50));
console.log(`JWT_SECRET=${secret}`);
console.log('-'.repeat(50));

console.log('\n📋 INSTRUCCIONES:');
console.log('1. Copia la línea JWT_SECRET de arriba');
console.log('2. Abre el archivo server/.env');
console.log('3. Reemplaza o agrega la línea JWT_SECRET');
console.log('4. Reinicia el servidor');

console.log('\n⚠️  IMPORTANTE:');
console.log('- Nunca compartas este secret');
console.log('- Nunca lo subas a Git');
console.log('- Usa un secret diferente en producción');
console.log('- Si cambias el secret, todos los tokens existentes se invalidan');

// Preguntar si quiere actualizar automáticamente
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\n¿Deseas actualizar .env automáticamente? (s/n): ', (answer) => {
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
        try {
            let envContent = '';

            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');

                // Reemplazar JWT_SECRET existente o agregarlo
                if (envContent.includes('JWT_SECRET=')) {
                    envContent = envContent.replace(
                        /JWT_SECRET=.*/,
                        `JWT_SECRET=${secret}`
                    );
                } else {
                    envContent += `\nJWT_SECRET=${secret}`;
                }

                // Agregar JWT_EXPIRES_IN si no existe
                if (!envContent.includes('JWT_EXPIRES_IN=')) {
                    envContent += '\nJWT_EXPIRES_IN=7d';
                }
            } else {
                envContent = `JWT_SECRET=${secret}\nJWT_EXPIRES_IN=7d`;
            }

            fs.writeFileSync(envPath, envContent);
            console.log('\n✅ .env actualizado correctamente!');
            console.log('   Reinicia el servidor para aplicar cambios.');
        } catch (error) {
            console.error('\n❌ Error al actualizar .env:', error.message);
            console.log('   Por favor actualiza manualmente.');
        }
    } else {
        console.log('\n👍 No se realizaron cambios. Actualiza manualmente.');
    }

    rl.close();
});
