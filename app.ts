import { readFileSync } from 'fs';
import { downloadText } from './src/Dialogs';

export let appConfig = {
  appkey: '',
  token: '',
  defaultVoice: 'xiaogang',
}

import { chooseProject, getProjectList, newProject } from './src/projectList';
import { makeChoice, print, Node } from './src/utils';

const hello = () => {
  print("☆☆☆ 欢迎使用renpy-speaker ☆☆☆");
  print(">> renpy-speaker是一个通过阿里云语音合成api快速批量为renpy项目生成配音的工具");
  print(">> 使用方向键选择，键盘输入，回车确定");
  print('');
};

const checkAppConfig: Node = async () => {
  const config = JSON.parse(readFileSync('./config.json').toString());
  if(config && config.appkey && config.token) {
    appConfig = { ...appConfig, ...config };
    return mainNode;
  }
  print('未检测到config.json下的appkey和token');
  const r = await makeChoice({
    message: '请从阿里云语音合成工作台中获取appkey和token，然后填写在config.json文件中后重试',
    choices: [
      '重新检测',
      '退出程序',
    ] as const,
  });
  switch(r) {
    case '重新检测':
      return checkAppConfig;
    case '退出程序':
      return null;
  }
};

export const mainNode: Node = async () => {
  const projects = getProjectList();
  if(projects.length > 0) {
    const r = await makeChoice({
      message: '【主菜单】请选择操作',
      choices: [
        '新建项目',
        '选择项目',
        '退出程序',
      ] as const,
    });
    switch (r) {
      case '新建项目':
        return newProject;
      case '选择项目':
        return chooseProject;
      case '退出程序':
        print('再见！');
        return null;
    }
  } else {
    print('>> 当前没有项目，将新建一个项目');
    return newProject;
  }
};


const main = async () => {
  hello();
  let node: Node | null = checkAppConfig;
  try {
    while(node) {
      node = await node();
    }
  } catch (e) {
    console.log(e);
  }
};

main();