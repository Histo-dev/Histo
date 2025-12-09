// test-dependencies.ts
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

async function testDependencies() {
  try {
    console.log('✅ TensorFlow.js version:', tf.version.tfjs);
    console.log('✅ TensorFlow.js-node imported successfully');
    
    console.log('📦 Loading Universal Sentence Encoder...');
    const model = await use.load();
    console.log('✅ Universal Sentence Encoder loaded successfully');
    
    // 간단한 임베딩 테스트
    const sentences = ['Hello world'];
    const embeddings = await model.embed(sentences);
    console.log('✅ Embedding test successful, shape:', embeddings.shape);
    
    console.log('\n🎉 All dependencies are working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDependencies();