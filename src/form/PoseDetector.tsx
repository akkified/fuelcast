// iPhone / Android: runs the pose page in a tiny, invisible WebView.

import { useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useDetectorBridge, type PoseDetectorProps } from './bridge';
import { POSE_HTML } from './poseHtml';

export function PoseDetector(props: PoseDetectorProps) {
  const web = useRef<WebView>(null);
  const onRaw = useDetectorBridge((msg) => {
    web.current?.injectJavaScript(`window.fcHandle && window.fcHandle(${JSON.stringify(msg)}); true;`);
  }, props);

  return (
    <View style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }} pointerEvents="none">
      <WebView
        ref={web}
        source={{ html: POSE_HTML, baseUrl: 'https://fuelcast.app/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={(e) => onRaw(e.nativeEvent.data)}
        onError={() => props.onStatus('error', 'The pose engine couldn’t start.')}
        style={{ width: 1, height: 1 }}
      />
    </View>
  );
}
