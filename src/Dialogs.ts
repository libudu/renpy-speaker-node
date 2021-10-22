import { appConfig } from '../app';
import axios from 'axios';
import { writeFile } from 'fs/promises';

export interface Dialog {
  path: string;
  text: string;
  voice: string;
}

export const downloadText = async ({ path, text, voice }: Dialog) => {
  const { appkey, token } = appConfig;
  text = encodeURIComponent(text);
  const params = `appkey=${appkey}&token=${token}&voice=${voice}&text=${text}`;
  const url = `https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/tts?${params}&format=mp3&sample_rate=16000`;
  const response: any = await axios.get(url, { responseType: 'arraybuffer' });
  await writeFile(path, response.data);
};