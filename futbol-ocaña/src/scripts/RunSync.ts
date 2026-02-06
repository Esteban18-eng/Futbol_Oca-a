// runSync.ts
import { syncSchoolLogos, checkLogoStatus } from './syncSchoolLogos';

async function main() {
  console.clear();
  console.log('🎮 EJECUTOR DE SINCRONIZACIÓN DE LOGOS');
  console.log('======================================\n');
  
  // 1. Primero verificar estado actual
  console.log('📋 PASO 1: Verificando estado actual...\n');
  const status = await checkLogoStatus();
  
  if (status && status.withoutLogo > 0) {
    console.log(`\n⚠️ Se encontraron ${status.withoutLogo} escuelas sin logo.`);
    
    // Preguntar si continuar (simulado)
    console.log('\n¿Deseas sincronizar los logos? (S/N)');
    // En la práctica, aquí podrías usar readline o hacerlo manual
    
    // 2. Ejecutar sincronización
    console.log('\n📋 PASO 2: Sincronizando logos...\n');
    const result = await syncSchoolLogos();
    
    // 3. Verificar resultado final
    console.log('\n📋 PASO 3: Verificando resultado final...\n');
    await checkLogoStatus();
    
    if (result.success) {
      console.log('\n🎉 ¡SINCRONIZACIÓN COMPLETADA CON ÉXITO!');
    } else {
      console.log('\n⚠️ Sincronización completada con algunos errores.');
    }
    
  } else {
    console.log('\n✅ ¡Todas las escuelas ya tienen logos asignados!');
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  main().catch(console.error);
}

export { main };