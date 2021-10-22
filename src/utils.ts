import inquirer from 'inquirer';

export type Node = () => Promise<Node | null>;

export const print = console.log;

export const getInput = (message: string) => {
  return inquirer.prompt({
    type: 'input',
    name: 'result',
    message,
  }).then(res => res.result as string);
};

export const makeChoice = async <T>({ message, choices }: {
  message: string,
  choices: T,
}) => {
  const result = await inquirer.prompt({
    type: 'list',
    name: 'result',
    message,
    choices: choices as any,
  });
  // @ts-ignore
  return result.result as T[number];
};