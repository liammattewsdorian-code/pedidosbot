const bcrypt = require('bcryptjs');

// Reemplaza 'tu_clave_aqui' por la contraseña que quieras usar para entrar
const password = 'tu_clave_aqui'; 

const hash = bcrypt.hashSync(password, 10);

console.log('\n--------------------------------------------------');
console.log('COPIA ESTE HASH PARA PRISMA STUDIO:');
console.log(hash);
console.log('--------------------------------------------------\n');