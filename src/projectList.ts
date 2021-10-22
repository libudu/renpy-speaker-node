import fs from 'fs';
import { Project } from './Project';
import { getInput, makeChoice, print, Node } from './utils';

export const projectPath = './projects';

// projects目录不存在则创建
if(!fs.existsSync(projectPath)) {
  fs.mkdirSync(projectPath, {});
}

// 读取其中的项目
export const getProjectList = () => fs.readdirSync(projectPath);

// 新建项目
export const newProject: Node = async () => {
  const name = await getInput('请输入项目名');
  const path = `${projectPath}/${name}`;
  if(fs.existsSync(path)) {
    print('该项目已存在，请更换命名或删除旧项目！');
    return newProject;
  }
  fs.mkdirSync(path);
  print(`创建项目【${name}】成功`);
  const project = new Project(name);
  return project.checkDialogFile;
};

// 选择项目
export const chooseProject: Node = async () => {
  const name = await makeChoice({
    message: '请选择项目',
    choices: getProjectList(),
  });
  const project = new Project(name);
  return project.checkDialogFile;
};