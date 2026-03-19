import React from 'react';
import AppMap from './components/Map';

function App() {
  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      {/* Designer Kim: Map 컴포넌트 렌더링. 추후 AudioPlayer 및 사이드바 통합 예정 */}
      <AppMap />
    </div>
  );
}

export default App;
