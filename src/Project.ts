import { makeChoice, Node, print } from "./utils";
import fs from 'fs';
import { projectPath } from "./projectList";
import { appConfig, mainNode } from "../app";
import { downloadText } from "./Dialogs";
import PromisePool from 'es6-promise-pool';

interface RowDialog {
  label: string;
  character: string;
  text: string;
}

export class Project {
  name: string;
  path: string;
  dialogs: RowDialog[] = [];
  character2voice: Record<string, string> = {};

  constructor(name: string) {
    this.name = name;
    this.path = `${projectPath}/${this.name}`;
  }

  // 检测是否存在dialogue.tab文件
  checkDialogFile: Node = async () => {
    const dialogFilepath = `${this.path}/dialogue.tab`;
    // 有则开始操作
    if(fs.existsSync(dialogFilepath)) {
      return this.chooseMenu;
    }
    // 无则跳转到提示
    else {
      return this.chooseNoDialogFile;
    }
  }

  // 不存在dialogue.tab文件时的提示 
  chooseNoDialogFile: Node = async () => {
    const r = await makeChoice({
      message: `projects/${this.name}/下不存在dialogue.tab文件，请用renpy生成对话文件后，将文件放在该目录下`,
      choices: [
        '重新读取dialogue.tab文件',
        '返回菜单',
      ] as const,
    });
    switch(r) {
      case '重新读取dialogue.tab文件':
        return this.checkDialogFile;
      case '返回菜单':
        return mainNode;
    }
  };

  private extractDialogFile = () => {
    const dialogStr = fs.readFileSync(`${this.path}/dialogue.tab`).toString();
    const dialogList = dialogStr
      // 按行划分，去掉首尾
      .split('\r\n').slice(1, -1)
      // 每行切分为成分
      .map(line => line.split('\t'));
    this.dialogs = dialogList.map(line => ({
      label: line[0],
      character: line[1],
      text: line[2],
    }));
    // 提取所有角色
    const charSet = new Set(dialogList.map(dialog => dialog[1]));
    // 去除空角色
    charSet.delete('');
    // 转换为列表
    const characterList = [...charSet.keys()];
    return {
      characterList,
    };
  };

  // 主菜单，提供对项目的操作
  chooseMenu: Node = async () => {
    const { characterList } = this.extractDialogFile();
    this.checkProjectConfig();
    print(`>> 项目路径${this.path}/`);
    print(`>> 该项目共有对话${this.dialogs.length}句，共有${characterList.length}个人物`);
    if(this.dialogs.length > 50) {
      print('>> 该项目对话较多，建议生成全部配音前，先使用试生成确保配置无误');
    }
    const r = await makeChoice({
      message: `你要对【${this.name}】项目做什么？`,
      choices: [
        '配置人物音色',
        '试生成前50句配音',
        '生成全部配音',
        '返回主菜单',
      ] as const,
    });
    switch(r) {
      case '配置人物音色':
        break;
      case '试生成前50句配音':
        await this.downloadTextList(this.dialogs.slice(0, 20));
        break;
      case '生成全部配音':
        await this.downloadTextList(this.dialogs);
        break;
      case '返回主菜单':
        break;
    }
    return mainNode;
  };

  checkVoice = () => {
    
  };
  
  // 检测历史配置记录
  checkProjectConfig = () => {
    const configPath = `${projectPath}/${this.name}/config.json`;
    const configExist = fs.existsSync(configPath);
    if(configExist) {
      const config = JSON.parse(fs.readFileSync(configPath).toString());
      console.log('>> 读取到历史配置记录', config);
      return config;
    }
    return null;
  }

  // 下载文本语音
  downloadTextList = async (dialogs: RowDialog[]) => {
    // 设置并发数
    const r = await makeChoice({
      message: '请选择并发数',
      choices: [
        '2路并发(阿里云免费版)',
        '50路并发(阿里云商业版)',
      ] as const,
    });
    let concurrency = 2;
    if(r == '50路并发(阿里云商业版)') {
      concurrency = 50;
    }
    
    // 是否存在voice目录
    const voicePath = `${this.path}/voice`;
    if(!fs.existsSync(voicePath)) {
      fs.mkdirSync(voicePath);
    }
    
    // 遍历对话生成请求
    let i = 0;
    const info = {
      total: dialogs.length,
      error: 0,
      done: 0,
      exist: 0,
      jump: 0,
    };
    const startTime = Date.now();
    const pool = new PromisePool(() => {
      if(i < info.total) {
        // 数量提示
        if(i > 0 && (i + 1) % 10 == 0) {
          print(`>> 已完成【${i + 1}/${info.total}】条对话`);
        }
        // 下载请求
        const { label, character, text } = dialogs[i];
        i += 1;
        return downloadText({
          path: `${voicePath}/${label}.mp3`,
          voice: this.character2voice[character] || appConfig.defaultVoice,
          text,
        }).then(() => {
          info.done += 1;
        }).catch(err => {
          if(err.response) {
            // 纯符号没有语音
            if(err.response.status == 502) {
              print(`发现纯标点语句【${text}】，跳过`);
              info.jump += 1;
            } else {
              print(`请求${label}出错，错误信息：${err.response.status} ${err.response.data}`)
              info.error += 1;
            }
          } else {
            print(`请求${label}出错，错误信息：${err}`);
            info.error += 1;
          }
        });
      }
    }, concurrency);

    // 等待结果
    await pool.start();
    print('>> 下载完成！');
    print(`>> 总数：${info.total}，下载：${info.done}，已下载跳过：${info.exist}，纯符号跳过：${info.jump}，错误：${info.error}`)
    const costTime = ((Date.now() - startTime) / 1000).toFixed(2);
    print(`>> 总耗时${costTime}s`);
    print('>> 保存历史记录......');

  }
};