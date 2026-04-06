import { r2Service } from '../lib/r2';

async function test() {
  console.log('--- SCAN DE DADOS REAIS ---');
  try {
    const stats = await r2Service.getBucketStats();
    console.log('Total de bytes no R2:', stats.totalSizeBytes);
    console.log('Total de objetos no R2:', stats.objectCount);
    console.log('Arquivos encontrados:');
    stats.objects.forEach(obj => {
      console.log(`- ${obj.key} (${obj.size} bytes) - Modificado em: ${obj.lastModified}`);
    });
  } catch (e) {
    console.error('ERRO NO TESTE:', e);
  }
  console.log('--- FIM DO SCAN ---');
}

test().catch(console.error);
